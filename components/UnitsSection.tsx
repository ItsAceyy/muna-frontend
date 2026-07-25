"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Unit } from "@/lib/types";
import NewUnitModal from "./NewUnitModal";
import BulkGenerateUnitsModal from "./BulkGenerateUnitsModal";
import ImportUnitsCsvModal from "./ImportUnitsCsvModal";

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
  const [showNewUnit, setShowNewUnit] = useState(false);
  const [showBulkGenerate, setShowBulkGenerate] = useState(false);
  const [showImportCsv, setShowImportCsv] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<Unit[]>(`/properties/${propertyId}/units`);
      setUnits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load units");
    }
  }, [propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  function handleChanged() {
    load();
    onUnitsChanged?.();
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Units {units ? `(${units.length})` : ""}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportCsv(true)}
            className="text-xs font-medium text-foreground bg-muted hover:bg-muted/70 px-2.5 py-1.5 rounded-md transition-all duration-150"
          >
            Import CSV
          </button>
          <button
            onClick={() => setShowBulkGenerate(true)}
            className="text-xs font-medium text-foreground bg-muted hover:bg-muted/70 px-2.5 py-1.5 rounded-md transition-all duration-150"
          >
            Bulk Generate
          </button>
          <button
            onClick={() => setShowNewUnit(true)}
            className="text-xs font-medium text-ink bg-gold hover:brightness-110 hover:scale-[1.03] active:scale-[0.97] px-2.5 py-1.5 rounded-md transition-all duration-150"
          >
            + Add Unit
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-rust">{error}</p>
      ) : !units ? (
        <ListSkeleton rows={3} />
      ) : units.length === 0 ? (
        <p className="text-sm text-muted-foreground">No units yet.</p>
      ) : (
        <div className="bg-card rounded-2xl divide-y divide-border/60 shadow-sm border border-border/60">
          {units.map((unit) => (
            <div
              key={unit.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors duration-150"
            >
              <div>
                <div className="font-medium text-sm text-foreground">{unit.unit_number}</div>
                <div className="text-xs text-muted-foreground">
                  {unit.floor ? `Floor ${unit.floor} - ` : ""}
                  {unit.unit_type.toUpperCase()}
                </div>
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

      {showNewUnit && (
        <NewUnitModal
          propertyId={propertyId}
          onClose={() => setShowNewUnit(false)}
          onCreated={handleChanged}
        />
      )}
      {showBulkGenerate && (
        <BulkGenerateUnitsModal
          propertyId={propertyId}
          onClose={() => setShowBulkGenerate(false)}
          onCreated={handleChanged}
        />
      )}
      {showImportCsv && (
        <ImportUnitsCsvModal
          propertyId={propertyId}
          onClose={() => setShowImportCsv(false)}
          onCreated={handleChanged}
        />
      )}
    </section>
  );
}