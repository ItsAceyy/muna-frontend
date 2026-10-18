"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { enableTwoFactor, logout, startTwoFactorSetup, TwoFactorSetup as Setup } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";

/** Shown on the admin page until two-factor sign-in is on.
 *
 *  Platform-admin powers reach every client, so they need a session signed in
 *  with an authenticator code. Setup is: scan the QR code, type the first code.
 *  The device is trusted for 30 days afterwards, so it is not asked for often. */
export default function TwoFactorSetup({ email, onDone }: { email: string; onDone: () => void }) {
  const [setup, setSetup] = useState<Setup | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyOn, setAlreadyOn] = useState(false);

  async function begin() {
    setBusy(true);
    setError(null);
    try {
      const s = await startTwoFactorSetup();
      setSetup(s);
      setQr(await QRCode.toDataURL(s.otpauth_uri, { margin: 1, width: 200 }));
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setAlreadyOn(true);
      } else {
        setError(err instanceof Error ? err.message : "Could not start setup");
      }
    } finally {
      setBusy(false);
    }
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await enableTwoFactor(email, code);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code didn't work");
    } finally {
      setBusy(false);
    }
  }

  if (alreadyOn) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="font-display text-xl font-medium text-foreground">Sign in again with your code</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-prose">
          Two-factor sign-in is already on for this account, but this session started without it. Sign out and back
          in, and enter the code from your authenticator app.
        </p>
        <button
          onClick={logout}
          className="mt-4 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <h2 className="font-display text-xl font-medium text-foreground">Turn on two-factor sign-in</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-prose">
        Platform admin powers reach every client, so they need a code from an authenticator app as well as your
        password. Google Authenticator, Microsoft Authenticator or Authy all work. Each device you trust skips the
        code for 30 days.
      </p>

      {!setup ? (
        <button
          onClick={begin}
          disabled={busy}
          className="mt-5 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "Starting..." : "Set it up"}
        </button>
      ) : (
        <form onSubmit={confirm} className="mt-5 grid gap-6 sm:grid-cols-[auto_1fr] items-start">
          <div className="rounded-xl border border-border bg-white p-2 w-fit">
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="QR code to add Muna to your authenticator app" width={200} height={200} />
            )}
          </div>
          <div className="space-y-4">
            <ol className="list-decimal pl-5 text-sm text-foreground space-y-1">
              <li>In your authenticator app, add an account and scan this code.</li>
              <li>Type the 6-digit code it shows.</li>
            </ol>
            <p className="text-xs text-muted-foreground">
              Can&apos;t scan? Enter this key instead:{" "}
              <span className="font-mono text-foreground break-all select-all">{setup.secret}</span>
            </p>
            <div className="flex gap-2">
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                aria-label="Code from your authenticator app"
                className="w-36 rounded-xl border border-border bg-canvas px-3 py-2.5 text-sm tracking-widest text-foreground"
              />
              <button
                type="submit"
                disabled={busy || code.length !== 6}
                className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                {busy ? "Checking..." : "Turn on"}
              </button>
            </div>
          </div>
        </form>
      )}
      {error && <p className="mt-3 text-sm text-rust">{error}</p>}
    </div>
  );
}
