"use client";

import { useRef, useState } from "react";
import Modal from "./Modal";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Unit, CsvValidationError } from "@/lib/types";

interface ImportUnitsCsvModalProps {
  propertyId: string;
  onClose: () => void;
  onCreated: () => void;
}

const TEMPLATE = "unit_number,floor,unit_type\n101,1,studio\n102,1,1br\n";

export default function ImportUnitsCsvModal({
  propertyId,
  onClose,
  onCreated,
}: ImportUnitsCsvModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<string[] | null>(null);

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "units_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRowErrors(null);

    if (!file) {
      setError("Choose a CSV file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setSubmitting(true);
    try {
      await apiFetch<Unit[]>(`/properties/${propertyId}/units/import-csv`, {
        method: "POST",
        body: formData,
      });
      onCreated();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const detail = err.detail as CsvValidationError | undefined;
        if (detail?.errors) {
          setRowErrors(detail.errors);
          setError("CSV validation failed — no units were created");
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : "Failed to import CSV");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Import Units from CSV" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            CSV needs headers <code className="bg-muted px-1 py-0.5 rounded text-xs">unit_number</code>,{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">floor</code>,{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">unit_type</code>.
          </p>
          <button
            type="button"
            onClick={downloadTemplate}
            className="text-gold hover:underline text-sm font-medium"
          >
            Download template
          </button>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-foreground file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-muted file:text-foreground file:text-sm file:font-medium hover:file:bg-muted/70 file:transition-colors file:duration-150"
          />
        </div>

        {error && <p className="text-sm text-rust">{error}</p>}
        {rowErrors && rowErrors.length > 0 && (
          <div className="text-xs text-rust bg-rust/10 rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
            {rowErrors.map((e, i) => (
              <div key={i}>{e}</div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !file}
          className="w-full bg-gold text-ink rounded-md py-2 text-sm font-medium hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 transition-all duration-150"
        >
          {submitting ? "Importing..." : "Import CSV"}
        </button>
      </form>
    </Modal>
  );
}