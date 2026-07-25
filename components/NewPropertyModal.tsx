"use client";

import { useState } from "react";
import Modal from "./Modal";
import { apiFetch } from "@/lib/api-client";
import { PropertyResponse, PropertyType } from "@/lib/types";

interface NewPropertyModalProps {
  organizationId: string;
  onClose: () => void;
  onCreated: () => void;
}

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Apartment" },
  { value: "residential_estate", label: "Residential Estate" },
  { value: "office_park", label: "Office Park" },
  { value: "hotel", label: "Hotel" },
];

export default function NewPropertyModal({
  organizationId,
  onClose,
  onCreated,
}: NewPropertyModalProps) {
  const [name, setName] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType>("apartment");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Property name is required");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch<PropertyResponse>("/me/properties", {
        method: "POST",
        body: JSON.stringify({
          organization_id: organizationId,
          name: name.trim(),
          property_type: propertyType,
          address: address.trim() || undefined,
        }),
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create property");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="New Property" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Property name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all duration-150"
            placeholder="e.g. Kilimani Heights"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Property type
          </label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value as PropertyType)}
            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all duration-150"
          >
            {PROPERTY_TYPES.map((pt) => (
              <option key={pt.value} value={pt.value}>
                {pt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Address <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all duration-150"
            placeholder="e.g. Argwings Kodhek Rd, Nairobi"
          />
        </div>

        {error && <p className="text-sm text-rust">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gold text-ink rounded-md py-2 text-sm font-medium hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 transition-all duration-150"
        >
          {submitting ? "Creating..." : "Create Property"}
        </button>
      </form>
    </Modal>
  );
}