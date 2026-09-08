"use client";

import { useCallback, useEffect, useState } from "react";
import { useProperty } from "@/lib/property-context";
import { getMyTickets, getMyUnits, raiseTicket } from "@/lib/resident";
import { Unit, WorkOrder, WorkOrderPriority } from "@/lib/types";
import {
  Badge,
  Card,
  EmptyState,
  ErrorNote,
  Field,
  PageHeader,
  PrimaryButton,
  Skeletons,
  formatDate,
  inputClass,
} from "../resident-ui";

const PRIORITIES: { value: WorkOrderPriority; label: string }[] = [
  { value: "low", label: "Low — whenever convenient" },
  { value: "medium", label: "Medium — this week" },
  { value: "high", label: "High — as soon as possible" },
  { value: "urgent", label: "Urgent — unsafe or unusable" },
];

const STATUS: Record<string, { label: string; tone: "sage" | "gold" | "rust" | "muted" }> = {
  open: { label: "Open", tone: "gold" },
  assigned: { label: "Assigned", tone: "gold" },
  in_progress: { label: "In progress", tone: "gold" },
  pending_parts: { label: "Waiting on parts", tone: "rust" },
  resolved: { label: "Resolved", tone: "sage" },
  closed: { label: "Closed", tone: "muted" },
};

export default function ResidentMaintenancePage() {
  const { config, loadError: accessError, loading: accessLoading } = useProperty();

  const [tickets, setTickets] = useState<WorkOrder[] | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<WorkOrderPriority>("medium");
  const [unitId, setUnitId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [t, u] = await Promise.all([getMyTickets(), getMyUnits()]);
      setTickets(t);
      setUnits(u);
      if (u.length && !unitId) setUnitId(u[0].id);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your requests");
    }
    // unitId is intentionally not a dependency - it seeds once from the first unit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!unitId || !title.trim()) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await raiseTicket(unitId, title.trim(), description.trim(), priority);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not send your request");
    } finally {
      setSubmitting(false);
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

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Maintenance"
        title="Your requests"
        action={
          !open ? (
            <PrimaryButton onClick={() => setOpen(true)}>Report an issue</PrimaryButton>
          ) : undefined
        }
      />

      {error && <ErrorNote>{error}</ErrorNote>}

      {open && (
        <Card className="p-5 mb-5">
          <h2 className="text-sm font-medium text-foreground mb-1">Report an issue</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Your {config.space_noun.toLowerCase()} manager sees this straight away.
          </p>

          <div className="space-y-3">
            <Field label="What is wrong?" required>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Leaking kitchen tap"
                className={inputClass}
              />
            </Field>

            <Field label="Any detail that would help">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Under the sink, started this morning. Water is pooling in the cupboard."
                className={`${inputClass} resize-y`}
              />
            </Field>

            <Field label="How urgent is it?">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as WorkOrderPriority)}
                className={inputClass}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
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

          {formError && (
            <p className="text-sm text-rust mt-3">{formError}</p>
          )}

          <div className="flex gap-3 mt-5">
            <PrimaryButton onClick={submit} disabled={submitting || !title.trim() || !unitId}>
              {submitting ? "Sending…" : "Send request"}
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

      {tickets === null ? (
        <Skeletons count={3} />
      ) : tickets.length === 0 ? (
        <EmptyState>
          You have not reported anything yet. Anything broken or unsafe belongs here.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {tickets.map((t) => {
            const status = STATUS[t.status] ?? { label: t.status, tone: "muted" as const };
            return (
              <li key={t.id}>
                <Card className="p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{t.title}</p>
                    {t.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {t.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
                      Reported {formatDate(t.created_at)}
                      {t.resolved_at ? ` · resolved ${formatDate(t.resolved_at)}` : ""}
                      {" · "}
                      {t.priority} priority
                    </p>
                  </div>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
