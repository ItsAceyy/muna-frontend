"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mirrors the rule the API enforces, so the requirements are visible while typing
// rather than arriving as a 422 after submitting.
const REQUIREMENTS: { label: string; test: (pw: string) => boolean }[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One number", test: (pw) => /[0-9]/.test(pw) },
];

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
          met ? "bg-sage border-sage" : "bg-transparent border-border"
        }`}
      >
        {met ? (
          <Check className="h-3 w-3 text-white" aria-hidden="true" />
        ) : (
          <X className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
        )}
      </span>
      <span className={met ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params?.token ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const meetsAll = REQUIREMENTS.every((r) => r.test(password));
  const matches = password.length > 0 && password === confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/auth/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({ token, new_password: password }),
      });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError("Too many attempts. Wait a few minutes and try again.");
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Request a new link and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1">
              Muna
            </p>
            <CardTitle className="font-display font-medium">Password changed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You can sign in with your new password now.
            </p>
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-ink text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1">
            Muna
          </p>
          <CardTitle className="font-display font-medium">Choose a new password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="space-y-1.5 pt-1.5">
                {REQUIREMENTS.map((r) => (
                  <Requirement key={r.label} met={r.test(password)} label={r.label} />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <PasswordInput
                id="confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              {confirm.length > 0 && (
                <div className="pt-1.5">
                  <Requirement met={matches} label="Passwords match" />
                </div>
              )}
            </div>

            {error && (
              <div className="space-y-2">
                <p className="text-sm text-rust">{error}</p>
                <Link
                  href="/forgot-password"
                  className="block text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  Request a new link
                </Link>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !meetsAll || !matches}
              className="w-full bg-ink text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {loading ? "Saving..." : "Change password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
