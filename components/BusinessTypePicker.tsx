"use client";

import { useEffect, useState } from "react";
import { BusinessTypeOption } from "@/lib/types";
import { FALLBACK_BUSINESS_TYPES, getBusinessTypes } from "@/lib/vertical";

/** The business types offered at setup, live from the backend with a built-in
 *  fallback. Shared by the setup wizard and the New Property modal. */
export function useBusinessTypes(): BusinessTypeOption[] {
  const [types, setTypes] = useState<BusinessTypeOption[]>(FALLBACK_BUSINESS_TYPES);

  useEffect(() => {
    let cancelled = false;
    getBusinessTypes()
      .then((data) => {
        if (!cancelled && data.length) setTypes(data);
      })
      .catch(() => {
        // Keep the fallback list; the choice matters more than it being live.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return types;
}

interface BusinessTypePickerProps {
  types: BusinessTypeOption[];
  selected: string;
  onSelect: (key: string) => void;
}

export default function BusinessTypePicker({ types, selected, onSelect }: BusinessTypePickerProps) {
  return (
    <div className="space-y-2">
      {types.map((t) => {
        const isActive = t.key === selected;
        return (
          <label
            key={t.key}
            className={
              isActive
                ? "flex gap-3 items-start p-3.5 rounded-xl border border-gold bg-gold/[0.07] cursor-pointer transition-colors"
                : "flex gap-3 items-start p-3.5 rounded-xl border border-border bg-card hover:border-border-strong cursor-pointer transition-colors"
            }
          >
            <input
              type="radio"
              name="business_type"
              value={t.key}
              checked={isActive}
              onChange={() => onSelect(t.key)}
              className="mt-1 accent-[var(--gold)]"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">{t.label}</span>
              <span className="block text-xs text-muted-foreground mt-0.5">{t.description}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
