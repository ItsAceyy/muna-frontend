"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { signup } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One number", test: (pw) => /[0-9]/.test(pw) },
];

function RequirementRow({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        key={met ? "met" : "unmet"}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ease-out ${
          met
            ? "bg-sage border-sage animate-pop"
            : "bg-transparent border-border"
        }`}
      >
        {met ? (
          <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
        ) : (
          <X className="h-3 w-3 text-muted-foreground/40" strokeWidth={2.5} />
        )}
      </span>
      <span
        className={`transition-colors duration-300 ${
          met ? "text-sage font-medium" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
      <style jsx>{`
        @keyframes pop {
          0% { transform: scale(0.6); }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-pop {
          animation: pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<"individual" | "organization">("individual");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const unmetRequirements = PASSWORD_REQUIREMENTS.filter((r) => !r.test(password));
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (unmetRequirements.length > 0) {
      setError("Password does not meet all requirements");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (mode === "organization" && !orgName.trim()) {
      setError("Organization name is required");
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, fullName, mode, orgName);
      router.push("/dashboard");
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
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-8">
      <Card className="w-full max-w-sm border border-border/60 shadow-sm">
        <CardHeader>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Muna</p>
          <CardTitle className="text-2xl font-display font-medium text-foreground">Create your account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="space-y-1.5 pt-1.5">
                {PASSWORD_REQUIREMENTS.map((req) => (
                  <RequirementRow
                    key={req.label}
                    met={req.test(password)}
                    label={req.label}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword.length > 0 && (
                <div className="pt-1.5">
                  <RequirementRow
                    met={passwordsMatch}
                    label={passwordsMatch ? "Passwords match" : "Passwords do not match"}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Account type</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("individual")}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                    mode === "individual"
                      ? "bg-ink text-gold"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  Individual
                </button>
                <button
                  type="button"
                  onClick={() => setMode("organization")}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                    mode === "organization"
                      ? "bg-ink text-gold"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  Organization
                </button>
              </div>
            </div>

            {mode === "organization" && (
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization name</Label>
                <Input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
              </div>
            )}

            {error && <p className="text-sm text-rust">{error}</p>}

            <Button
              type="submit"
              disabled={loading || unmetRequirements.length > 0 || passwordsMismatch}
              className="w-full bg-gold text-ink hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-gold font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}