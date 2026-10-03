export type OrgType = "individual" | "company";
export type ApprovalStatus = "pending_approval" | "approved" | "rejected";

export interface OrgProperty {
  id: string;
  name: string;
  property_type: string;
}

export interface OrgMember {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
}

export interface Organization {
  id: string;
  name: string;
  org_type: OrgType;
  approval_status: ApprovalStatus;
  properties: OrgProperty[];
  members: OrgMember[];
}

export type UnitType =
  | "studio"
  | "1br"
  | "2br"
  | "3br"
  | "office"
  | "retail"
  | "other";

export type UnitStatus = "vacant" | "occupied" | "maintenance";

export interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  floor: string | null;
  block: string | null;
  /** Legacy enum, still returned during the transition. Prefer unit_type_name. */
  unit_type: UnitType;
  unit_type_id: string | null;
  unit_type_name: string | null;
  bedrooms: number | null;
  status: UnitStatus;
  created_at: string;
}

export interface StatusCount {
  status: UnitStatus;
  count: number;
}

export interface OccupancyStatusCountsResponse {
  property_id: string;
  counts: StatusCount[];
}

export interface OccupancyRateResponse {
  property_id: string;
  total_units: number;
  occupied_units: number;
  occupancy_rate: number;
}

export interface UnitTypeBreakdownItem {
  unit_type: UnitType;
  unit_type_name: string | null;
  bedrooms: number | null;
  total_units: number;
  occupied_units: number;
  occupancy_rate: number;
}

export interface OccupancyByUnitTypeResponse {
  property_id: string;
  breakdown: UnitTypeBreakdownItem[];
}

export type PropertyType =
  | "apartment"
  | "residential_estate"
  | "office_park"
  | "university"
  | "hotel"
  | "mall"
  | "commercial";

export type OrgMode = "individual" | "organization";

export interface MyOrgCreateRequest {
  mode: OrgMode;
  name?: string;
}

export interface MyPropertyCreateRequest {
  organization_id: string;
  name: string;
  property_type: PropertyType;
  address?: string;
}

export interface PropertyResponse {
  id: string;
  organization_id: string;
  name: string;
  property_type: PropertyType;
  vertical: string;
  address: string | null;
  created_at: string;
}

export interface OrgResponse {
  id: string;
  name: string;
  org_type: OrgType;
  approval_status: ApprovalStatus;
  created_at: string;
}

export interface Manager {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
}

export interface UnitCreateRequest {
  unit_number: string;
  floor?: string;
  unit_type: UnitType;
}

export interface UnitTypeCount {
  unit_type: UnitType;
  count: number;
}

export interface FloorSpec {
  floor_number: number;
  prefix?: string;
  unit_types: UnitTypeCount[];
}

export interface BulkGenerateRequest {
  floors: FloorSpec[];
}

export interface BulkGenerateCollisionError {
  message: string;
  colliding_unit_numbers: string[];
}

export interface CsvValidationError {
  message: string;
  errors: string[];
}

export interface InviteDetails {
  id: string;
  property_id: string;
  unit_id: string | null;
  invited_by: string;
  email: string;
  phone_number: string | null;
  token: string;
  role: "tenant" | "manager" | "staff" | "guard" | "owner";
  status: "pending" | "accepted" | "expired" | "revoked";
  expires_at: string;
  created_at: string;
  property_name: string | null;
  organization_name: string | null;
}

export interface InviteAcceptRequest {
  full_name: string;
  password: string;
}

export interface MyAccessItem {
  role: "tenant" | "staff" | "manager" | "owner" | "guard";
  organization_id: string;
  organization_name: string;
  property_id: string | null;
  property_name: string | null;
  unit_id: string | null;
  unit_number: string | null;
}
export interface OccupancyRate {
  property_id: string;
  total_units: number;
  occupied_units: number;
  occupancy_rate: number;
}

export interface WorkOrder {
  id: string;
  property_id: string;
  unit_id: string;
  raised_by: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "assigned" | "in_progress" | "pending_parts" | "resolved" | "closed";
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}
// --- Visitors / guard console ---

export type VisitType = "resident_invite" | "walk_in";

export type GuestVisitStatus =
  | "pending"
  | "checked_in"
  | "checked_out"
  | "expired"
  | "revoked";

export type IdType = "passport" | "national_id" | "drivers_license";

export interface GuardUnit {
  id: string;
  unit_number: string;
  floor: string | null;
}

export interface GuestOccupancyEntry {
  invite_id: string;
  unit_id: string | null;
  unit_number: string | null;
  visit_type: VisitType;
  host_name: string | null;
  purpose: string | null;
  full_name: string;
  phone: string | null;
  photo_url: string | null;
  checked_in_at: string;
}

export interface GuestLogEntry {
  invite_id: string;
  unit_id: string | null;
  unit_number: string | null;
  visit_type: VisitType;
  host_name: string | null;
  purpose: string | null;
  guest_name: string | null;
  full_name: string | null;
  status: GuestVisitStatus;
  checked_in_at: string | null;
  checked_out_at: string | null;
  created_at: string;
  expires_at: string;
}

export interface WalkInCheckinResult {
  invite_id: string;
  property_id: string;
  unit_id: string | null;
  unit_number: string | null;
  host_name: string | null;
  purpose: string | null;
  full_name: string;
  phone: string;
  photo_url: string | null;
  checked_in_at: string;
}

// --- Business type / vertical configuration ---

export type PropertyVertical = "residential" | "hotel" | "office" | "gym";

export interface BusinessTypeOption {
  key: string;
  label: string;
  description: string;
  property_type: string;
  vertical: PropertyVertical;
}

export interface VerticalConfig {
  key: string;
  label: string;
  description: string;
  space_noun: string;
  space_noun_plural: string;
  occupant_noun: string;
  occupant_noun_plural: string;
  visitor_noun: string;
  has_spaces: boolean;
  tracks_occupancy: boolean;
  requires_id_capture: boolean;
  allows_walk_ins: boolean;
  default_modules: string[];
}

export interface PropertyConfig {
  property_id: string;
  name: string;
  property_type: string;
  vertical: PropertyVertical;
  business_type_key: string | null;
  business_type_label: string | null;
  config: VerticalConfig;
  enabled_modules: string[];
}

// --- Resident portal ---

export type WorkOrderPriority = "low" | "medium" | "high" | "urgent";

export interface GuestInviteRecord {
  id: string;
  property_id: string;
  unit_id: string | null;
  visit_type: VisitType;
  invited_by: string | null;
  checked_in_by: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  host_name: string | null;
  purpose: string | null;
  token: string;
  status: GuestVisitStatus;
  expires_at: string;
  created_at: string;
}

export interface MyVisitorHistoryItem {
  guest_invite_id: string;
  unit_id: string | null;
  guest_name: string;
  checked_in_at: string;
  status: GuestVisitStatus;
}

export interface Package {
  id: string;
  unit_id: string;
  unit_number: string | null;
  property_id: string;
  description: string | null;
  logged_by_user_id: string;
  status: string;
  created_at: string;
  picked_up_at: string | null;
}

// --- Platform admin (super admin) ---

export interface PlatformOverview {
  total_clients: number;
  awaiting_verification: number;
  verified_clients: number;
  rejected: number;
}

export interface ClientSummary {
  organization_id: string;
  name: string;
  org_type: OrgType;
  approval_status: ApprovalStatus;
  created_at: string;
  owner_name: string | null;
  owner_email: string | null;
  property_count: number;
}

export interface CurrentUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  is_platform_admin: boolean;
}

// --- Unit types and setup ---

/** A unit type the organization defined itself. `name` is theirs; `bedrooms` is the
 *  comparable fact every breakdown computes on. */
export interface UnitTypeDef {
  id: string;
  organization_id: string;
  name: string;
  bedrooms: number;
  bathrooms: number | null;
  /** Decimals arrive as strings so no precision is lost on the way. */
  size_sqm: string | null;
  base_rent: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string | null;
  unit_count: number;
}

export interface UnitTypeCreate {
  name: string;
  bedrooms: number;
  bathrooms?: number | null;
  sort_order?: number;
}

export type UnitTypeUpdate = Partial<UnitTypeCreate> & { is_active?: boolean };

export type NumberingScheme =
  | "floor_prefixed"
  | "block_floor"
  | "block_number"
  | "sequential"
  | "floor_letter";

export interface GeneratePlanRequest {
  scheme: NumberingScheme;
  floors_from: number;
  floors_to: number;
  units_per_floor: number;
  /** One unit type id per position on a floor; length must equal units_per_floor. */
  layout: string[];
  blocks?: string[];
  start_index?: number;
  pad?: number;
}

export interface PlannedUnit {
  unit_number: string;
  floor: string | null;
  block: string | null;
  unit_type_id: string;
  unit_type_name: string;
  bedrooms: number;
  collides: boolean;
  collision_reason: string | null;
}

export interface GeneratePlanResponse {
  total: number;
  creatable: number;
  collisions: number;
  units: PlannedUnit[];
}

export interface UnitCommitItem {
  unit_number: string;
  floor: string | null;
  block: string | null;
  unit_type_id: string;
}

export interface CsvRowPreview {
  row_number: number;
  unit_number: string | null;
  floor: string | null;
  block: string | null;
  unit_type_name: string | null;
  unit_type_id: string | null;
  error: string | null;
}

export interface CsvPreviewResponse {
  total_rows: number;
  valid_rows: number;
  errors: string[];
  rows: CsvRowPreview[];
}

// --- Residents ---

export interface Resident {
  user_id: string;
  full_name: string | null;
  email: string;
  phone_number: string | null;
  since: string | null;
}

export interface MoveOutResult {
  user_id: string;
  unit_id: string;
  moved_out_at: string;
  /** When their details are erased, unless they live or work elsewhere on Muna by then. */
  data_removed_after: string;
}
