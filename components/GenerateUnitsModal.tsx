"use client";

import { useMemo, useState } from "react";
import Modal from "./Modal";
import { GeneratePlanResponse, NumberingScheme, UnitTypeDef } from "@/lib/types";
import {
  SCHEME_OPTIONS,
  commitUnits,
  formatUnitNumber,
  previewGeneratedUnits,
} from "@/lib/unit-types";
import { inputClass, labelClass, primaryButton, secondaryButton } from "./setup-styles";

interface GenerateUnitsModalProps {
  propertyId: string;
  /** The organization's active unit types. Never empty: the toolbar sends the manager
   *  to set types up before this can open. */
  types: UnitTypeDef[];
  existingUnitNumbers: string[];
  onClose: () => void;
  onCreated: (count: number) => void;
}

interface ReviewRow {
  key: string;
  unit_number: string;
  floor: string | null;
  block: string | null;
  unit_type_id: string;
}

// The backend takes up to 2,000 rows in one commit. A building bigger than that is
// better generated a block or a few floors at a time anyway.
const MAX_UNITS = 2000;
const MAX_BLOCKS = 26;
const EXISTS_REASON = "Already exists on this property";

function parseBlocks(raw: string): string[] {
  return raw
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean);
}

function toInt(raw: string): number | null {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

/** Three sample numbers under each scheme, using whatever blocks have been typed. */
function schemeExample(scheme: NumberingScheme, blocks: string[]): string {
  const a = blocks[0] ?? "A";
  const b = blocks[1] ?? "B";
  const f = (floor: number, position: number, index: number, block: string | null) =>
    formatUnitNumber(scheme, floor, position, index, block);
  const samples: Record<NumberingScheme, string[]> = {
    floor_prefixed: [f(1, 1, 1, null), f(1, 2, 2, null), f(2, 1, 3, null)],
    block_floor: [f(1, 1, 1, a), f(1, 2, 2, a), f(1, 1, 1, b)],
    block_number: [f(1, 1, 1, a), f(1, 2, 2, a), f(1, 1, 1, b)],
    floor_letter: [f(1, 1, 1, null), f(1, 2, 2, null), f(2, 1, 3, null)],
    sequential: ["1", "2", "3"],
  };
  return `${samples[scheme].join(", ")} …`;
}

export default function GenerateUnitsModal({
  propertyId,
  types,
  existingUnitNumbers,
  onClose,
  onCreated,
}: GenerateUnitsModalProps) {
  const firstType = types[0]?.id ?? "";

  const [step, setStep] = useState<"describe" | "review">("describe");

  const [scheme, setScheme] = useState<NumberingScheme>("floor_prefixed");
  const [blocksRaw, setBlocksRaw] = useState("A, B");
  const [floorsFrom, setFloorsFrom] = useState("1");
  const [floorsTo, setFloorsTo] = useState("4");
  const [perFloor, setPerFloor] = useState("4");
  const [layout, setLayout] = useState<string[]>(() => Array(4).fill(firstType));

  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [knownExisting, setKnownExisting] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const option = SCHEME_OPTIONS.find((o) => o.value === scheme) ?? SCHEME_OPTIONS[0];
  const typedBlocks = parseBlocks(blocksRaw);
  const blocks = option.usesBlocks ? typedBlocks : [];
  const from = option.usesFloors ? toInt(floorsFrom) : 1;
  const to = option.usesFloors ? toInt(floorsTo) : 1;
  const per = toInt(perFloor);

  const blockCount = option.usesBlocks ? blocks.length : 1;
  const floorCount = from !== null && to !== null && to >= from ? to - from + 1 : 0;
  const total = per !== null && per > 0 ? blockCount * floorCount * per : 0;

  const perUnitLabel = option.usesFloors
    ? "Units per floor"
    : option.usesBlocks
      ? "Units per block"
      : "Number of units";

  const layoutCounts = new Map<string, number>();
  for (const id of layout) layoutCounts.set(id, (layoutCounts.get(id) ?? 0) + 1);
  const mix = types
    .filter((t) => layoutCounts.has(t.id))
    .map((t) => `${((layoutCounts.get(t.id) ?? 0) * blockCount * floorCount).toLocaleString()} × ${t.name}`);

  function changePerFloor(raw: string) {
    setPerFloor(raw);
    const n = toInt(raw);
    if (n === null || n < 1 || n > 50) return;
    // Keep the positions already chosen; new ones copy the last, which is usually
    // what a manager adding "one more unit per floor" means.
    setLayout((prev) => {
      const next = prev.slice(0, n);
      const fill = prev[prev.length - 1] ?? firstType;
      while (next.length < n) next.push(fill);
      return next;
    });
  }

  function validationProblem(): string | null {
    if (option.usesBlocks && blocks.length === 0) return "Add at least one block name.";
    if (option.usesBlocks && blocks.length > MAX_BLOCKS) return `Up to ${MAX_BLOCKS} blocks at a time.`;
    if (option.usesFloors && (from === null || to === null)) return "Enter the first and last floor.";
    if (from !== null && to !== null && to < from) return "The last floor must be at or above the first.";
    if (per === null || per < 1) return `${perUnitLabel} must be at least 1.`;
    if (per > 50) return `${perUnitLabel} can be at most 50.`;
    if (total > MAX_UNITS) {
      return `That is ${total.toLocaleString()} units. Generate up to ${MAX_UNITS.toLocaleString()} at a time - a block or a few floors per run.`;
    }
    return null;
  }

  async function handlePreview() {
    const issue = validationProblem();
    if (issue) {
      setError(issue);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const plan: GeneratePlanResponse = await previewGeneratedUnits(propertyId, {
        scheme,
        floors_from: from ?? 1,
        floors_to: to ?? 1,
        units_per_floor: per ?? 1,
        layout,
        blocks,
      });
      setKnownExisting(
        plan.units.filter((u) => u.collision_reason === EXISTS_REASON).map((u) => u.unit_number)
      );
      setRows(
        plan.units.map((u) => ({
          key: crypto.randomUUID(),
          unit_number: u.unit_number,
          // Schemes without floors still get floor "1" from the generator; storing it
          // would label every house in an estate as being on the first floor.
          floor: option.usesFloors ? u.floor : null,
          block: u.block,
          unit_type_id: u.unit_type_id,
        }))
      );
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build the preview");
    } finally {
      setBusy(false);
    }
  }

  // Re-checked on every edit, so renaming a clashing row to a free number brings it
  // straight back into the batch.
  const existing = useMemo(
    () => new Set([...existingUnitNumbers, ...knownExisting]),
    [existingUnitNumbers, knownExisting]
  );
  const reasons = useMemo(() => {
    const seen = new Set<string>();
    return rows.map((r) => {
      const n = r.unit_number.trim();
      let reason: string | null = null;
      if (!n) reason = "No number";
      else if (existing.has(n)) reason = "Already exists";
      else if (seen.has(n)) reason = "Duplicate";
      if (n) seen.add(n);
      return reason;
    });
  }, [rows, existing]);

  const creatable = reasons.filter((r) => r === null).length;
  const skipped = rows.length - creatable;

  function updateRow(key: string, patch: Partial<ReviewRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  async function handleCreate() {
    const items = rows
      .filter((_, i) => reasons[i] === null)
      .map((r) => ({
        unit_number: r.unit_number.trim(),
        floor: r.floor,
        block: r.block,
        unit_type_id: r.unit_type_id,
      }));
    if (items.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await commitUnits(propertyId, items);
      onCreated(items.length);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the units");
    } finally {
      setBusy(false);
    }
  }

  const typeOptions = types.map((t) => (
    <option key={t.id} value={t.id}>
      {t.name}
    </option>
  ));

  return (
    <Modal title="Generate units" onClose={onClose} size="xl">
      {step === "describe" ? (
        <div className="space-y-6">
          <section>
            <p className={labelClass}>How are units numbered?</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SCHEME_OPTIONS.map((o) => {
                const selected = o.value === scheme;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setScheme(o.value)}
                    aria-pressed={selected}
                    className={`rounded-xl border px-3.5 py-3 text-left transition-colors ${
                      selected
                        ? "border-foreground bg-surface"
                        : "border-border hover:border-border-strong hover:bg-surface/60"
                    }`}
                  >
                    <span className="block text-sm font-medium text-foreground">{o.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{o.hint}</span>
                    <span className="mt-2 block font-mono text-xs tabular-nums text-foreground/80">
                      {schemeExample(o.value, typedBlocks)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {option.usesBlocks && (
              <div className="col-span-2">
                <label htmlFor="gen-blocks" className={labelClass}>
                  Blocks
                </label>
                <input
                  id="gen-blocks"
                  value={blocksRaw}
                  onChange={(e) => setBlocksRaw(e.target.value)}
                  placeholder="A, B, C"
                  className={`${inputClass} w-full`}
                />
              </div>
            )}
            {option.usesFloors && (
              <>
                <div>
                  <label htmlFor="gen-from" className={labelClass}>
                    First floor
                  </label>
                  <input
                    id="gen-from"
                    type="number"
                    min={0}
                    max={200}
                    value={floorsFrom}
                    onChange={(e) => setFloorsFrom(e.target.value)}
                    className={`${inputClass} w-full`}
                  />
                </div>
                <div>
                  <label htmlFor="gen-to" className={labelClass}>
                    Last floor
                  </label>
                  <input
                    id="gen-to"
                    type="number"
                    min={0}
                    max={200}
                    value={floorsTo}
                    onChange={(e) => setFloorsTo(e.target.value)}
                    className={`${inputClass} w-full`}
                  />
                </div>
              </>
            )}
            <div>
              <label htmlFor="gen-per" className={labelClass}>
                {perUnitLabel}
              </label>
              <input
                id="gen-per"
                type="number"
                min={1}
                max={50}
                value={perFloor}
                onChange={(e) => changePerFloor(e.target.value)}
                className={`${inputClass} w-full`}
              />
            </div>
            {option.usesFloors && (
              <p className="col-span-full text-xs text-faint">Use 0 for the ground floor.</p>
            )}
          </section>

          <section>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                {option.usesFloors ? "Type at each position on a floor" : "Type of each unit"}
              </p>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Set all to
                <select
                  value=""
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) setLayout((prev) => prev.map(() => value));
                  }}
                  className={`${inputClass} py-1 text-xs`}
                >
                  <option value="">Choose…</option>
                  {typeOptions}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {layout.map((typeId, i) => {
                const position = i + 1;
                const example = formatUnitNumber(scheme, from ?? 1, position, position, blocks[0] ?? null);
                return (
                  <label
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-border/70 px-2.5 py-1.5"
                  >
                    <span className="w-12 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                      {example}
                    </span>
                    <select
                      value={typeId}
                      onChange={(e) => {
                        const value = e.target.value;
                        setLayout((prev) => prev.map((v, j) => (j === i ? value : v)));
                      }}
                      aria-label={`Type for ${example}`}
                      className="min-w-0 flex-1 bg-transparent text-sm text-foreground focus:outline-none"
                    >
                      {typeOptions}
                    </select>
                  </label>
                );
              })}
            </div>
          </section>

          {error && <p className="text-sm text-rust">{error}</p>}

          <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-card pt-4">
            <p className="text-sm text-muted-foreground">
              {total > 0 ? (
                <>
                  <span className="font-medium text-foreground">
                    {total.toLocaleString()} {total === 1 ? "unit" : "units"}
                  </span>
                  {mix.length > 0 && ` - ${mix.join(", ")}`}
                </>
              ) : (
                "Describe the building to see how many units it makes."
              )}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className={secondaryButton}>
                Cancel
              </button>
              <button type="button" onClick={handlePreview} disabled={busy} className={primaryButton}>
                {busy ? "Building preview…" : "Preview"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-foreground">
              <span className="font-medium">
                {creatable.toLocaleString()} {creatable === 1 ? "unit" : "units"} ready.
              </span>
              {skipped > 0 && (
                <span className="text-muted-foreground"> {skipped.toLocaleString()} will be skipped.</span>
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Change any number or type, or remove a row. Nothing is saved until you create.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Number</th>
                  {option.usesBlocks && <th className="px-3 py-2 font-medium">Block</th>}
                  {option.usesFloors && <th className="px-3 py-2 font-medium">Floor</th>}
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2">
                    <span className="sr-only">Status</span>
                  </th>
                  <th className="px-2 py-2">
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((row, i) => {
                  const reason = reasons[i];
                  return (
                    <tr key={row.key} className={reason ? "bg-surface/50" : undefined}>
                      <td className="px-3 py-1.5">
                        <input
                          value={row.unit_number}
                          onChange={(e) => updateRow(row.key, { unit_number: e.target.value })}
                          aria-label="Unit number"
                          className={`w-28 rounded-md border border-transparent bg-transparent px-2 py-1 font-mono text-sm tabular-nums hover:border-border focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-ring/35 ${
                            reason ? "text-muted-foreground" : "text-foreground"
                          }`}
                        />
                      </td>
                      {option.usesBlocks && (
                        <td className="px-3 py-1.5 text-muted-foreground">{row.block}</td>
                      )}
                      {option.usesFloors && (
                        <td className="px-3 py-1.5 tabular-nums text-muted-foreground">{row.floor}</td>
                      )}
                      <td className="px-3 py-1.5">
                        <select
                          value={row.unit_type_id}
                          onChange={(e) => updateRow(row.key, { unit_type_id: e.target.value })}
                          aria-label="Unit type"
                          className="rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm text-foreground hover:border-border focus:border-border-strong focus:outline-none"
                        >
                          {typeOptions}
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-3 py-1.5 text-xs text-muted-foreground">
                        {reason ? `${reason} · skipped` : ""}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => removeRow(row.key)}
                          aria-label={`Remove ${row.unit_number || "row"}`}
                          className="rounded px-1.5 text-lg leading-none text-faint hover:text-foreground"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {error && <p className="text-sm text-rust">{error}</p>}

          <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border/60 bg-card pt-4">
            <button
              type="button"
              onClick={() => {
                setStep("describe");
                setError(null);
              }}
              className={secondaryButton}
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={busy || creatable === 0}
              className={primaryButton}
            >
              {busy
                ? "Creating…"
                : `Create ${creatable.toLocaleString()} ${creatable === 1 ? "unit" : "units"}`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
