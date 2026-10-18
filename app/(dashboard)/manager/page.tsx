"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useProperty } from "@/lib/property-context";
import { OccupancyRate, WorkOrder } from "@/lib/types";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-5">
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function QuickAction({ label, href }: { label: string; href: string }) {
  return (
    <a href={href} className="flex items-center justify-between px-4 py-3 rounded-lg border border-border hover:border-gold/40 hover:bg-gold/[0.06] transition-colors">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="text-faint">{"->"}</span>
    </a>
  );
}

export default function ManagerHomePage() {
  const { propertyId, loadError, loading } = useProperty();

  const [occupancy, setOccupancy] = useState<OccupancyRate | null>(null);
  const [tickets, setTickets] = useState<WorkOrder[] | null>(null);
  const [occupancyError, setOccupancyError] = useState<string | null>(null);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  const loadOccupancy = useCallback(async (pid: string) => {
    try {
      const data = await apiFetch<OccupancyRate>(`/properties/${pid}/occupancy/rate`);
      setOccupancy(data);
    } catch (err) {
      setOccupancyError(err instanceof Error ? err.message : "Failed to load occupancy");
    }
  }, []);

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
    loadOccupancy(propertyId);
    loadTickets(propertyId);
  }, [propertyId, loadOccupancy, loadTickets]);

  if (loading) {
    return <div className="min-h-screen bg-card" />;
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-rust">{loadError}</p>
      </div>
    );
  }

  let occupancyRateLabel = "-";
  if (occupancy && occupancy.total_units > 0) {
    const rate = Math.round((occupancy.occupied_units / occupancy.total_units) * 100);
    occupancyRateLabel = rate + "%";
  }

  const openTickets = tickets
    ? tickets.filter((t) => t.status !== "resolved" && t.status !== "closed")
    : [];

  const openCount = tickets ? tickets.filter((t) => t.status === "open").length : 0;
  const inProgressCount = tickets
    ? tickets.filter((t) => t.status === "in_progress" || t.status === "assigned").length
    : 0;
  const pendingPartsCount = tickets
    ? tickets.filter((t) => t.status === "pending_parts").length
    : 0;
  const resolvedCount = tickets
    ? tickets.filter((t) => t.status === "resolved" || t.status === "closed").length
    : 0;

  const maxStatus = Math.max(openCount, inProgressCount, pendingPartsCount, resolvedCount, 1);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const statusRows = [
    { label: "Open", value: openCount, color: "bg-gold" },
    { label: "In Progress", value: inProgressCount, color: "bg-gold" },
    { label: "Pending Parts", value: pendingPartsCount, color: "bg-rust" },
    { label: "Resolved", value: resolvedCount, color: "bg-sage" },
  ];

  return (
    <div className="bg-canvas min-h-full">
      <div className="px-8 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <button className="px-4 py-2 rounded-lg bg-ink hover:opacity-90 text-primary-foreground text-sm font-medium transition-colors">
          + New Request
        </button>
      </div>

      <div className="px-8 pb-10 space-y-8">
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <p className="text-lg font-semibold text-foreground">Good day</p>
          <p className="text-sm text-muted-foreground mt-1">{today}</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Occupancy Rate" value={occupancyRateLabel} />
          <StatCard label="Pending Maintenance" value={String(openTickets.length)} />
          <StatCard label="Staff On Duty" value="-" />
          <StatCard label="Total Residences" value={occupancy ? String(occupancy.total_units) : "-"} />
        </div>
        {occupancyError && <p className="text-sm text-rust">{occupancyError}</p>}

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h2>

            {ticketsError && <p className="text-sm text-rust">{ticketsError}</p>}

            {!ticketsError && !tickets && (
              <div className="space-y-3 animate-pulse">
                <div className="h-10 bg-muted rounded-lg" />
                <div className="h-10 bg-muted rounded-lg" />
                <div className="h-10 bg-muted rounded-lg" />
              </div>
            )}

            {!ticketsError && tickets && tickets.length === 0 && (
              <p className="text-sm text-faint">No recent activity.</p>
            )}

            {!ticketsError && tickets && tickets.length > 0 && (
              <div className="divide-y divide-border">
                {tickets.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-3">
                    <span className="text-sm text-foreground">{t.title}</span>
                    <span className="text-xs text-faint capitalize">
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <QuickAction label="Invite Guard" href="/manager/staff" />
              <QuickAction label="View Maintenance" href="/manager/maintenance" />
              <QuickAction label="View Residences" href="/manager/residences" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Maintenance Overview</h2>

          {!tickets && <div className="h-24 bg-muted rounded-lg animate-pulse" />}

          {tickets && (
            <div className="space-y-3">
              {statusRows.map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-28 shrink-0">{row.label}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={"h-full rounded-full " + row.color}
                      style={{ width: (row.value / maxStatus) * 100 + "%" }}
                    />
                  </div>
                  <span className="text-xs font-medium text-foreground/70 w-6 text-right">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}