"use client";

import { useCallback, useEffect, useState } from "react";
import { useProperty } from "@/lib/property-context";
import { getMyPackages } from "@/lib/resident";
import { Package } from "@/lib/types";
import {
  Badge,
  Card,
  EmptyState,
  ErrorNote,
  PageHeader,
  Skeletons,
  formatDateTime,
} from "../resident-ui";

export default function ResidentDeliveriesPage() {
  const { loadError: accessError, loading: accessLoading } = useProperty();

  const [packages, setPackages] = useState<Package[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setPackages(await getMyPackages());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your deliveries");
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

  const waiting = packages?.filter((p) => p.status !== "picked_up") ?? [];
  const collected = packages?.filter((p) => p.status === "picked_up") ?? [];

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Deliveries"
        title={
          packages === null
            ? "Deliveries"
            : waiting.length === 0
              ? "Nothing waiting"
              : `${waiting.length} waiting for you`
        }
      />

      {error && <ErrorNote>{error}</ErrorNote>}

      {packages === null ? (
        <Skeletons count={2} />
      ) : packages.length === 0 ? (
        <EmptyState>
          Nothing has been delivered for you yet. Reception logs parcels here when they
          arrive.
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {waiting.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                At reception
              </h2>
              <ul className="space-y-3">
                {waiting.map((p) => (
                  <li key={p.id}>
                    <Card className="p-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {p.description || "Parcel"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                          Arrived {formatDateTime(p.created_at)}
                          {p.unit_number ? ` · for ${p.unit_number}` : ""}
                        </p>
                      </div>
                      <Badge tone="gold">Ready to collect</Badge>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {collected.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Collected
              </h2>
              <Card className="overflow-hidden">
                <ul className="divide-y divide-border/60">
                  {collected.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 px-5 py-3.5"
                    >
                      <span className="text-sm text-foreground truncate">
                        {p.description || "Parcel"}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                        {p.picked_up_at ? formatDateTime(p.picked_up_at) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
