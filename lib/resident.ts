import { apiFetch } from "./api-client";
import {
  GuestInviteRecord,
  MyVisitorHistoryItem,
  Package,
  Unit,
  WorkOrder,
  WorkOrderPriority,
} from "./types";

export async function getMyUnits(): Promise<Unit[]> {
  return apiFetch<Unit[]>("/me/units");
}

export async function getMyTickets(): Promise<WorkOrder[]> {
  return apiFetch<WorkOrder[]>("/me/tickets");
}

export async function getMyGuestInvites(): Promise<GuestInviteRecord[]> {
  return apiFetch<GuestInviteRecord[]>("/me/guest-invites");
}

export async function getMyVisitorHistory(): Promise<MyVisitorHistoryItem[]> {
  return apiFetch<MyVisitorHistoryItem[]>("/me/visitor-history");
}

export async function getMyPackages(): Promise<Package[]> {
  return apiFetch<Package[]>("/me/packages");
}

export async function raiseTicket(
  unitId: string,
  title: string,
  description: string,
  priority: WorkOrderPriority
): Promise<WorkOrder> {
  return apiFetch<WorkOrder>(`/work-orders/units/${unitId}`, {
    method: "POST",
    body: JSON.stringify({ title, description: description || undefined, priority }),
  });
}

export async function inviteGuest(
  unitId: string,
  guestName: string,
  guestPhone?: string,
  guestEmail?: string
): Promise<GuestInviteRecord> {
  return apiFetch<GuestInviteRecord>(`/units/${unitId}/guest-invites`, {
    method: "POST",
    body: JSON.stringify({
      guest_name: guestName || undefined,
      guest_phone: guestPhone || undefined,
      guest_email: guestEmail || undefined,
    }),
  });
}

/** The check-in link a resident sends their guest. The guest opens it, fills in
 *  their details and photo, and arrives already registered. */
export function guestCheckinUrl(token: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/checkin/${token}`;
}
