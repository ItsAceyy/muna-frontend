"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useProperty } from "@/lib/property-context";
import {
  getMyPackages,
  getMyTickets,
  getMyUnits,
  getMyVisitorHistory,
} from "@/lib/resident";
import { Package, Unit, WorkOrder, MyVisitorHistoryItem } from "@/lib/types";
import {
  Card,
  ErrorNote,
  PageHeader,
  Skeletons,
  formatDateTime,
} from "./resident-ui";

const OPEN_TICKET_STATUSES = ["open", "assigned", "in_progress", "pending_parts"];

export default function ResidentHomePage() {
  const { config, loadError: accessError, loading: accessLoading } = useProperty();

  const [units, setUnits] = useState<Unit[] | null>(null);
  const [tickets, setTickets] = useState<WorkOrder[] | null>(null);
  const [packages, setPackages] = useState<Package[] | null>(null);
  const [visitors, setVisitors] = useState<MyVisitorHistoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [u, t, p, v] = await Promise.all([
        getMyUnits(),
        getMyTickets(),
        getMyPackages(),
        getMyVisitorHistory(),
      ]);
      setUnits(u);
      setTickets(t);
      setPackages(p);
      setVisitors(v);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your home");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (accessLoading) return <div className="min-h-[60vh]" />;

  if (accessError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-sm text-rust">{accessError}</p>
      </div>
    );
  }

  const openTickets = tickets?.filter((t) => OPEN_TICKET_STATUSES.includes(t.status)) ?? [];
  const waitingPackages = packages?.filter((p) => p.status !== "picked_up") ?? [];
  const loaded = units !== null;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto">
      <PageHeader eyebrow="Home" title={greeting} />

      {error && <ErrorNote>{error}</ErrorNote>}

      {!loaded ? (
        <Skeletons count={3} height="h-24" />
      ) : (
        <div className="space-y-4">
          {/* Which space they hold. A resident usually has one; the API allows several. */}
          <Card className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
              Your {units.length === 1 ? config.space_noun.toLowerCase() : config.space_noun_plural.toLowerCase()}
            </p>
            {units.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No {config.space_noun.toLowerCase()} is linked to your account yet.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {units.map((u) => (
                  <li
                    key={u.id}
                    className="px-3.5 py-2 rounded-xl bg-secondary text-sm font-medium text-foreground"
                  >
                    {config.space_noun} {u.unit_number}
                    {u.floor ? (
                      <span className="text-muted-foreground font-normal"> · Floor {u.floor}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SummaryTile
              label="Open requests"
              value={openTickets.length}
              href="/resident/maintenance"
              caption={
                openTickets.length === 0
                  ? "Nothing outstanding"
                  : openTickets[0].title
              }
            />
            <SummaryTile
              label="Waiting for you"
              value={waitingPackages.length}
              href="/resident/deliveries"
              caption={
                waitingPackages.length === 0
                  ? "No deliveries held"
                  : waitingPackages[0].description ?? "Parcel at reception"
              }
            />
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-4 mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Recent visitors
              </p>
              <Link
                href="/resident/visitors"
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                All visitors
              </Link>
            </div>
            {visitors && visitors.length > 0 ? (
              <ul className="divide-y divide-border/60 -my-2">
                {visitors.slice(0, 4).map((v) => (
                  <li
                    key={v.guest_invite_id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <span className="text-sm text-foreground truncate">{v.guest_name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                      {formatDateTime(v.checked_in_at)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nobody has visited yet.
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  caption,
  href,
}: {
  label: string;
  value: number;
  caption: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-card rounded-2xl border border-border/60 shadow-sm p-5 hover:border-border-strong transition-colors"
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{label}</p>
      <p className="text-3xl font-display font-medium text-foreground tabular-nums leading-none mb-2">
        {value}
      </p>
      <p className="text-xs text-muted-foreground truncate">{caption}</p>
    </Link>
  );
}
