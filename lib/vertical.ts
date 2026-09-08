import { apiFetch } from "./api-client";
import { BusinessTypeOption, PropertyConfig, VerticalConfig } from "./types";

export async function getBusinessTypes(): Promise<BusinessTypeOption[]> {
  return apiFetch<BusinessTypeOption[]>("/business-types");
}

export async function getPropertyConfig(propertyId: string): Promise<PropertyConfig> {
  return apiFetch<PropertyConfig>(`/properties/${propertyId}/config`);
}

/** What the interface falls back to before the config has loaded, or if it fails.
 *  Residential wording, everything on - the least surprising default. */
export const FALLBACK_CONFIG: VerticalConfig = {
  key: "residential",
  label: "Residential",
  description: "",
  space_noun: "Unit",
  space_noun_plural: "Units",
  occupant_noun: "Resident",
  occupant_noun_plural: "Residents",
  visitor_noun: "Guest",
  has_spaces: true,
  tracks_occupancy: true,
  requires_id_capture: true,
  allows_walk_ins: true,
  default_modules: [],
};

export function hasModule(config: PropertyConfig | null, slug: string): boolean {
  if (!config) return true; // don't hide things while we're still loading
  return config.enabled_modules.includes(slug);
}
