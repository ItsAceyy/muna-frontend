"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, verifyTwoFactor, getMyAccess, getCurrentUser, decideRedirectPath } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // On by default: most people sign in on their own phone or the desk's own
  // device. Unticking it keeps the session to a 12-hour shift.
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Second step, for accounts with two-factor sign-in.
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);

  async function finishSignIn() {
    // These two do not depend on each other, and each is a round trip to a
      // server that may be waking up. Awaiting them in sequence added a whole
      // extra trip to how long sign-in appears to take.
      // A super admin has no property role, so the flag decides where they land.
      const [access, me] = await Promise.all([getMyAccess(), getCurrentUser()]);

      router.push(decideRedirectPath(access, me.is_platform_admin));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(email, password, rememberMe);
      if (result.twoFactor) {
        setChallenge(result.challenge);
        return;
      }
      await finishSignIn();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCode(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge) return;
    setError(null);
    setLoading(true);
    try {
      await verifyTwoFactor(email, challenge, code, trustDevice);
      await finishSignIn();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      if (err instanceof ApiError && /timed out/i.test(err.message)) {
        setChallenge(null);
        setCode("");
      }
    } finally {
      setLoading(false);
    }
  }

  if (challenge) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <Card className="w-full max-w-sm border border-border/60 shadow-sm">
          <CardHeader>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Muna</p>
            <CardTitle className="text-2xl font-display font-medium text-foreground">Enter your code</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Open your authenticator app and enter the 6-digit code for Muna.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                  required
                />
              </div>
              <label className="flex items-start gap-2.5 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[var(--ink)]"
                />
                <span>
                  Trust this device for 30 days
                  <span className="block text-xs text-muted-foreground">You won&apos;t be asked for a code here again until then.</span>
                </span>
              </label>
              {error && <p className="text-sm text-rust">{error}</p>}
              <Button type="submit" disabled={loading || code.length !== 6} className="w-full">
                {loading ? "Checking..." : "Sign in"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setChallenge(null);
                  setCode("");
                  setError(null);
                }}
                className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Back
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <Card className="w-full max-w-sm border border-border/60 shadow-sm">
        <CardHeader>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Muna</p>
          <CardTitle className="text-2xl font-display font-medium text-foreground">Sign in</CardTitle>
        </CardHeader>
        <CardContent>
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
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <label className="flex items-start gap-2.5 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[var(--ink)]"
              />
              <span>
                Keep me signed in
                <span className="block text-xs text-muted-foreground">
                  Untick this on a shared or public computer.
                </span>
              </span>
            </label>
            {error && <p className="text-sm text-rust">{error}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-ink hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-4">
            <Link
              href="/forgot-password"
              className="block text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground mb-2"
            >
              Forgot your password?
            </Link>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-gold font-medium hover:underline">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}