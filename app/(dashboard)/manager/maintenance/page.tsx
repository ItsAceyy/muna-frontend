"use client";

import { useCallback, useEffect, useState } from "react";
import { secondaryButton } from "@/components/setup-styles";
import { apiFetch } from "@/lib/api-client";
import { getCurrentUser } from "@/lib/auth";
import { useProperty } from "@/lib/property-context";
import { PropertyStaffMember, Unit, WorkOrder, WorkOrderDetail } from "@/lib/types";

const TICKET_STATUS_COLORS: Record<string, string> = {
  open: "bg-gold/15 text-gold",
  assigned: "bg-gold/15 text-gold",
  in_progress: "bg-gold/15 text-gold",
  pending_parts: "bg-rust/15 text-rust",
  resolved: "bg-sage/15 text-sage",
  closed: "bg-muted text-muted-foreground",
};

const STATUS_OPTIONS: { value: WorkOrder["status"]; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In progress" },
  { value: "pending_parts", label: "Waiting on parts" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s.label]));

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-foreground",
  high: "text-rust",
  urgent: "text-rust font-semibold",
};

const panelSelect =
  "w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/35 disabled:opacity-50";

function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-card rounded-2xl divide-y divide-border/60 shadow-sm border border-border/60">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3 animate-pulse">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-3 w-20 bg-muted rounded" />
          </div>
          <div className="h-5 w-16 rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}

function TicketPanel({
  ticket,
  assignees,
  onChanged,
}: {
  ticket: WorkOrder;
  /** Null when this person may not assign tickets, which hides the control. */
  assignees: { id: string; label: string }[] | null;
  onChanged: (ticket: WorkOrder) => void;
}) {
  const [detail, setDetail] = useState<WorkOrderDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<WorkOrderDetail>(`/work-orders/${ticket.id}`)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load this ticket");
      });
    return () => {
      cancelled = true;
    };
  }, [ticket.id]);

  async function update(change: { status?: string; assigned_to?: string }) {
    setSaving(true);
    setError(null);
    try {
      onChanged(
        await apiFetch<WorkOrder>(`/work-orders/${ticket.id}`, {
          method: "PATCH",
          body: JSON.stringify(change),
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update this ticket");
    } finally {
      setSaving(false);
    }
  }

  const photos = detail?.attachments.filter((a) => a.photo_url) ?? [];
  const assignedElsewhere =
    ticket.assigned_to !== null && !assignees?.some((a) => a.id === ticket.assigned_to);

  return (
    <div className="px-4 py-4 bg-muted/30 border-t border-border/60 space-y-4">
      {ticket.description && <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.description}</p>}

      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((photo) => (
            <a key={photo.id} href={photo.photo_url!} target="_blank" rel="noopener noreferrer">
              {/* Stored in Supabase, not a configured next/image remote. */}
              <img
                src={photo.photo_url!}
                alt={`Photo for ${ticket.title}`}
                className="h-28 w-28 rounded-xl object-cover bg-secondary"
              />
            </a>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 max-w-xl">
        <label className="block">
          <span className="block text-xs font-medium text-muted-foreground mb-1">Status</span>
          <select
            value={ticket.status}
            disabled={saving}
            onChange={(e) => update({ status: e.target.value })}
            className={panelSelect}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        {assignees && (
          <label className="block">
            <span className="block text-xs font-medium text-muted-foreground mb-1">Assigned to</span>
            <select
              value={ticket.assigned_to ?? ""}
              disabled={saving}
              onChange={(e) => update({ assigned_to: e.target.value })}
              className={panelSelect}
            >
              {ticket.assigned_to === null && (
                <option value="" disabled>
                  Nobody yet
                </option>
              )}
              {assignedElsewhere && <option value={ticket.assigned_to!}>Someone else</option>}
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {error && <p className="text-sm text-rust">{error}</p>}
    </div>
  );
}

export default function MaintenancePage() {
  const { propertyId, config, loadError: accessError, loading: accessLoading } = useProperty();

  const [tickets, setTickets] = useState<WorkOrder[] | null>(null);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [unitNumbers, setUnitNumbers] = useState<Record<string, string>>({});
  const [assignees, setAssignees] = useState<{ id: string; label: string }[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadTickets = useCallback(async (pid: string) => {
    try {
      const data = await apiFetch<WorkOrder[]>(`/work-orders?property_id=${pid}`);
      setTickets(data);
    } catch (err) {
      setTicketsError(err instanceof Error ? err.message : "Failed to load tickets");
    }
  }, []);

  useEffect(() => {
    if (!propertyId) return;
    loadTickets(propertyId);

    // Nice to have rather than needed: the list still works without either of these.
    apiFetch<Unit[]>(`/properties/${propertyId}/units`)
      .then((units) => setUnitNumbers(Object.fromEntries(units.map((u) => [u.id, u.unit_number]))))
      .catch(() => {});

    // Only managers and owners may read this list, and only they may assign, so a
    // refusal here simply means no assign control. Guards work the gate, not tickets.
    Promise.all([apiFetch<PropertyStaffMember[]>(`/properties/${propertyId}/staff`), getCurrentUser()])
      .then(([staff, me]) =>
        setAssignees([
          { id: me.id, label: "Me" },
          ...staff
            .filter((s) => s.role === "staff" && s.user_id !== me.id)
            .map((s) => ({ id: s.user_id, label: s.full_name || s.email })),
        ])
      )
      .catch(() => setAssignees(null));
  }, [propertyId, loadTickets]);

  const replaceTicket = (updated: WorkOrder) => {
    setTickets((current) => current?.map((t) => (t.id === updated.id ? updated : t)) ?? null);
  };

  if (accessLoading) {
    return <div className="min-h-screen bg-canvas" />;
  }

  if (accessError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-rust">{accessError}</p>
      </div>
    );
  }

  const openTicketsCount =
    tickets?.filter((t) => t.status !== "resolved" && t.status !== "closed").length ?? 0;

  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-8">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Maintenance</p>
        <h1 className="text-3xl font-display font-medium text-foreground">
          Tickets {tickets ? `(${openTicketsCount} open)` : ""}
        </h1>
      </div>

      {ticketsError ? (
        <p className="text-sm text-rust">{ticketsError}</p>
      ) : !tickets ? (
        <ListSkeleton rows={4} />
      ) : tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tickets yet.</p>
      ) : (
        <div className="bg-card rounded-2xl divide-y divide-border/60 shadow-sm border border-border/60 overflow-hidden">
          {tickets.map((ticket) => {
            const isOpen = expanded === ticket.id;
            const unitNumber = unitNumbers[ticket.unit_id];
            return (
              <div key={ticket.id}>
                <div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40 transition-colors duration-150">
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-foreground">{ticket.title}</div>
                    <div className={`text-xs capitalize ${PRIORITY_COLORS[ticket.priority] ?? "text-muted-foreground"}`}>
                      {unitNumber ? `${config.space_noun} ${unitNumber} · ` : ""}
                      {ticket.priority} priority
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        TICKET_STATUS_COLORS[ticket.status] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {STATUS_LABELS[ticket.status] ?? ticket.status}
                    </span>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setExpanded(isOpen ? null : ticket.id)}
                      className={secondaryButton}
                    >
                      {isOpen ? "Close" : "Manage"}
                    </button>
                  </div>
                </div>
                {isOpen && <TicketPanel ticket={ticket} assignees={assignees} onChanged={replaceTicket} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
