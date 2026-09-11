import { apiFetch } from "./api-client";
import {
  CsvPreviewResponse,
  GeneratePlanRequest,
  GeneratePlanResponse,
  NumberingScheme,
  PropertyResponse,
  Unit,
  UnitCommitItem,
  UnitType,
  UnitTypeCreate,
  UnitTypeDef,
  UnitTypeUpdate,
} from "./types";

// --- the organization's type list ---------------------------------------------------

export function listUnitTypes(orgId: string, includeInactive = false): Promise<UnitTypeDef[]> {
  const query = includeInactive ? "?include_inactive=true" : "";
  return apiFetch<UnitTypeDef[]>(`/organizations/${orgId}/unit-types${query}`);
}

export function createUnitType(orgId: string, body: UnitTypeCreate): Promise<UnitTypeDef> {
  return apiFetch<UnitTypeDef>(`/organizations/${orgId}/unit-types`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateUnitType(
  orgId: string,
  unitTypeId: string,
  body: UnitTypeUpdate
): Promise<UnitTypeDef> {
  return apiFetch<UnitTypeDef>(`/organizations/${orgId}/unit-types/${unitTypeId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteUnitType(orgId: string, unitTypeId: string): Promise<void> {
  return apiFetch<void>(`/organizations/${orgId}/unit-types/${unitTypeId}`, {
    method: "DELETE",
  });
}

export function seedDefaultUnitTypes(orgId: string): Promise<UnitTypeDef[]> {
  return apiFetch<UnitTypeDef[]>(`/organizations/${orgId}/unit-types/seed-defaults`, {
    method: "POST",
  });
}

/** Unit types belong to the organization, but most screens only know the property.
 *  The property record carries the organization, so one call resolves it. */
export async function getOrganizationIdForProperty(propertyId: string): Promise<string> {
  const property = await apiFetch<PropertyResponse>(`/properties/${propertyId}`);
  return property.organization_id;
}

// --- generator ------------------------------------------------------------------------

export function previewGeneratedUnits(
  propertyId: string,
  body: GeneratePlanRequest
): Promise<GeneratePlanResponse> {
  return apiFetch<GeneratePlanResponse>(`/properties/${propertyId}/units/generate/preview`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Saves exactly the rows given. Also how a single unit is added - a batch of one. */
export function commitUnits(propertyId: string, units: UnitCommitItem[]): Promise<Unit[]> {
  return apiFetch<Unit[]>(`/properties/${propertyId}/units/generate`, {
    method: "POST",
    body: JSON.stringify({ units }),
  });
}

// --- CSV --------------------------------------------------------------------------------

export function previewCsvImport(propertyId: string, file: File): Promise<CsvPreviewResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<CsvPreviewResponse>(`/properties/${propertyId}/units/import/preview`, {
    method: "POST",
    body: form,
  });
}

export function commitCsvImport(propertyId: string, file: File): Promise<Unit[]> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<Unit[]>(`/properties/${propertyId}/units/import`, {
    method: "POST",
    body: form,
  });
}

// --- numbering, mirrored from the backend so the form can show a live example -----------

export interface SchemeOption {
  value: NumberingScheme;
  label: string;
  hint: string;
  usesBlocks: boolean;
  usesFloors: boolean;
}

export const SCHEME_OPTIONS: SchemeOption[] = [
  { value: "floor_prefixed", label: "Floor + number", hint: "Most apartment blocks", usesBlocks: false, usesFloors: true },
  { value: "block_floor", label: "Block + floor + number", hint: "Blocks that also have floors", usesBlocks: true, usesFloors: true },
  { value: "block_number", label: "Block + number", hint: "Estates and gated communities", usesBlocks: true, usesFloors: false },
  { value: "floor_letter", label: "Floor + letter", hint: "Older buildings", usesBlocks: false, usesFloors: true },
  { value: "sequential", label: "Plain sequence", hint: "Small blocks", usesBlocks: false, usesFloors: false },
];

/** The same formatting the backend applies. Used only for the example line under the
 *  scheme picker - the preview itself always comes from the server. */
export function formatUnitNumber(
  scheme: NumberingScheme,
  floor: number,
  position: number,
  runningIndex: number,
  block: string | null,
  pad = 2
): string {
  const padded = String(position).padStart(pad, "0");
  switch (scheme) {
    case "floor_prefixed":
      return `${floor}${padded}`;
    case "block_floor":
      return `${block ?? ""}${floor}${padded}`;
    case "block_number":
      return `${block ?? ""}${runningIndex}`;
    case "floor_letter":
      return `${floor}${position >= 1 && position <= 26 ? String.fromCharCode(64 + position) : position}`;
    default:
      return String(runningIndex);
  }
}

/** "0 bedrooms", "1 bedroom", "4 bedrooms". */
export function bedroomLabel(bedrooms: number): string {
  return `${bedrooms} bedroom${bedrooms === 1 ? "" : "s"}`;
}

// --- labels --------------------------------------------------------------------------------

const LEGACY_LABELS: Record<UnitType, string> = {
  studio: "Studio",
  "1br": "1 Bedroom",
  "2br": "2 Bedroom",
  "3br": "3 Bedroom",
  office: "Office",
  retail: "Retail",
  other: "Other",
};

/** For the rare row that has no real type yet. Matches the names the backfill gave. */
export function legacyUnitTypeLabel(value: UnitType): string {
  return LEGACY_LABELS[value] ?? value;
}

/** "Block A · Floor 1 · 2 Bedroom" - the secondary line under a unit number. */
export function describeUnit(unit: Unit): string {
  return [
    unit.block ? `Block ${unit.block}` : null,
    unit.floor ? `Floor ${unit.floor}` : null,
    unit.unit_type_name ?? legacyUnitTypeLabel(unit.unit_type),
  ]
    .filter(Boolean)
    .join(" · ");
}
