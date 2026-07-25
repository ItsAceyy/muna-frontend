"use client";

import { useState } from "react";
import Modal from "./Modal";
import { apiFetch, ApiError } from "@/lib/api-client";
import {
  Unit,
  UnitType,
  FloorSpec,
  BulkGenerateRequest,
  BulkGenerateCollisionError,
} from "@/lib/types";

interface BulkGenerateUnitsModalProps {
  propertyId: string;
  onClose: () => void;
  onCreated: () => void;
}

const UNIT_TYPES: { value: UnitType; label: string }[] = [
  { value: "studio", label: "Studio" },
  { value: "1br", label: "1BR" },
  { value: "2br", label: "2BR" },
  { value: "3br", label: "3BR" },
  { value: "office", label: "Office" },
  { value: "retail", label: "Retail" },
  { value: "other", label: "Other" },
];

interface TypeRow {
  key: string;
  unit_type: UnitType;
  count: string;
}

interface FloorForm {
  key: string;
  floor_number: string;
  prefix: string;
  rows: TypeRow[];
}

function newRow(): TypeRow {
  return { key: crypto.randomUUID(), unit_type: "studio", count: "" };
}

function newFloor(): FloorForm {
  return {
    key: crypto.randomUUID(),
    floor_number: "",
    prefix: "",
    rows: [newRow()],
  };
}

export default function BulkGenerateUnitsModal({
  propertyId,
  onClose,
  onCreated,
}: BulkGenerateUnitsModalProps) {
  const [floors, setFloors] = useState<FloorForm[]>([newFloor()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collisions, setCollisions] = useState<string[] | null>(null);

  function updateFloor(key: string, patch: Partial<FloorForm>) {
    setFloors((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  }

  function addFloor() {
    setFloors((prev) => [...prev, newFloor()]);
  }

  function removeFloor(key: string) {
    setFloors((prev) => prev.filter((f) => f.key !== key));
  }

  function addRow(floorKey: string) {
    setFloors((prev) =>
      prev.map((f) => (f.key === floorKey ? { ...f, rows: [...f.rows, newRow()] } : f))
    );
  }

  function removeRow(floorKey: string, rowKey: string) {
    setFloors((prev) =>
      prev.map((f) =>
        f.key === floorKey ? { ...f, rows: f.rows.filter((r) => r.key !== rowKey) } : f
      )
    );
  }

  function updateRow(floorKey: string, rowKey: string, patch: Partial<TypeRow>) {
    setFloors((prev) =>
      prev.map((f) =>
        f.key === floorKey
          ? { ...f, rows: f.rows.map((r) => (r.key === rowKey ? { ...r, ...patch } : r)) }
          : f
      )
    );
  }

  function buildPayload(): BulkGenerateRequest | null {
    const floorSpecs: FloorSpec[] = [];
    for (const f of floors) {
      const floorNum = parseInt(f.floor_number, 10);
      if (isNaN(floorNum)) {
        setError("Every floor needs a floor number");
        return null;
      }

      const unitTypes = f.rows
        .map((r) => ({ unit_type: r.unit_type, count: parseInt(r.count, 10) || 0 }))
        .filter((r) => r.count > 0);

      if (unitTypes.length === 0) {
        setError(`Floor ${f.floor_number || "?"} needs at least one unit type with a count`);
        return null;
      }

      floorSpecs.push({
        floor_number: floorNum,
        prefix: f.prefix.trim() || undefined,
        unit_types: unitTypes,
      });
    }
    return { floors: floorSpecs };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCollisions(null);

    const payload = buildPayload();
    if (!payload) return;

    setSubmitting(true);
    try {
      await apiFetch<Unit[]>(`/properties/${propertyId}/units/bulk-generate`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onCreated();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const detail = err.detail as BulkGenerateCollisionError | undefined;
        if (detail?.colliding_unit_numbers) {
          setCollisions(detail.colliding_unit_numbers);
          setError("Some unit numbers already exist — no units were created");
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : "Failed to generate units");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Bulk Generate Units" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
        {floors.map((floor, idx) => (
          <div key={floor.key} className="border border-border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Floor {idx + 1}
              </span>
              {floors.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFloor(floor.key)}
                  className="text-xs text-rust hover:underline"
                >
                  Remove floor
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Floor number
                </label>
                <input
                  type="number"
                  value={floor.floor_number}
                  onChange={(e) => updateFloor(floor.key, { floor_number: e.target.value })}
                  className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all duration-150"
                  placeholder="e.g. 4"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Prefix <span className="font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={floor.prefix}
                  onChange={(e) => updateFloor(floor.key, { prefix: e.target.value })}
                  className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all duration-150"
                  placeholder="e.g. A"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-muted-foreground">
                Units on this floor
              </label>
              {floor.rows.map((row) => (
                <div key={row.key} className="flex items-center gap-2">
                  <select
                    value={row.unit_type}
                    onChange={(e) =>
                      updateRow(floor.key, row.key, { unit_type: e.target.value as UnitType })
                    }
                    className="flex-1 border border-border rounded-md px-2 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all duration-150"
                  >
                    {UNIT_TYPES.map((ut) => (
                      <option key={ut.value} value={ut.value}>
                        {ut.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-muted-foreground shrink-0">x</span>
                  <input
                    type="number"
                    min={1}
                    value={row.count}
                    onChange={(e) => updateRow(floor.key, row.key, { count: e.target.value })}
                    className="w-20 border border-border rounded-md px-2 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all duration-150"
                    placeholder="count"
                  />
                  {floor.rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(floor.key, row.key)}
                      className="text-muted-foreground hover:text-rust text-lg leading-none px-1 transition-colors duration-150"
                      aria-label="Remove row"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addRow(floor.key)}
                className="text-xs text-gold hover:underline"
              >
                + Add another unit type to this floor
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addFloor}
          className="w-full border border-dashed border-border rounded-md py-2 text-sm text-muted-foreground hover:border-gold hover:text-gold transition-all duration-150"
        >
          + Add another floor
        </button>

        {error && <p className="text-sm text-rust">{error}</p>}
        {collisions && collisions.length > 0 && (
          <div className="text-xs text-rust bg-rust/10 rounded-md p-2">
            Conflicting unit numbers: {collisions.join(", ")}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gold text-ink rounded-md py-2 text-sm font-medium hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 transition-all duration-150"
        >
          {submitting ? "Generating..." : "Generate Units"}
        </button>
      </form>
    </Modal>
  );
}