"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, getMyAccess, getCurrentUser, decideRedirectPath } from "@/lib/auth";
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);

      // These two do not depend on each other, and each is a round trip to a
      // server that may be waking up. Awaiting them in sequence added a whole
      // extra trip to how long sign-in appears to take.
      // A super admin has no property role, so the flag decides where they land.
      const [access, me] = await Promise.all([getMyAccess(), getCurrentUser()]);

      router.push(decideRedirectPath(access, me.is_platform_admin));
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