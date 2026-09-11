"use client";

import { useState } from "react";
import Modal from "./Modal";
import { CsvPreviewResponse, CsvRowPreview } from "@/lib/types";
import { commitCsvImport, previewCsvImport } from "@/lib/unit-types";
import { primaryButton, secondaryButton } from "./setup-styles";

interface ImportUnitsCsvModalProps {
  propertyId: string;
  /** The organization's active type names - the values the `type` column must match. */
  typeNames: string[];
  onClose: () => void;
  onCreated: (count: number) => void;
}

// A file with thousands of rows is valid, but nobody reads a table that long. The rows
// that need fixing come first, then enough of the rest to confirm the file parsed.
const MAX_ROWS_SHOWN = 300;

const codeClass = "rounded bg-muted px-1 py-0.5 text-xs text-foreground";

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** A template that already uses this organization's own type names, so the first
 *  file a manager fills in is valid by construction. */
function buildTemplate(typeNames: string[]): string {
  const first = csvCell(typeNames[0] ?? "1 Bedroom");
  const second = csvCell(typeNames[1] ?? typeNames[0] ?? "1 Bedroom");
  return ["unit_number,type,block,floor", `A101,${first},A,1`, `A102,${second},A,1`, `A201,${first},A,2`].join("\n") + "\n";
}

export default function ImportUnitsCsvModal({
  propertyId,
  typeNames,
  onClose,
  onCreated,
}: ImportUnitsCsvModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvPreviewResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function downloadTemplate() {
    const blob = new Blob([buildTemplate(typeNames)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "units_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function choose(next: File | null) {
    setFile(next);
    setPreview(null);
    setError(null);
    if (!next) return;
    setChecking(true);
    try {
      setPreview(await previewCsvImport(propertyId, next));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file");
    } finally {
      setChecking(false);
    }
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      const created = await commitCsvImport(propertyId, file);
      onCreated(created.length);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The import failed");
    } finally {
      setImporting(false);
    }
  }

  const blocking = preview?.errors.length ?? 0;
  const canImport = !!preview && blocking === 0 && preview.valid_rows > 0;

  const orderedRows: CsvRowPreview[] = preview
    ? [...preview.rows.filter((r) => r.error), ...preview.rows.filter((r) => !r.error)]
    : [];
  const shownRows = orderedRows.slice(0, MAX_ROWS_SHOWN);
  const hasBlocks = preview?.rows.some((r) => r.block) ?? false;
  const hasFloors = preview?.rows.some((r) => r.floor) ?? false;

  return (
    <Modal title="Import units" onClose={onClose} size="lg">
      <div className="space-y-5">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Use a CSV with the columns <code className={codeClass}>unit_number</code> and{" "}
            <code className={codeClass}>type</code>. <code className={codeClass}>block</code> and{" "}
            <code className={codeClass}>floor</code> are optional. Excel and Google Sheets both save
            to CSV.
          </p>
          <p>
            <code className={codeClass}>type</code> must match one of your unit types:{" "}
            <span className="text-foreground">{typeNames.join(", ")}</span>. Capitals don&apos;t
            matter.
          </p>
          <button
            type="button"
            onClick={downloadTemplate}
            className="text-sm font-medium text-foreground underline underline-offset-2 hover:text-gold transition-colors"
          >
            Download a template
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className={`${secondaryButton} cursor-pointer`}>
            {file ? "Choose another file" : "Choose file"}
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const next = e.target.files?.[0] ?? null;
                // Cleared so that choosing the same file again, once it has been
                // fixed, still counts as a change.
                e.target.value = "";
                choose(next);
              }}
            />
          </label>
          {file && <span className="truncate text-sm text-muted-foreground">{file.name}</span>}
        </div>

        {checking && <p className="text-sm text-muted-foreground">Checking your file…</p>}

        {preview && (
          <div className="space-y-3">
            {blocking === 0 ? (
              <p className="text-sm font-medium text-foreground">
                {preview.valid_rows.toLocaleString()} {preview.valid_rows === 1 ? "unit" : "units"} ready
                to import.
              </p>
            ) : (
              <p className="text-sm text-foreground">
                <span className="font-medium">
                  {preview.valid_rows.toLocaleString()} of {preview.total_rows.toLocaleString()} rows are
                  ready.
                </span>{" "}
                <span className="text-muted-foreground">
                  Nothing is imported until every row is valid. Fix the rows below in your file and
                  choose it again.
                </span>
              </p>
            )}

            {preview.rows.length === 0 && preview.errors.length > 0 && (
              <ul className="space-y-1 text-sm text-rust">
                {preview.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}

            {shownRows.length > 0 && (
              <div className="max-h-80 overflow-auto rounded-xl border border-border/60">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-surface text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Row</th>
                      <th className="px-3 py-2 font-medium">Number</th>
                      {hasBlocks && <th className="px-3 py-2 font-medium">Block</th>}
                      {hasFloors && <th className="px-3 py-2 font-medium">Floor</th>}
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2">
                        <span className="sr-only">Status</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {shownRows.map((row) => (
                      <tr key={row.row_number}>
                        <td className="px-3 py-1.5 tabular-nums text-faint">{row.row_number}</td>
                        <td className="px-3 py-1.5 font-mono tabular-nums text-foreground">
                          {row.unit_number ?? "-"}
                        </td>
                        {hasBlocks && <td className="px-3 py-1.5 text-muted-foreground">{row.block}</td>}
                        {hasFloors && (
                          <td className="px-3 py-1.5 tabular-nums text-muted-foreground">{row.floor}</td>
                        )}
                        <td className="px-3 py-1.5 text-foreground">{row.unit_type_name ?? "-"}</td>
                        <td className="px-3 py-1.5 text-xs">
                          {row.error ? (
                            <span className="text-rust">{row.error}</span>
                          ) : (
                            <span className="text-muted-foreground">Ready</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {orderedRows.length > MAX_ROWS_SHOWN && (
              <p className="text-xs text-muted-foreground">
                Showing {MAX_ROWS_SHOWN} of {orderedRows.length.toLocaleString()} rows.
              </p>
            )}
          </div>
        )}

        {error && <p className="text-sm text-rust">{error}</p>}

        <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!canImport || importing}
            className={primaryButton}
          >
            {importing
              ? "Importing…"
              : canImport && preview
                ? `Import ${preview.valid_rows.toLocaleString()} ${preview.valid_rows === 1 ? "unit" : "units"}`
                : "Import"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
