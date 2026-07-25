"use client";

import { useState } from "react";
import Modal from "./Modal";
import { apiFetch } from "@/lib/api-client";
import { OrgResponse } from "@/lib/types";

interface NewOrgModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function NewOrgModal({ onClose, onCreated }: NewOrgModalProps) {
  const [mode, setMode] = useState<"individual" | "organization">("individual");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "organization" && !name.trim()) {
      setError("Organization name is required");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch<OrgResponse>("/me/organizations", {
        method: "POST",
        body: JSON.stringify({
          mode,
          name: mode === "organization" ? name.trim() : undefined,
        }),
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create organization");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="New Organization" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Type</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("individual")}
              className={`flex-1 px-3 py-2 rounded-md text-sm border transition-all duration-150 ${
                mode === "individual"
                  ? "border-ink bg-ink text-canvas"
                  : "border-border text-muted-foreground hover:bg-muted/60"
              }`}
            >
              Individual
            </button>
            <button
              type="button"
              onClick={() => setMode("organization")}
              className={`flex-1 px-3 py-2 rounded-md text-sm border transition-all duration-150 ${
                mode === "organization"
                  ? "border-ink bg-ink text-canvas"
                  : "border-border text-muted-foreground hover:bg-muted/60"
              }`}
            >
              Company
            </button>
          </div>
        </div>

        {mode === "organization" && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Organization name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all duration-150"
              placeholder="e.g. VESTIA Properties"
            />
          </div>
        )}

        {error && <p className="text-sm text-rust">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gold text-ink rounded-md py-2 text-sm font-medium hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 transition-all duration-150"
        >
          {submitting ? "Creating..." : "Create Organization"}
        </button>
      </form>
    </Modal>
  );
}