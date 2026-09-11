"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Unit } from "@/lib/types";
import { describeUnit } from "@/lib/unit-types";
import UnitSetupToolbar from "./UnitSetupToolbar";

interface UnitsSectionProps {
  propertyId: string;
  onUnitsChanged?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  vacant: "bg-muted text-muted-foreground",
  occupied: "bg-sage/15 text-sage",
  maintenance: "bg-gold/15 text-gold",
};

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-card rounded-2xl divide-y divide-border/60 shadow-sm border border-border/60">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3 animate-pulse">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-3 w-32 bg-muted rounded" />
          </div>
          <div className="h-5 w-16 rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default function UnitsSection({ propertyId, onUnitsChanged }: UnitsSectionProps) {
  const [units, setUnits] = useState<Unit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Bumped after any change made through the toolbar, to re-fetch the list.
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

  function handleChanged() {
    setVersion((v) => v + 1);
    onUnitsChanged?.();
  }

  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Units {units ? `(${units.length})` : ""}
        </h2>
        <UnitSetupToolbar
          propertyId={propertyId}
          existingUnitNumbers={units?.map((u) => u.unit_number) ?? []}
          onChanged={handleChanged}
        />
      </div>

      {error ? (
        <p className="text-sm text-rust">{error}</p>
      ) : !units ? (
        <ListSkeleton rows={3} />
      ) : units.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No units yet. Generate a whole building at once, or import the spreadsheet you already have.
        </p>
      ) : (
        <div className="bg-card rounded-2xl divide-y divide-border/60 shadow-sm border border-border/60">
          {units.map((unit) => (
            <div
              key={unit.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors duration-150"
            >
              <div>
                <div className="font-medium text-sm text-foreground">{unit.unit_number}</div>
                <div className="text-xs text-muted-foreground">{describeUnit(unit)}</div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                  STATUS_COLORS[unit.status] ?? "bg-muted text-muted-foreground"
                }`}
              >
                {unit.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
