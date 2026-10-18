"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { MoveOutResult, Resident, Unit } from "@/lib/types";
import { primaryButton, quietButton, secondaryButton } from "./setup-styles";

interface UnitResidentsPanelProps {
  propertyId: string;
  unit: Unit;
  onClose: () => void;
  /** Called after a move-out, so the unit's status can refresh to vacant. */
  onChanged: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** Who lives in a unit, and moving one of them out.
 *
 *  A move-out is an ordinary part of running a building, so it is styled as one:
 *  neutral, with a confirmation that says plainly what happens rather than a red
 *  warning. */
export default function UnitResidentsPanel({ propertyId, unit, onClose, onChanged }: UnitResidentsPanelProps) {
  const [residents, setResidents] = useState<Resident[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Resident[]>(`/properties/${propertyId}/units/${unit.id}/residents`)
      .then((data) => {
        if (!cancelled) setResidents(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load residents");
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId, unit.id, version]);

  async function moveOut(resident: Resident) {
    setMoving(true);
    setError(null);
    try {
      const result = await apiFetch<MoveOutResult>(
        `/properties/${propertyId}/units/${unit.id}/residents/${resident.user_id}/move-out`,
        { method: "POST" }
      );
      const who = resident.full_name || resident.email;
      setNotice(`${who} has moved out. Their details will be deleted on ${formatDate(result.data_removed_after)}.`);
      setConfirming(null);
      setVersion((v) => v + 1);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record the move-out");
    } finally {
      setMoving(false);
    }
  }

  return (
    <div className="px-4 py-4 bg-muted/30 border-t border-border/60">
      {error && <p className="text-sm text-rust mb-3">{error}</p>}
      {notice && (
        <p role="status" className="text-sm text-muted-foreground mb-3">
          {notice}
        </p>
      )}

      {residents === null && !error ? (
        <div className="h-10 w-64 rounded-lg bg-muted animate-pulse" />
      ) : residents && residents.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nobody lives in {unit.unit_number} at the moment.</p>
      ) : (
        <ul className="space-y-2 max-w-xl">
          {residents?.map((r) => {
            const name = r.full_name || r.email;
            const details = [r.full_name ? r.email : null, r.since ? `Since ${formatDate(r.since)}` : null]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={r.user_id} className="rounded-xl border border-border/60 bg-card px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{name}</div>
                    {details && <div className="text-xs text-muted-foreground truncate">{details}</div>}
                  </div>
                  {confirming !== r.user_id && (
                    <button type="button" onClick={() => setConfirming(r.user_id)} className={secondaryButton}>
                      Move out
                    </button>
                  )}
                </div>

                {confirming === r.user_id && (
                  <div className="mt-3 border-t border-border/60 pt-3">
                    <p className="text-sm text-foreground">
                      Move {name} out of {unit.unit_number}?
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Their access ends now. Their personal details are deleted after 30 days, unless they live
                      or work somewhere else on Muna by then.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <button type="button" onClick={() => moveOut(r)} disabled={moving} className={primaryButton}>
                        {moving ? "Recording..." : "Confirm move-out"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming(null)}
                        disabled={moving}
                        className={quietButton}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <button type="button" onClick={onClose} className={`${quietButton} mt-3`}>
        Close
      </button>
    </div>
  );
}
