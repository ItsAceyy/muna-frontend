"use client";

import { useState } from "react";
import Modal from "./Modal";
import { apiFetch } from "@/lib/api-client";

interface InviteModalProps {
  propertyId: string;
  role: "manager" | "guard";
  roleLabel: string;
  onClose: () => void;
  onInvited: () => void;
}

export default function InviteModal({
  propertyId,
  role,
  roleLabel,
  onClose,
  onInvited,
}: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch(`/properties/${propertyId}/invites`, {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), role }),
      });
      setSuccess(true);
      onInvited();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Invite ${roleLabel}`} onClose={onClose}>
      {success ? (
        <div className="text-sm text-foreground">
          <p className="mb-4">
            Invite sent to <span className="font-medium">{email}</span>.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gold text-ink rounded-md py-2 text-sm font-medium hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] transition-all duration-150"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {roleLabel}&apos;s email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all duration-150"
              placeholder={`e.g. ${role}@example.com`}
            />
          </div>

          {error && <p className="text-sm text-rust">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gold text-ink rounded-md py-2 text-sm font-medium hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 transition-all duration-150"
          >
            {submitting ? "Sending..." : "Send Invite"}
          </button>
        </form>
      )}
    </Modal>
  );
}