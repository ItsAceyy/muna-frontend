"use client";

import { useState } from "react";
import { setPaidUntil, setTrial } from "@/lib/admin";
import { AdminClientBilling, SubscriptionStatus } from "@/lib/types";

export const SUBSCRIPTION_STYLES: Record<SubscriptionStatus, { label: string; className: string }> = {
  trial: { label: "Trial", className: "bg-secondary text-muted-foreground" },
  active: { label: "Paid", className: "bg-sage/15 text-sage" },
  // Grace and locked both need someone to act, so they are allowed colour.
  grace: { label: "Payment due", className: "bg-gold/15 text-gold" },
  locked: { label: "Locked", className: "bg-rust/10 text-rust" },
};

// Billing dates are calendar days in UTC: "paid until 31 Jan" is stored as the end
// of 31 Jan UTC. Shown in local time that is already 1 Feb in Nairobi, so every
// billing date is read and written in UTC to keep the day the admin typed.
export function formatDay(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** YYYY-MM-DD in UTC, for a date input. */
function toDateInput(iso: string | null): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

const smallButton =
  "rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-40 transition-colors";
const field =
  "rounded-lg border border-border bg-canvas px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/35";

/** A client's trial and each property's payment, for the platform admin.
 *
 *  Payment is collected outside Muna. When it arrives, set the property's
 *  "paid until" date here and it reopens immediately. */
export default function ClientBilling({
  billing,
  onChanged,
}: {
  billing: AdminClientBilling;
  onChanged: (next: AdminClientBilling) => void;
}) {
  const [months, setMonths] = useState(1);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(key: string, action: () => Promise<AdminClientBilling>) {
    setBusy(key);
    setError(null);
    try {
      onChanged(await action());
      setDrafts((d) => {
        const rest = { ...d };
        delete rest[key];
        return rest;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 border-t border-border/60 pt-4 space-y-4">
      {error && <p className="text-sm text-rust">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Free trial</p>
          <p className="text-sm text-foreground">
            {billing.trial_ends_at ? `Ends ${formatDay(billing.trial_ends_at)}` : "No trial set"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            aria-label="Trial length"
            className={field}
          >
            <option value={1}>1 month</option>
            <option value={2}>2 months</option>
            <option value={3}>3 months</option>
          </select>
          <button
            type="button"
            disabled={busy === "trial"}
            onClick={() => run("trial", () => setTrial(billing.organization_id, months))}
            className={smallButton}
          >
            {billing.trial_ends_at ? "Restart from today" : "Start trial"}
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Properties</p>
        {billing.properties.length === 0 ? (
          <p className="text-sm text-muted-foreground">No properties yet.</p>
        ) : (
          <ul className="space-y-2">
            {billing.properties.map((p) => {
              const style = SUBSCRIPTION_STYLES[p.status];
              const draft = drafts[p.property_id] ?? toDateInput(p.paid_until);
              const changed = draft !== toDateInput(p.paid_until);
              return (
                <li
                  key={p.property_id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-canvas px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{p.name}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${style.className}`}
                      >
                        {style.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {p.paid_until ? `Paid until ${formatDay(p.paid_until)}` : "Not paid yet"}
                      {p.status === "grace" && p.locks_at ? ` · locks ${formatDay(p.locks_at)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="sr-only" htmlFor={`paid-${p.property_id}`}>
                      Paid until
                    </label>
                    <input
                      id={`paid-${p.property_id}`}
                      type="date"
                      value={draft}
                      onChange={(e) => setDrafts((d) => ({ ...d, [p.property_id]: e.target.value }))}
                      className={field}
                    />
                    <button
                      type="button"
                      disabled={!changed || busy === p.property_id}
                      onClick={() => run(p.property_id, () => setPaidUntil(p.property_id, draft || null))}
                      className={smallButton}
                    >
                      Save
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
