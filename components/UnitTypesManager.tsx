"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { UnitTypeDef } from "@/lib/types";
import {
  bedroomLabel,
  createUnitType,
  deleteUnitType,
  listUnitTypes,
  seedDefaultUnitTypes,
  updateUnitType,
} from "@/lib/unit-types";
import { inputClass, labelClass, primaryButton, quietButton, secondaryButton } from "./setup-styles";

interface UnitTypesManagerProps {
  organizationId: string;
  onClose: () => void;
  /** Called whenever the list changes, so the page behind can refresh its labels. */
  onChanged: () => void;
  /** Shown above the list when the manager was sent here because there were no types. */
  intro?: string;
}

const BEDROOM_OPTIONS = Array.from({ length: 11 }, (_, i) => i);

function message(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export default function UnitTypesManager({
  organizationId,
  onClose,
  onChanged,
  intro,
}: UnitTypesManagerProps) {
  const [types, setTypes] = useState<UnitTypeDef[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [newName, setNewName] = useState("");
  const [newBedrooms, setNewBedrooms] = useState(1);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftBedrooms, setDraftBedrooms] = useState(0);

  // Deleting is two clicks. Only a type with no units can be deleted at all, so this
  // is a guard against a slip, not against losing data.
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Bumped after every change to re-fetch the list.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listUnitTypes(organizationId, true)
      .then((data) => {
        if (!cancelled) setTypes(data);
      })
      .catch((err) => {
        if (!cancelled) setError(message(err, "Could not load unit types"));
      });
    return () => {
      cancelled = true;
    };
  }, [organizationId, version]);

  async function run(action: () => Promise<unknown>, fallback: string): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      await action();
      setVersion((v) => v + 1);
      onChanged();
      return true;
    } catch (err) {
      setError(message(err, fallback));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    // Sorted by size by default, so a new "4 Bedroom" lands after "3 Bedroom".
    const ok = await run(
      () => createUnitType(organizationId, { name, bedrooms: newBedrooms, sort_order: newBedrooms }),
      "Could not add that type"
    );
    if (ok) setNewName("");
  }

  function startEdit(t: UnitTypeDef) {
    setEditingId(t.id);
    setDraftName(t.name);
    setDraftBedrooms(t.bedrooms);
    setConfirmDeleteId(null);
  }

  async function saveEdit(t: UnitTypeDef) {
    const name = draftName.trim();
    if (!name) return;
    const ok = await run(
      () =>
        updateUnitType(organizationId, t.id, {
          name,
          bedrooms: draftBedrooms,
          // Keep a deliberate ordering (Office after the residential types) unless
          // the size itself changed.
          ...(draftBedrooms !== t.bedrooms ? { sort_order: draftBedrooms } : {}),
        }),
      "Could not save that change"
    );
    if (ok) setEditingId(null);
  }

  async function handleDelete(t: UnitTypeDef) {
    if (confirmDeleteId !== t.id) {
      setConfirmDeleteId(t.id);
      return;
    }
    setConfirmDeleteId(null);
    await run(() => deleteUnitType(organizationId, t.id), "Could not delete that type");
  }

  return (
    <Modal title="Unit types" onClose={onClose} size="lg">
      <div className="space-y-5">
        {intro && <p className="text-sm text-foreground">{intro}</p>}
        <p className="text-sm text-muted-foreground">
          Name them the way your building does. The bedroom count is what occupancy reports
          group on, so a Bedsitter and a Studio can both be zero.
        </p>

        {error && <p className="text-sm text-rust">{error}</p>}

        {!types ? (
          <div className="rounded-xl border border-border/60 divide-y divide-border/60">
            {[0, 1, 2].map((i) => (
              <div key={i} className="px-4 py-3 animate-pulse space-y-2">
                <div className="h-4 w-28 rounded bg-muted" />
                <div className="h-3 w-40 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : types.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-5 py-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">No unit types yet.</p>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run(() => seedDefaultUnitTypes(organizationId), "Could not add the common types")
              }
              className={primaryButton}
            >
              Start with Studio to 3 Bedroom
            </button>
            <p className="text-xs text-faint">Or add your own below.</p>
          </div>
        ) : (
          <ul className="rounded-xl border border-border/60 divide-y divide-border/60 bg-card">
            {types.map((t) => (
              <li key={t.id} className="px-4 py-3">
                {editingId === t.id ? (
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-[12rem] flex-1">
                      <label htmlFor={`edit-name-${t.id}`} className={labelClass}>
                        Name
                      </label>
                      <input
                        id={`edit-name-${t.id}`}
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        className={`${inputClass} w-full`}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label htmlFor={`edit-beds-${t.id}`} className={labelClass}>
                        Bedrooms
                      </label>
                      <select
                        id={`edit-beds-${t.id}`}
                        value={draftBedrooms}
                        onChange={(e) => setDraftBedrooms(Number(e.target.value))}
                        className={inputClass}
                      >
                        {BEDROOM_OPTIONS.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveEdit(t)}
                      disabled={busy || !draftName.trim()}
                      className={primaryButton}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className={secondaryButton}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className={t.is_active ? undefined : "opacity-60"}>
                      <div className="text-sm font-medium text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {bedroomLabel(t.bedrooms)} · {t.unit_count}{" "}
                        {t.unit_count === 1 ? "unit" : "units"}
                        {!t.is_active && " · Hidden from pickers"}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={() => startEdit(t)} className={quietButton}>
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run(
                            () => updateUnitType(organizationId, t.id, { is_active: !t.is_active }),
                            "Could not update that type"
                          )
                        }
                        className={quietButton}
                      >
                        {t.is_active ? "Hide" : "Show"}
                      </button>
                      {/* A type in use cannot be deleted - hiding is the way to retire it. */}
                      {t.unit_count === 0 && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleDelete(t)}
                          onBlur={() => setConfirmDeleteId(null)}
                          className={
                            confirmDeleteId === t.id
                              ? "rounded-md px-2.5 py-1.5 text-xs font-medium text-rust hover:bg-rust/10 transition-colors"
                              : quietButton
                          }
                        >
                          {confirmDeleteId === t.id ? "Confirm delete" : "Delete"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2 border-t border-border/60 pt-5">
          <div className="min-w-[12rem] flex-1">
            <label htmlFor="new-type-name" className={labelClass}>
              New type
            </label>
            <input
              id="new-type-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Bedsitter, 4 Bedroom Maisonette"
              className={`${inputClass} w-full`}
            />
          </div>
          <div>
            <label htmlFor="new-type-beds" className={labelClass}>
              Bedrooms
            </label>
            <select
              id="new-type-beds"
              value={newBedrooms}
              onChange={(e) => setNewBedrooms(Number(e.target.value))}
              className={inputClass}
            >
              {BEDROOM_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={busy || !newName.trim()} className={secondaryButton}>
            Add type
          </button>
        </form>
      </div>
    </Modal>
  );
}
