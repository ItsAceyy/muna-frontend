"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { createInvite } from "@/lib/auth";
import { useProperty } from "@/lib/property-context";
import { Unit } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  vacant: "bg-muted text-muted-foreground",
  occupied: "bg-sage/15 text-sage",
  maintenance: "bg-gold/15 text-gold",
};

function ListSkeleton({ rows = 4 }: { rows?: number }) {
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

function InviteResidentForm({
  unit,
  onClose,
  onSent,
}: {
  unit: Unit;
  onClose: () => void;
  onSent: () => void;
}) {
  const { propertyId } = useProperty();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusIsError, setStatusIsError] = useState(false);

  const handleSend = async () => {
    if (!propertyId || !email) return;
    setSending(true);
    setStatus(null);
    try {
      await createInvite(propertyId, email, "tenant", unit.id, phone || undefined);
      setStatus(`Invite sent to ${email}`);
      setStatusIsError(false);
      setEmail("");
      setPhone("");
      onSent();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to send invite");
      setStatusIsError(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-4 py-4 bg-muted/30 border-t border-border/60">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="resident@email.com"
          className="px-3 py-2 rounded-lg border border-border/60 bg-canvas text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sage/40"
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
          className="px-3 py-2 rounded-lg border border-border/60 bg-canvas text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sage/40"
        />
      </div>
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={handleSend}
          disabled={sending || !email}
          className="px-4 py-2 rounded-lg bg-sage text-white text-sm font-medium disabled:opacity-50 transition-opacity"
        >
          {sending ? "Sending..." : "Send Invite"}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
      {status && (
        <p className={`text-sm mt-2 ${statusIsError ? "text-rust" : "text-muted-foreground"}`}>
          {status}
        </p>
      )}
    </div>
  );
}

export default function ResidencesPage() {
  const { propertyId, loadError: accessError, loading: accessLoading } = useProperty();

  const [units, setUnits] = useState<Unit[] | null>(null);
  const [unitsError, setUnitsError] = useState<string | null>(null);
  const [openInviteUnitId, setOpenInviteUnitId] = useState<string | null>(null);

  const loadUnits = useCallback(async (pid: string) => {
    try {
      const data = await apiFetch<Unit[]>(`/properties/${pid}/units`);
      setUnits(data);
    } catch (err) {
      setUnitsError(err instanceof Error ? err.message : "Failed to load units");
    }
  }, []);

  useEffect(() => {
    if (!propertyId) return;
    loadUnits(propertyId);
  }, [propertyId, loadUnits]);

  if (accessLoading) {
    return <div className="min-h-screen bg-canvas" />;
  }

  if (accessError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-rust">{accessError}</p>
      </div>
    );
  }

  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-8">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Residences</p>
        <h1 className="text-3xl font-display font-medium text-foreground">
          Units {units ? `(${units.length})` : ""}
        </h1>
      </div>

      {unitsError ? (
        <p className="text-sm text-rust">{unitsError}</p>
      ) : !units ? (
        <ListSkeleton rows={4} />
      ) : units.length === 0 ? (
        <p className="text-sm text-muted-foreground">No units yet.</p>
      ) : (
        <div className="bg-card rounded-2xl divide-y divide-border/60 shadow-sm border border-border/60">
          {units.map((unit) => (
            <div key={unit.id}>
              <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors duration-150">
                <div>
                  <div className="font-medium text-sm text-foreground">{unit.unit_number}</div>
                  <div className="text-xs text-muted-foreground">
                    {unit.floor ? `Floor ${unit.floor} - ` : ""}
                    {unit.unit_type.toUpperCase()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      STATUS_COLORS[unit.status] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {unit.status}
                  </span>
                  <button
                    onClick={() =>
                      setOpenInviteUnitId(openInviteUnitId === unit.id ? null : unit.id)
                    }
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border/60 text-foreground hover:bg-muted/50 transition-colors"
                  >
                    Invite Resident
                  </button>
                </div>
              </div>
              {openInviteUnitId === unit.id && (
                <InviteResidentForm
                  unit={unit}
                  onClose={() => setOpenInviteUnitId(null)}
                  onSent={() => {
                    if (propertyId) loadUnits(propertyId);
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}