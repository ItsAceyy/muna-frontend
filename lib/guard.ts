import { apiFetch } from "./api-client";
import {
  GuardUnit,
  GuestLogEntry,
  GuestOccupancyEntry,
  IdType,
  WalkInCheckinResult,
} from "./types";

export async function getGuardOccupancy(
  propertyId: string,
  search?: string
): Promise<GuestOccupancyEntry[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch<GuestOccupancyEntry[]>(
    `/properties/${propertyId}/guard/occupancy${qs}`
  );
}

export async function getGuardLogs(
  propertyId: string,
  options: { search?: string; limit?: number; offset?: number } = {}
): Promise<GuestLogEntry[]> {
  const params = new URLSearchParams();
  if (options.search) params.set("search", options.search);
  if (options.limit != null) params.set("limit", String(options.limit));
  if (options.offset != null) params.set("offset", String(options.offset));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<GuestLogEntry[]>(`/properties/${propertyId}/guard/logs${qs}`);
}

export async function getGuardUnits(propertyId: string): Promise<GuardUnit[]> {
  return apiFetch<GuardUnit[]>(`/properties/${propertyId}/guard/units`);
}

export async function checkoutGuest(
  propertyId: string,
  inviteId: string
): Promise<void> {
  await apiFetch(
    `/properties/${propertyId}/guard/guest-invites/${inviteId}/checkout`,
    { method: "POST" }
  );
}

export interface WalkInPayload {
  fullName: string;
  phone: string;
  facePhoto: Blob;
  unitId?: string | null;
  hostName?: string | null;
  purpose?: string | null;
  idType?: IdType | null;
  idNumber?: string | null;
  idPhoto?: Blob | null;
}

export async function checkInWalkIn(
  propertyId: string,
  payload: WalkInPayload
): Promise<WalkInCheckinResult> {
  const form = new FormData();
  form.set("full_name", payload.fullName);
  form.set("phone", payload.phone);
  form.set("face_photo", payload.facePhoto, "face.jpg");

  // Only send the optional fields that are actually filled in. Sending an empty
  // string would be stored as an empty value rather than left null.
  if (payload.unitId) form.set("unit_id", payload.unitId);
  if (payload.hostName) form.set("host_name", payload.hostName);
  if (payload.purpose) form.set("purpose", payload.purpose);
  if (payload.idType) form.set("id_type", payload.idType);
  if (payload.idNumber) form.set("id_number", payload.idNumber);
  if (payload.idPhoto) form.set("id_photo", payload.idPhoto, "id.jpg");

  return apiFetch<WalkInCheckinResult>(
    `/properties/${propertyId}/guard/checkins`,
    { method: "POST", body: form }
  );
}
