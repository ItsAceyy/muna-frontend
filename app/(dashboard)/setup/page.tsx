"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { InviteDetails, Organization, PropertyConfig, PropertyResponse, Unit } from "@/lib/types";
import { getPropertyConfig, MODULE_LABELS } from "@/lib/vertical";
import BusinessTypePicker, { useBusinessTypes } from "@/components/BusinessTypePicker";
import UnitSetupToolbar from "@/components/UnitSetupToolbar";
import InviteOutcome from "@/components/InviteOutcome";
import { inputClass, labelClass, primaryButton, quietButton, secondaryButton } from "@/components/setup-styles";
import { Skeleton } from "@/components/ui/skeleton";

// Guided first-run setup for an owner: what kind of business, its spaces, its team.
//
// Progress lives in the URL (?org=&property=&step=), not in component state, so a
// refresh or a return visit resumes where the owner left off. The property is
// created at the end of step one; everything after it is optional and can be
// skipped, because the same tools are on the property page for later.

type Step = "property" | "spaces" | "team" | "done";

const fieldClass = `w-full ${inputClass}`;

export default function SetupPage() {
  return (
    <Suspense fallback={<SetupShell><SetupSkeleton /></SetupShell>}>
      <SetupWizard />
    </Suspense>
  );
}

function SetupWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const orgParam = params.get("org");
  const propertyId = params.get("property");
  const step: Step = propertyId ? ((params.get("step") as Step) || "spaces") : "property";

  const [org, setOrg] = useState<Organization | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [config, setConfig] = useState<PropertyConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Organization[]>("/me/organizations")
      .then((orgs) => {
        if (cancelled) return;
        const found = orgParam ? orgs.find((o) => o.id === orgParam) : orgs[0];
        if (found) setOrg(found);
        else setOrgError("We couldn't find an organization to set up.");
      })
      .catch((err) => {
        if (!cancelled) setOrgError(err instanceof Error ? err.message : "Failed to load your organization");
      });
    return () => {
      cancelled = true;
    };
  }, [orgParam]);

  useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;
    getPropertyConfig(propertyId)
      .then((c) => {
        if (!cancelled) setConfig(c);
      })
      .catch(() => {
        // The steps fall back to generic wording; nothing here blocks on it.
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const goTo = useCallback(
    (next: Step, pid = propertyId) => {
      const q = new URLSearchParams();
      if (org) q.set("org", org.id);
      if (pid) q.set("property", pid);
      if (next !== "property") q.set("step", next);
      router.replace(`/setup?${q.toString()}`);
    },
    [org, propertyId, router]
  );

  if (orgError) {
    return (
      <SetupShell>
        <p className="text-sm text-rust">{orgError}</p>
        <Link href="/dashboard" className={`${secondaryButton} inline-block mt-4`}>
          Back to dashboard
        </Link>
      </SetupShell>
    );
  }

  if (!org) {
    return (
      <SetupShell>
        <SetupSkeleton />
      </SetupShell>
    );
  }

  if (org.approval_status !== "approved") {
    return (
      <SetupShell>
        <AwaitingApproval org={org} />
      </SetupShell>
    );
  }

  const vocab = config?.config;
  // A business with nothing to divide into spaces skips straight past that step.
  const hasSpaces = vocab?.has_spaces ?? true;
  const spacesLabel = vocab?.space_noun_plural || "Units";

  const steps: { key: Step; label: string }[] = [
    { key: "property", label: "Property" },
    ...(hasSpaces ? [{ key: "spaces" as Step, label: spacesLabel }] : []),
    { key: "team", label: "Team" },
    { key: "done", label: "Done" },
  ];
  const current = step === "spaces" && !hasSpaces ? "team" : step;

  return (
    <SetupShell orgName={org.name}>
      <StepIndicator steps={steps} current={current} />

      {current === "property" && (
        <PropertyStep
          organizationId={org.id}
          onCreated={(prop) => goTo("spaces", prop.id)}
        />
      )}

      {current === "spaces" && propertyId && (
        <SpacesStep
          propertyId={propertyId}
          organizationId={org.id}
          noun={vocab?.space_noun || "Unit"}
          nounPlural={spacesLabel}
          onNext={() => goTo("team")}
        />
      )}

      {current === "team" && propertyId && (
        <TeamStep
          propertyId={propertyId}
          onBack={hasSpaces ? () => goTo("spaces") : undefined}
          onNext={() => goTo("done")}
        />
      )}

      {current === "done" && propertyId && <DoneStep propertyId={propertyId} config={config} />}
    </SetupShell>
  );
}

function SetupShell({ orgName, children }: { orgName?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Muna</p>
            {orgName && <p className="mt-1 text-sm text-muted-foreground">{orgName}</p>}
          </div>
          <Link href="/dashboard" className={quietButton}>
            Exit setup
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}

function SetupSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}

function StepIndicator({ steps, current }: { steps: { key: Step; label: string }[]; current: Step }) {
  const currentIndex = steps.findIndex((s) => s.key === current);
  return (
    <ol className="mb-10 flex items-center gap-2 sm:gap-3">
      {steps.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={s.key} className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                done
                  ? "bg-ink text-primary-foreground"
                  : active
                    ? "border border-ink text-foreground"
                    : "border border-border text-muted-foreground"
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
            </span>
            <span
              className={`truncate text-sm ${active ? "font-medium text-foreground" : "text-muted-foreground"} ${
                active ? "" : "hidden sm:inline"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && <span className="h-px w-4 shrink-0 bg-border sm:w-8" />}
          </li>
        );
      })}
    </ol>
  );
}

function StepHeading({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl font-medium tracking-tight text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{lead}</p>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">{children}</div>;
}

function AwaitingApproval({ org }: { org: Organization }) {
  const rejected = org.approval_status === "rejected";
  return (
    <>
      <StepHeading
        title={rejected ? "We couldn't approve this account" : "Your account is being reviewed"}
        lead={
          rejected
            ? "Contact support if you believe this is a mistake."
            : "Every new organization is checked before it goes live. Once it's approved, you can set up your first property here."
        }
      />
      <Link href="/dashboard" className={secondaryButton}>
        Back to dashboard
      </Link>
    </>
  );
}

// --- Step 1: the property ---------------------------------------------------

function PropertyStep({
  organizationId,
  onCreated,
}: {
  organizationId: string;
  onCreated: (prop: PropertyResponse) => void;
}) {
  const types = useBusinessTypes();
  const [selected, setSelected] = useState("apartment");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chosen = types.find((t) => t.key === selected) ?? types[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Give the property a name");
      return;
    }
    setSubmitting(true);
    try {
      const prop = await apiFetch<PropertyResponse>("/me/properties", {
        method: "POST",
        body: JSON.stringify({
          organization_id: organizationId,
          name: name.trim(),
          // The backend derives the vertical from this and switches on its modules.
          property_type: chosen.property_type,
          address: address.trim() || undefined,
        }),
      });
      onCreated(prop);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create the property");
      setSubmitting(false);
    }
  }

  return (
    <>
      <StepHeading
        title="Tell us about your property"
        lead="What kind of business it is decides which features are switched on and the words the app uses."
      />
      <form onSubmit={handleSubmit} className="space-y-6">
        <Panel>
          <fieldset>
            <legend className="mb-3 text-sm font-medium text-foreground">What kind of business is this?</legend>
            <BusinessTypePicker types={types} selected={selected} onSelect={setSelected} />
          </fieldset>
        </Panel>

        <Panel>
          <div className="space-y-4">
            <div>
              <label htmlFor="property-name" className={labelClass}>
                Property name
              </label>
              <input
                id="property-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
                placeholder="e.g. Kilimani Heights"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="property-address" className={labelClass}>
                Address <span className="font-normal">(optional)</span>
              </label>
              <input
                id="property-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={fieldClass}
                placeholder="e.g. Argwings Kodhek Rd, Nairobi"
              />
            </div>
          </div>
        </Panel>

        {error && <p className="text-sm text-rust">{error}</p>}

        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className={primaryButton}>
            {submitting ? "Creating..." : "Create property"}
          </button>
        </div>
      </form>
    </>
  );
}

// --- Step 2: spaces (units, suites, rooms) -----------------------------------

function SpacesStep({
  propertyId,
  organizationId,
  noun,
  nounPlural,
  onNext,
}: {
  propertyId: string;
  organizationId: string;
  noun: string;
  nounPlural: string;
  onNext: () => void;
}) {
  const [units, setUnits] = useState<Unit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Unit[]>(`/properties/${propertyId}/units`)
      .then((data) => {
        if (!cancelled) setUnits(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load units");
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId, version]);

  const count = units?.length ?? 0;
  const lower = nounPlural.toLowerCase();

  return (
    <>
      <StepHeading
        title={`Add your ${lower}`}
        lead={`Start by naming your ${noun.toLowerCase()} types, then generate a numbered range or import a spreadsheet. You can also add them one at a time.`}
      />
      <Panel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {error ? (
              <p className="text-sm text-rust">{error}</p>
            ) : units === null ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <p className="font-display text-3xl font-medium text-foreground">{count.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {count === 1 ? noun.toLowerCase() : lower} set up
                </p>
              </>
            )}
          </div>
          <UnitSetupToolbar
            propertyId={propertyId}
            organizationId={organizationId}
            existingUnitNumbers={units?.map((u) => u.unit_number) ?? []}
            onChanged={() => setVersion((v) => v + 1)}
          />
        </div>
      </Panel>

      <div className="mt-6 flex items-center justify-end gap-2">
        {count === 0 && (
          <button type="button" onClick={onNext} className={quietButton}>
            Skip for now
          </button>
        )}
        <button type="button" onClick={onNext} disabled={count === 0} className={primaryButton}>
          Continue
        </button>
      </div>
    </>
  );
}

// --- Step 3: the team -------------------------------------------------------

type TeamRole = "manager" | "guard";

const ROLE_HINTS: Record<TeamRole, string> = {
  manager: "Runs the property day to day: residents, staff and maintenance.",
  guard: "Works the gate or front desk: checks visitors in and out.",
};

function TeamStep({
  propertyId,
  onBack,
  onNext,
}: {
  propertyId: string;
  onBack?: () => void;
  onNext: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("manager");
  const [sent, setSent] = useState<{ role: TeamRole; invite: InviteDetails }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const address = email.trim();
    if (!address) {
      setError("Enter an email address");
      return;
    }
    setSubmitting(true);
    try {
      const invite = await apiFetch<InviteDetails>(`/properties/${propertyId}/invites`, {
        method: "POST",
        body: JSON.stringify({ email: address, role }),
      });
      setSent((prev) => [...prev, { role, invite }]);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send the invite");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <StepHeading
        title="Invite your team"
        lead="We email each person a link to set up their account. You can invite more people later from the property page."
      />
      <Panel>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <label htmlFor="invite-email" className={labelClass}>
                Email
              </label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label htmlFor="invite-role" className={labelClass}>
                Role
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as TeamRole)}
                className={fieldClass}
              >
                <option value="manager">Manager</option>
                <option value="guard">Guard</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{ROLE_HINTS[role]}</p>
          {error && <p className="text-sm text-rust">{error}</p>}
          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className={secondaryButton}>
              {submitting ? "Sending..." : "Send invite"}
            </button>
          </div>
        </form>

        {sent.length > 0 && (
          <ul className="mt-5 divide-y divide-border/60 border-t border-border/60">
            {sent.map(({ role: r, invite }) => (
              <li key={invite.token} className="space-y-2 py-3 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-foreground">{invite.email}</span>
                  <span className="shrink-0 text-xs capitalize text-muted-foreground">{r}</span>
                </div>
                <InviteOutcome invite={invite} />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="mt-6 flex items-center justify-between gap-2">
        <div>
          {onBack && (
            <button type="button" onClick={onBack} className={quietButton}>
              Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {sent.length === 0 && (
            <button type="button" onClick={onNext} className={quietButton}>
              Skip for now
            </button>
          )}
          <button type="button" onClick={onNext} disabled={sent.length === 0} className={primaryButton}>
            Continue
          </button>
        </div>
      </div>
    </>
  );
}

// --- Step 4: done -----------------------------------------------------------

function DoneStep({ propertyId, config }: { propertyId: string; config: PropertyConfig | null }) {
  const modules = config?.enabled_modules ?? [];
  return (
    <>
      <StepHeading
        title={config ? `${config.name} is ready` : "Your property is ready"}
        lead="You can add more units and invite more people from the property page at any time."
      />
      {config && (
        <Panel>
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Business type</dt>
              <dd className="text-right text-foreground">{config.business_type_label ?? config.config.label}</dd>
            </div>
            {modules.length > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 text-muted-foreground">Switched on</dt>
                <dd className="text-right text-foreground">
                  {modules.map((m) => MODULE_LABELS[m] ?? m).join(", ")}
                </dd>
              </div>
            )}
          </dl>
        </Panel>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        <Link href="/dashboard" className={secondaryButton}>
          Back to dashboard
        </Link>
        <Link href={`/dashboard/properties/${propertyId}`} className={primaryButton}>
          Open property
        </Link>
      </div>
    </>
  );
}
