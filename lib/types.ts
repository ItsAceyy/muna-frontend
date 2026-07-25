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
  unit_type: UnitType;
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