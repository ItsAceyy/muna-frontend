"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser, logout } from "@/lib/auth";
import { getClients, getPlatformOverview, rejectClient, verifyClient } from "@/lib/admin";
import { ApprovalStatus, ClientSummary, PlatformOverview } from "@/lib/types";

const FILTERS: { value: ApprovalStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending_approval", label: "Awaiting verification" },
  { value: "approved", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

const STATUS: Record<ApprovalStatus, { label: string; className: string }> = {
  pending_approval: { label: "Awaiting verification", className: "bg-gold/15 text-gold" },
  approved: { label: "Verified", className: "bg-sage/15 text-sage" },
  rejected: { label: "Rejected", className: "bg-rust/10 text-rust" },
};

export default function PlatformAdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [clients, setClients] = useState<ClientSummary[] | null>(null);
  const [filter, setFilter] = useState<ApprovalStatus | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then((me) => setAllowed(me.is_platform_admin))
      .catch(() => setAllowed(false));
  }, []);

  const load = useCallback(async () => {
    if (!allowed) return;
    try {
      const [o, c] = await Promise.all([
        getPlatformOverview(),
        getClients(filter === "all" ? undefined : filter),
      ]);
      setOverview(o);
      setClients(c);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the client roster");
    }
  }, [allowed, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (client: ClientSummary, approve: boolean) => {
    setBusy(client.organization_id);
    setError(null);
    try {
      if (approve) {
        await verifyClient(client.organization_id);
      } else {
        await rejectClient(client.organization_id);
      }
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not update ${client.name}: ${err.message}`
          : "Update failed"
      );
    } finally {
      setBusy(null);
    }
  };

  if (allowed === null) return <div className="min-h-screen bg-canvas" />;

  if (!allowed) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Muna</p>
          <h1 className="text-2xl font-display font-medium text-foreground mb-2">
            Not available on this account
          </h1>
          <p className="text-sm text-muted-foreground">
            The platform area is limited to Muna administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-ink text-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">
              Muna · Platform
            </p>
            <p className="text-base font-medium">Clients</p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href="/dashboard"
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              My properties
            </Link>
            <button
              onClick={logout}
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-7">
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-rust/10 border border-rust/20">
            <p className="text-sm text-rust">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Stat label="Clients" value={overview?.total_clients} emphasis />
          <Stat label="Awaiting you" value={overview?.awaiting_verification} />
          <Stat label="Verified" value={overview?.verified_clients} />
          <Stat label="Rejected" value={overview?.rejected} />
        </div>

        <div className="flex flex-wrap gap-1 mb-4 p-1 rounded-xl bg-secondary w-fit">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={
                filter === f.value
                  ? "px-3.5 py-2 rounded-lg text-sm font-medium bg-card text-foreground shadow-xs"
                  : "px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {clients === null ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-card border border-border/60 animate-pulse"
              />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border/60 px-6 py-14 text-center">
            <p className="text-sm text-muted-foreground">
              {filter === "pending_approval"
                ? "Nothing is waiting on you."
                : "No clients here yet."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {clients.map((c) => {
              const status = STATUS[c.approval_status];
              const pending = c.approval_status === "pending_approval";
              return (
                <li
                  key={c.organization_id}
                  className="bg-card rounded-2xl border border-border/60 shadow-sm p-5"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-base font-medium text-foreground truncate">
                          {c.name}
                        </p>
                        <span
                          className={`text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded-full ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {c.owner_name || c.owner_email || "No owner on record"}
                        {c.owner_name && c.owner_email ? ` · ${c.owner_email}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                        {c.org_type === "company" ? "Company" : "Individual"} · signed up{" "}
                        {new Date(c.created_at).toLocaleDateString([], {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {" · "}
                        {c.property_count}{" "}
                        {c.property_count === 1 ? "property" : "properties"}
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {pending ? (
                        <>
                          <button
                            onClick={() => decide(c, true)}
                            disabled={busy === c.organization_id}
                            className="px-4 py-2.5 rounded-xl bg-sage text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => decide(c, false)}
                            disabled={busy === c.organization_id}
                            className="px-4 py-2.5 rounded-xl border border-border bg-canvas text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-40 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      ) : c.approval_status === "rejected" ? (
                        <button
                          onClick={() => decide(c, true)}
                          disabled={busy === c.organization_id}
                          className="px-4 py-2.5 rounded-xl border border-border bg-canvas text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-40 transition-colors"
                        >
                          Verify after all
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-xs text-muted-foreground mt-8 max-w-prose">
          Verifying a client lets them add properties to their account. Muna
          administrators see the client roster and who is asking — never what happens
          inside a client&apos;s property.
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: number | undefined;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        emphasis
          ? "rounded-2xl border border-border/60 bg-ink text-primary-foreground p-4"
          : "rounded-2xl border border-border/60 bg-card p-4"
      }
    >
      <p
        className={`text-xs uppercase tracking-wide mb-2 ${
          emphasis ? "text-primary-foreground/60" : "text-muted-foreground"
        }`}
      >
        {label}
      </p>
      <p className="text-2xl font-display font-medium tabular-nums leading-none">
        {value ?? "—"}
      </p>
    </div>
  );
}
