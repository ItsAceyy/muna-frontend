"use client";

import { useState } from "react";
import Modal from "./Modal";
import BusinessTypePicker, { useBusinessTypes } from "./BusinessTypePicker";
import { apiFetch } from "@/lib/api-client";
import { PropertyResponse } from "@/lib/types";

interface NewPropertyModalProps {
  organizationId: string;
  onClose: () => void;
  onCreated: () => void;
}

const inputClass =
  "w-full border border-border rounded-lg px-3.5 py-2.5 text-sm bg-canvas text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-ring/35 focus:border-border-strong transition-all duration-150";

export default function NewPropertyModal({
  organizationId,
  onClose,
  onCreated,
}: NewPropertyModalProps) {
  const types = useBusinessTypes();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string>("apartment");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            This decides which modules are switched on and how the app reads.
          </p>

          <BusinessTypePicker types={types} selected={selected} onSelect={setSelected} />
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
