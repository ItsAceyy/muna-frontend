"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X } from "lucide-react";
import {
  getInviteDetails,
  acceptInvite,
  acceptInviteWithExistingAccount,
  getCurrentUser,
  getMyAccess,
  decideRedirectPath,
} from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { InviteDetails } from "@/lib/types";
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

const ROLE_LABELS: Record<string, string> = {
  tenant: "resident",
  staff: "staff member",
  manager: "manager",
  owner: "owner",
  guard: "guard",
};

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;

  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [lookupLoading, setLookupLoading] = useState(true);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  // Someone who already uses Muna accepts by signing in, not by creating an account.
  const [mode, setMode] = useState<"create" | "signin">("create");
  const [signinNotice, setSigninNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvite() {
      setLookupLoading(true);
      setLookupError(null);
      try {
        const data = await getInviteDetails(token);
        setInvite(data);
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 404) {
            setLookupError("This invite link is invalid.");
          } else if (err.status === 410) {
            setLookupError("This invite has expired or has already been used.");
          } else {
            setLookupError(err.message);
          }
        } else {
          setLookupError("Something went wrong. Please try again.");
        }
      } finally {
        setLookupLoading(false);
      }
    }
    if (token) loadInvite();
  }, [token]);

  const unmetRequirements = PASSWORD_REQUIREMENTS.filter((r) => !r.test(password));
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!invite) return;

    if (unmetRequirements.length > 0) {
      setSubmitError("Password does not meet all requirements");
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match");
      return;
    }
    if (!fullName.trim()) {
      setSubmitError("Full name is required");
      return;
    }

    setSubmitLoading(true);
    try {
      await acceptInvite(token, fullName, password, invite.email);
      const access = await getMyAccess();
      router.push(decideRedirectPath(access));
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        switchToSignin("You already have a Muna account. Sign in to add this invite to it.");
      } else if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitLoading(false);
    }
  }

  function switchToSignin(notice: string | null) {
    setMode("signin");
    setSigninNotice(notice);
    setSubmitError(null);
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault();
    if (!invite) return;
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      await acceptInviteWithExistingAccount(token, invite.email, password);
      const [access, me] = await Promise.all([getMyAccess(), getCurrentUser()]);
      router.push(decideRedirectPath(access, me.is_platform_admin));
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  }

  if (lookupLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading invite...</p>
      </div>
    );
  }

  if (lookupError || !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-8">
        <Card className="w-full max-w-sm border border-border/60 shadow-sm">
          <CardHeader>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Muna</p>
            <CardTitle className="text-2xl font-display font-medium text-foreground">
              Invite unavailable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-rust">{lookupError}</p>
            <p className="text-sm text-muted-foreground text-center mt-4">
              <Link href="/login" className="text-gold font-medium hover:underline">
                Go to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleLabel = ROLE_LABELS[invite.role] ?? invite.role;

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-8">
      <Card className="w-full max-w-sm border border-border/60 shadow-sm">
        <CardHeader>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Muna</p>
          <CardTitle className="text-2xl font-display font-medium text-foreground">
            You&apos;ve been invited
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Join{" "}
            <span className="font-medium text-foreground">
              {invite.property_name ?? "this property"}
            </span>
            {invite.organization_name && (
              <> under {invite.organization_name}</>
            )}{" "}
            as a <span className="font-medium text-foreground">{roleLabel}</span>.
          </p>
        </CardHeader>
        <CardContent>
          {mode === "signin" ? (
            <form onSubmit={handleSignin} className="space-y-4">
              {signinNotice && <p className="text-sm text-muted-foreground">{signinNotice}</p>}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={invite.email} disabled readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signinPassword">Password</Label>
                <PasswordInput
                  id="signinPassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              {submitError && <p className="text-sm text-rust">{submitError}</p>}
              <Button type="submit" disabled={submitLoading || !password} className="w-full">
                {submitLoading ? "Signing in..." : "Sign in and accept"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                <Link href="/forgot-password" className="hover:text-foreground underline-offset-2 hover:underline">
                  Forgot your password?
                </Link>
              </p>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={invite.email} disabled readOnly />
            </div>
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
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
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
              <PasswordInput
                id="confirmPassword"
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

            {submitError && <p className="text-sm text-rust">{submitError}</p>}

            <Button
              type="submit"
              disabled={submitLoading || unmetRequirements.length > 0 || passwordsMismatch}
              className="w-full bg-gold text-ink hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitLoading ? "Setting up your account..." : "Accept invite"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Already use Muna?{" "}
              <button
                type="button"
                onClick={() => switchToSignin(null)}
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                Sign in instead
              </button>
            </p>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}