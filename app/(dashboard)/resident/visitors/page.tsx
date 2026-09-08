"use client";

import { useCallback, useEffect, useState } from "react";
import { useProperty } from "@/lib/property-context";
import {
  getMyGuestInvites,
  getMyUnits,
  getMyVisitorHistory,
  guestCheckinUrl,
  inviteGuest,
} from "@/lib/resident";
import { GuestInviteRecord, MyVisitorHistoryItem, Unit } from "@/lib/types";
import {
  Badge,
  Card,
  EmptyState,
  ErrorNote,
  Field,
  PageHeader,
  PrimaryButton,
  Skeletons,
  formatDateTime,
  inputClass,
} from "../resident-ui";

const INVITE_STATUS: Record<string, { label: string; tone: "sage" | "gold" | "rust" | "muted" }> = {
  pending: { label: "Expected", tone: "gold" },
  checked_in: { label: "On site", tone: "sage" },
  checked_out: { label: "Left", tone: "muted" },
  expired: { label: "Expired", tone: "muted" },
  revoked: { label: "Revoked", tone: "rust" },
};

export default function ResidentVisitorsPage() {
  const { config, loadError: accessError, loading: accessLoading } = useProperty();

  const [invites, setInvites] = useState<GuestInviteRecord[] | null>(null);
  const [history, setHistory] = useState<MyVisitorHistoryItem[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [unitId, setUnitId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState<GuestInviteRecord | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const [i, h, u] = await Promise.all([
        getMyGuestInvites(),
        getMyVisitorHistory(),
        getMyUnits(),
      ]);
      setInvites(i);
      setHistory(h);
      setUnits(u);
      setUnitId((prev) => prev || (u.length ? u[0].id : ""));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your visitors");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!unitId || !name.trim()) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await inviteGuest(unitId, name.trim(), phone.trim(), email.trim());
      setJustCreated(created);
      setCopied(false);
      setName("");
      setPhone("");
      setEmail("");
      setOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create the invite");
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async (token: string) => {
    try {
      await navigator.clipboard.writeText(guestCheckinUrl(token));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  if (accessLoading) return <div className="min-h-[60vh]" />;
  if (accessError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-sm text-rust">{accessError}</p>
      </div>
    );
  }

  const visitorWord = config.visitor_noun.toLowerCase();

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Visitors"
        title={`Your ${visitorWord}s`}
        action={
          !open ? (
            <PrimaryButton onClick={() => setOpen(true)}>
              Invite a {visitorWord}
            </PrimaryButton>
          ) : undefined
        }
      />

      {error && <ErrorNote>{error}</ErrorNote>}

      {justCreated && (
        <Card className="p-5 mb-5 border-sage/40">
          <p className="text-sm font-medium text-foreground mb-1">
            {justCreated.guest_name || `Your ${visitorWord}`} is expected
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Send them this link. They fill in their details and photo before arriving, so
            the gate already knows them.
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <code className="text-xs px-3 py-2 rounded-lg bg-secondary text-foreground break-all">
              {guestCheckinUrl(justCreated.token)}
            </code>
            <button
              onClick={() => copyLink(justCreated.token)}
              className="px-4 py-2 rounded-lg border border-border bg-canvas text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
            <button
              onClick={() => setJustCreated(null)}
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
        </Card>
      )}

      {open && (
        <Card className="p-5 mb-5">
          <h2 className="text-sm font-medium text-foreground mb-1">
            Invite a {visitorWord}
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Only a name is required. You will get a link to send them.
          </p>

          <div className="space-y-3">
            <Field label="Name" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Amina Otieno"
                className={inputClass}
              />
            </Field>
            <Field label="Phone">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                inputMode="tel"
                placeholder="+254 7…"
                className={inputClass}
              />
            </Field>
            <Field label="Email">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className={inputClass}
              />
            </Field>
            {units.length > 1 && (
              <Field label={config.space_noun} required>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className={inputClass}
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.unit_number}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          {formError && <p className="text-sm text-rust mt-3">{formError}</p>}

          <div className="flex gap-3 mt-5">
            <PrimaryButton onClick={submit} disabled={submitting || !name.trim() || !unitId}>
              {submitting ? "Creating…" : "Create invite"}
            </PrimaryButton>
            <button
              onClick={() => {
                setOpen(false);
                setFormError(null);
              }}
              className="px-5 py-3 rounded-xl border border-border bg-canvas text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
        Invites
      </h2>
      {invites === null ? (
        <Skeletons count={2} />
      ) : invites.length === 0 ? (
        <EmptyState>
          You have not invited anyone yet.
        </EmptyState>
      ) : (
        <ul className="space-y-3 mb-8">
          {invites.map((inv) => {
            const status = INVITE_STATUS[inv.status] ?? { label: inv.status, tone: "muted" as const };
            return (
              <li key={inv.id}>
                <Card className="p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {inv.guest_name || "Unnamed guest"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {inv.guest_phone || inv.guest_email || "No contact details"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                      Invited {formatDateTime(inv.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge tone={status.tone}>{status.label}</Badge>
                    {inv.status === "pending" && (
                      <button
                        onClick={() => copyLink(inv.token)}
                        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                      >
                        Copy link
                      </button>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
        Who has visited
      </h2>
      {history.length === 0 ? (
        <EmptyState>Nobody has checked in yet.</EmptyState>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border/60">
            {history.map((v) => (
              <li
                key={v.guest_invite_id}
                className="flex items-center justify-between gap-3 px-5 py-3.5"
              >
                <span className="text-sm text-foreground truncate">{v.guest_name}</span>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                  {formatDateTime(v.checked_in_at)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
