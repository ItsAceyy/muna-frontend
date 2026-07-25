"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useProperty } from "@/lib/property-context";
import { WorkOrder } from "@/lib/types";

const TICKET_STATUS_COLORS: Record<string, string> = {
  open: "bg-gold/15 text-gold",
  assigned: "bg-gold/15 text-gold",
  in_progress: "bg-gold/15 text-gold",
  pending_parts: "bg-rust/15 text-rust",
  resolved: "bg-sage/15 text-sage",
  closed: "bg-muted text-muted-foreground",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-foreground",
  high: "text-rust",
  urgent: "text-rust font-semibold",
};

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

export default function MaintenancePage() {
  const { propertyId, loadError: accessError, loading: accessLoading } = useProperty();

  const [tickets, setTickets] = useState<WorkOrder[] | null>(null);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

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
  }, [propertyId, loadTickets]);

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
        <div className="bg-card rounded-2xl divide-y divide-border/60 shadow-sm border border-border/60">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors duration-150"
            >
              <div>
                <div className="font-medium text-sm text-foreground">{ticket.title}</div>
                <div className={`text-xs capitalize ${PRIORITY_COLORS[ticket.priority] ?? "text-muted-foreground"}`}>
                  {ticket.priority} priority
                </div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                  TICKET_STATUS_COLORS[ticket.status] ?? "bg-muted text-muted-foreground"
                }`}
              >
                {ticket.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}