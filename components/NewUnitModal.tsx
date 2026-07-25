"use client";

import { useState } from "react";
import Modal from "./Modal";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Unit, UnitType } from "@/lib/types";

interface NewUnitModalProps {
  propertyId: string;
  onClose: () => void;
  onCreated: () => void;
}

const UNIT_TYPES: { value: UnitType; label: string }[] = [
  { value: "studio", label: "Studio" },
  { value: "1br", label: "1 Bedroom" },
  { value: "2br", label: "2 Bedroom" },
  { value: "3br", label: "3 Bedroom" },
  { value: "office", label: "Office" },
  { value: "retail", label: "Retail" },
  { value: "other", label: "Other" },
];

export default function NewUnitModal({
  propertyId,
  onClose,
  onCreated,
}: NewUnitModalProps) {
  const [unitNumber, setUnitNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [unitType, setUnitType] = useState<UnitType>("studio");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!unitNumber.trim()) {
      setError("Unit number is required");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch<Unit>(`/properties/${propertyId}/units`, {
        method: "POST",
        body: JSON.stringify({
          unit_number: unitNumber.trim(),
          floor: floor.trim() || undefined,
          unit_type: unitType,
        }),
      });
      onCreated();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("A unit with that number already exists on this property");
      } else {
        setError(err instanceof Error ? err.message : "Failed to create unit");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="New Unit" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Unit number
          </label>
          <input
            type="text"
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all duration-150"
            placeholder="e.g. 4B"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Floor <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all duration-150"
            placeholder="e.g. 4"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Unit type
          </label>
          <select
            value={unitType}
            onChange={(e) => setUnitType(e.target.value as UnitType)}
            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all duration-150"
          >
            {UNIT_TYPES.map((ut) => (
              <option key={ut.value} value={ut.value}>
                {ut.label}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-rust">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gold text-ink rounded-md py-2 text-sm font-medium hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 transition-all duration-150"
        >
          {submitting ? "Creating..." : "Create Unit"}
        </button>
      </form>
    </Modal>
  );
}