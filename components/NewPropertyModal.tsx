"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { apiFetch } from "@/lib/api-client";
import { BusinessTypeOption, PropertyResponse } from "@/lib/types";
import { getBusinessTypes } from "@/lib/vertical";

interface NewPropertyModalProps {
  organizationId: string;
  onClose: () => void;
  onCreated: () => void;
}

/** Shown until the catalogue loads, and if the request fails. Keeps setup usable
 *  offline rather than blocking on a list that rarely changes. */
const FALLBACK_TYPES: BusinessTypeOption[] = [
  {
    key: "apartment",
    label: "Apartment building",
    description: "A single building of flats with shared entrances.",
    property_type: "apartment",
    vertical: "residential",
  },
  {
    key: "estate",
    label: "Residential estate",
    description: "Gated housing with multiple homes and controlled access.",
    property_type: "residential_estate",
    vertical: "residential",
  },
  {
    key: "office",
    label: "Office",
    description: "Offices and business parks with reception-managed visitors.",
    property_type: "office_park",
    vertical: "office",
  },
  {
    key: "hotel",
    label: "Hotel",
    description: "Front-desk traffic and occupancy tracking. Not a booking system.",
    property_type: "hotel",
    vertical: "hotel",
  },
];

const inputClass =
  "w-full border border-border rounded-lg px-3.5 py-2.5 text-sm bg-canvas text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-ring/35 focus:border-border-strong transition-all duration-150";

export default function NewPropertyModal({
  organizationId,
  onClose,
  onCreated,
}: NewPropertyModalProps) {
  const [types, setTypes] = useState<BusinessTypeOption[]>(FALLBACK_TYPES);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string>("apartment");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBusinessTypes()
      .then((data) => {
        if (data.length) setTypes(data);
      })
      .catch(() => {
        // Keep the fallback list; the choice matters more than it being live.
      });
  }, []);

  const chosen = types.find((t) => t.key === selected) ?? types[0];

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
          // The business type fixes the property type; the backend derives the
          // vertical from it and switches on the right modules.
          property_type: chosen.property_type,
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
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Property name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Kilimani Heights"
          />
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-foreground mb-1">
            What kind of business is this?
          </legend>
          <p className="text-xs text-muted-foreground mb-3">
            This decides which modules are switched on and how the app reads. You can
            change it later.
          </p>

          <div className="space-y-2">
            {types.map((t) => {
              const isActive = t.key === selected;
              return (
                <label
                  key={t.key}
                  className={
                    isActive
                      ? "flex gap-3 items-start p-3.5 rounded-xl border border-gold bg-gold/[0.07] cursor-pointer transition-colors"
                      : "flex gap-3 items-start p-3.5 rounded-xl border border-border bg-card hover:border-border-strong cursor-pointer transition-colors"
                  }
                >
                  <input
                    type="radio"
                    name="business_type"
                    value={t.key}
                    checked={isActive}
                    onChange={() => setSelected(t.key)}
                    className="mt-1 accent-[var(--gold)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">
                      {t.label}
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      {t.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Address{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
            placeholder="e.g. Argwings Kodhek Rd, Nairobi"
          />
        </div>

        {error && <p className="text-sm text-rust">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:opacity-90 active:scale-[0.995] disabled:opacity-40 transition-all duration-150"
        >
          {submitting ? "Creating..." : "Create Property"}
        </button>
      </form>
    </Modal>
  );
}
