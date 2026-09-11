"use client";

import { useState } from "react";
import Modal from "./Modal";
import { ApiError } from "@/lib/api-client";
import { UnitTypeDef } from "@/lib/types";
import { commitUnits } from "@/lib/unit-types";
import { inputClass, labelClass, primaryButton, secondaryButton } from "./setup-styles";

interface NewUnitModalProps {
  propertyId: string;
  /** The organization's active unit types. */
  types: UnitTypeDef[];
  onClose: () => void;
  onCreated: () => void;
}

/** One unit at a time, for corrections and the unit the generator missed. Saved
 *  through the same path as a generated batch - a batch of one. */
export default function NewUnitModal({ propertyId, types, onClose, onCreated }: NewUnitModalProps) {
  const [unitNumber, setUnitNumber] = useState("");
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const [block, setBlock] = useState("");
  const [floor, setFloor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const number = unitNumber.trim();
    if (!number) {
      setError("Enter a unit number.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await commitUnits(propertyId, [
        {
          unit_number: number,
          unit_type_id: typeId,
          block: block.trim() || null,
          floor: floor.trim() || null,
        },
      ]);
      onCreated();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.message.startsWith("Already exist")) {
        setError(`Unit ${number} already exists on this property.`);
      } else {
        setError(err instanceof Error ? err.message : "Could not add the unit");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Add a unit" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="unit-number" className={labelClass}>
            Unit number
          </label>
          <input
            id="unit-number"
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            placeholder="e.g. A101"
            className={`${inputClass} w-full`}
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="unit-type" className={labelClass}>
            Type
          </label>
          <select
            id="unit-type"
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            className={`${inputClass} w-full`}
          >
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="unit-block" className={labelClass}>
              Block <span className="font-normal text-faint">optional</span>
            </label>
            <input
              id="unit-block"
              value={block}
              onChange={(e) => setBlock(e.target.value)}
              placeholder="e.g. A"
              className={`${inputClass} w-full`}
            />
          </div>
          <div>
            <label htmlFor="unit-floor" className={labelClass}>
              Floor <span className="font-normal text-faint">optional</span>
            </label>
            <input
              id="unit-floor"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="e.g. 1"
              className={`${inputClass} w-full`}
            />
          </div>
        </div>

        {error && <p className="text-sm text-rust">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button type="submit" disabled={submitting || !typeId} className={primaryButton}>
            {submitting ? "Adding…" : "Add unit"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
