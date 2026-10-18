"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Manager } from "@/lib/types";
import InviteModal from "./InviteModal";

interface TeamSectionProps {
  propertyId: string;
}

export default function TeamSection({ propertyId }: TeamSectionProps) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadManagers = useCallback(async () => {
    try {
      const data = await apiFetch<Manager[]>(`/properties/${propertyId}/managers`);
      setManagers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    loadManagers();
  }, [loadManagers]);

  async function handleRemove(userId: string) {
    setRemovingId(userId);
    try {
      await apiFetch(`/properties/${propertyId}/managers/${userId}`, {
        method: "DELETE",
      });
      setManagers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove manager");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Team
        </h2>
       <button
          onClick={() => setShowInviteModal(true)}
          className="bg-gold text-ink text-sm font-medium px-4 py-2 rounded-md hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
        >
          + Invite Manager
        </button>
      </div>

      {error && <p className="text-sm text-rust mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading team...</p>
      ) : managers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No managers yet.</p>
      ) : (
        <div className="bg-card rounded-2xl divide-y divide-border/60 shadow-sm border border-border/60">
          {managers.map((manager) => (
            <div
              key={manager.user_id}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors duration-150"
            >
              <div>
                <div className="font-medium text-sm text-foreground">{manager.full_name}</div>
                <div className="text-xs text-muted-foreground">{manager.email}</div>
              </div>
              <button
                onClick={() => handleRemove(manager.user_id)}
                disabled={removingId === manager.user_id}
                className="bg-rust/10 text-rust text-xs font-medium px-3 py-1.5 rounded-md hover:bg-rust/20 disabled:opacity-50 transition-all duration-150"
              >
                {removingId === manager.user_id ? "Removing..." : "Remove"}
              </button>
            </div>
          ))}
        </div>
      )}

      {showInviteModal && (
        <InviteModal
          propertyId={propertyId}
          role="manager"
          roleLabel="Manager"
          onClose={() => setShowInviteModal(false)}
          onInvited={loadManagers}
        />
      )}
    </section>
  );
}