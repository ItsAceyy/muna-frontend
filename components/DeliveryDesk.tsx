"use client";

import { useCallback, useEffect, useState } from "react";
import { parseApiDate } from "@/app/(dashboard)/guard/visit-display";
import { getPropertyPackages, logPackage, markPackageCollected } from "@/lib/deliveries";
import { useProperty } from "@/lib/property-context";
import { Package } from "@/lib/types";

const COLLECTED_SHOWN = 20;

interface DeskUnit {
  id: string;
  unit_number: string;
  floor: string | null;
}

function formatWhen(iso: string) {
  return parseApiDate(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Logging a parcel when it arrives and handing it over when it is collected.
 *  Guards and managers both work this desk, but reach their units through different
 *  endpoints, so each page passes its own loader. */
export default function DeliveryDesk({ loadUnits }: { loadUnits: (propertyId: string) => Promise<DeskUnit[]> }) {
  const { propertyId, config, loadError: accessError, loading: accessLoading } = useProperty();

  const [units, setUnits] = useState<DeskUnit[]>([]);
  const [waiting, setWaiting] = useState<Package[] | null>(null);
  const [collected, setCollected] = useState<Package[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [unitId, setUnitId] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [handingOver, setHandingOver] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!propertyId) return;
    try {
      const [arrived, pickedUp] = await Promise.all([
        getPropertyPackages(propertyId, "arrived"),
        getPropertyPackages(propertyId, "picked_up", COLLECTED_SHOWN),
      ]);
      setWaiting(arrived);
      setCollected(pickedUp);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deliveries");
    }
  }, [propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!propertyId) return;
    loadUnits(propertyId)
      .then(setUnits)
      .catch((err) => setFormError(err instanceof Error ? err.message : "Could not load units"));
  }, [propertyId, loadUnits]);

  const save = async () => {
    if (!propertyId || !unitId) return;
    setSaving(true);
    setFormError(null);
    setNotice(null);
    try {
      const parcel = await logPackage(propertyId, unitId, description.trim());
      setNotice(`Logged for ${config.space_noun.toLowerCase()} ${parcel.unit_number ?? ""}. It now shows on their Deliveries page.`);
      setUnitId("");
      setDescription("");
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not log this delivery");
    } finally {
      setSaving(false);
    }
  };

  const handOver = async (parcel: Package) => {
    if (!propertyId) return;
    setHandingOver(parcel.id);
    setError(null);
    setNotice(null);
    try {
      await markPackageCollected(propertyId, parcel.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark this as collected");
    } finally {
      setHandingOver(null);
    }
  };

  if (accessLoading) return <div className="min-h-[60vh]" />;
  if (accessError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-sm text-rust">{accessError}</p>
      </div>
    );
  }

  const inputClass =
    "w-full h-12 px-4 rounded-xl border border-border/60 bg-canvas text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/40";

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto">
      <div className="mb-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">At the desk</p>
        <h1 className="text-3xl font-display font-medium text-foreground">
          Deliveries {waiting ? `(${waiting.length} waiting)` : ""}
        </h1>
      </div>

      <section className="rounded-2xl bg-card border border-border/60 p-5 mb-6">
        <h2 className="text-sm font-medium text-foreground mb-3">A delivery has arrived</h2>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto] sm:items-end">
          <label className="block">
            <span className="block text-xs font-medium text-muted-foreground mb-1">For {config.space_noun.toLowerCase()}</span>
            <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className={inputClass} disabled={units.length === 0}>
              <option value="">{units.length === 0 ? `No ${config.space_noun_plural.toLowerCase()}` : "Choose"}</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_number}
                  {u.floor ? ` · Floor ${u.floor}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-muted-foreground mb-1">What is it? Optional</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              placeholder="Small box from Jumia"
              className={inputClass}
            />
          </label>
          <button
            onClick={save}
            disabled={saving || !unitId}
            className="h-12 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Logging..." : "Log delivery"}
          </button>
        </div>
        {formError && <p className="text-sm text-rust mt-3">{formError}</p>}
        {notice && (
          <p role="status" className="text-sm text-sage mt-3">
            {notice}
          </p>
        )}
      </section>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rust/10 border border-rust/20">
          <p className="text-sm text-rust">{error}</p>
        </div>
      )}

      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Waiting to be collected</h2>
      {waiting === null ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-card border border-border/60 animate-pulse" />
          ))}
        </div>
      ) : waiting.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border/60 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">Nothing is waiting at the desk.</p>
        </div>
      ) : (
        <ul className="bg-card rounded-2xl border border-border/60 overflow-hidden divide-y divide-border/60">
          {waiting.map((parcel) => (
            <li key={parcel.id} className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {config.space_noun} {parcel.unit_number ?? "unknown"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate tabular-nums">
                  {parcel.description ? `${parcel.description} · ` : ""}Arrived {formatWhen(parcel.created_at)}
                </p>
              </div>
              <button
                onClick={() => handOver(parcel)}
                disabled={handingOver === parcel.id}
                className="shrink-0 px-4 py-2 rounded-xl border border-border bg-canvas text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50 transition-colors"
              >
                {handingOver === parcel.id ? "Saving..." : "Collected"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {collected.length > 0 && (
        <>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-7 mb-3">Recently collected</h2>
          <ul className="bg-card rounded-2xl border border-border/60 overflow-hidden divide-y divide-border/60">
            {collected.map((parcel) => (
              <li key={parcel.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <p className="text-sm text-foreground min-w-0 truncate">
                  {config.space_noun} {parcel.unit_number ?? "unknown"}
                  {parcel.description ? ` · ${parcel.description}` : ""}
                </p>
                <p className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  {parcel.picked_up_at ? formatWhen(parcel.picked_up_at) : ""}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
