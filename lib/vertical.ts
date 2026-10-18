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

/** Shown until the business-type catalogue loads, and if the request fails. Keeps
 *  setup usable rather than blocking on a list that rarely changes. Mirrors
 *  BUSINESS_TYPES in the backend's verticals.py. */
export const FALLBACK_BUSINESS_TYPES: BusinessTypeOption[] = [
  {
    key: "apartment",
    label: "Apartment building",
    description: "A single building of flats with shared entrances.",
    property_type: "apartment",
    vertical: "residential",
  },
  {
    key: "estate",
    label: "Residential estate",
    description: "Gated housing with multiple homes and controlled access.",
    property_type: "residential_estate",
    vertical: "residential",
  },
  {
    key: "office",
    label: "Office",
    description: "Offices and business parks with reception-managed visitors.",
    property_type: "office_park",
    vertical: "office",
  },
  {
    key: "hotel",
    label: "Hotel",
    description: "Front-desk traffic and occupancy tracking. Not a booking system.",
    property_type: "hotel",
    vertical: "hotel",
  },
];

/** Display names for module slugs. Mirrors ALL_MODULES in the backend's verticals.py. */
export const MODULE_LABELS: Record<string, string> = {
  visitor_management: "Visitor management",
  maintenance: "Maintenance",
  packages: "Deliveries",
  occupancy_analytics: "Occupancy analytics",
  activity_log: "Activity log",
  smart_locks: "Smart locks",
};
