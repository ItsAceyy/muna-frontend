"use client";

import { useState } from "react";
import { createResetLink, ResetLink } from "@/lib/admin";

/** Make a password reset link for someone who forgot theirs, to send them yourself.
 *
 *  Muna emails these normally; until a domain is verified it cannot, so this is
 *  the way back in. The link sets the account's password, so send it only to the
 *  account's owner - by WhatsApp or SMS to the number you know is theirs. */
export default function ResetLinkTool() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<ResetLink | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await createResetLink(email.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create a link");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // The link is on screen to copy by hand.
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-border/60 bg-card p-5">
      <h2 className="text-sm font-medium text-foreground">Forgotten password</h2>
      <p className="mt-1 text-xs text-muted-foreground max-w-prose">
        Make a reset link for someone and send it to them yourself. It works once, and making a new one
        cancels the last. Send it only to the account&apos;s owner.
      </p>
      <form onSubmit={submit} className="mt-4 flex flex-wrap gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Their email address"
          aria-label="Email address of the account"
          className="min-w-0 flex-1 rounded-xl border border-border bg-canvas px-3 py-2.5 text-sm text-foreground"
        />
        <button
          type="submit"
          disabled={busy || !email.trim()}
          className="rounded-xl border border-border bg-canvas px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-40 transition-colors"
        >
          {busy ? "Creating..." : "Create link"}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-rust">{error}</p>}
      {result && (
        <div role="status" className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground">
            Link for <span className="font-medium text-foreground">{result.email}</span>, valid for{" "}
            {result.expires_in_minutes} minutes:
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={result.link}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Reset link"
              className="min-w-0 flex-1 rounded-xl border border-border bg-canvas px-3 py-2 text-xs text-muted-foreground"
            />
            <button
              type="button"
              onClick={copy}
              className="shrink-0 rounded-xl border border-border bg-canvas px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
