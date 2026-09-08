"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      // A 429 is the one failure worth naming - anything else, including an
      // address with no account, lands on the same confirmation as success,
      // because saying more would reveal who has an account.
      if (err instanceof ApiError && err.status === 429) {
        setError("Too many attempts. Wait a few minutes and try again.");
      } else if (err instanceof ApiError && err.status === 422) {
        setError("That doesn't look like a valid email address.");
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1">
              Muna
            </p>
            <CardTitle className="font-display font-medium">Check your email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              If <span className="text-foreground">{email}</span> has an account, a
              reset link is on its way. It works once and expires in an hour.
            </p>
            <p className="text-sm text-muted-foreground">
              Nothing arrived? Check spam, then{" "}
              <button
                onClick={() => setSent(false)}
                className="text-foreground underline underline-offset-2"
              >
                try again
              </button>
              .
            </p>
            <Link
              href="/login"
              className="block text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Back to sign in
            </Link>
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
          <CardTitle className="font-display font-medium">Forgot your password</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Enter the email you sign in with and we&apos;ll send you a link to choose a
            new password.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-rust">{error}</p>}

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-ink text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>

          <Link
            href="/login"
            className="block text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground mt-4 text-center"
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
