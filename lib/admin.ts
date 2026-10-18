import { apiFetch } from "./api-client";
import { AdminClientBilling, ApprovalStatus, ClientSummary, PlatformOverview } from "./types";

export async function getPlatformOverview(): Promise<PlatformOverview> {
  return apiFetch<PlatformOverview>("/admin/overview");
}

export async function getClients(status?: ApprovalStatus): Promise<ClientSummary[]> {
  const qs = status ? `?status=${status}` : "";
  return apiFetch<ClientSummary[]>(`/admin/clients${qs}`);
}

/** Approve a client and start their free trial (1-3 months). */
export async function verifyClient(organizationId: string, trialMonths = 1): Promise<void> {
  await apiFetch(`/organizations/${organizationId}/approve?trial_months=${trialMonths}`, { method: "POST" });
}

export async function rejectClient(organizationId: string): Promise<void> {
  await apiFetch(`/organizations/${organizationId}/reject`, { method: "POST" });
}

export async function getBilling(): Promise<AdminClientBilling[]> {
  return apiFetch<AdminClientBilling[]>("/admin/billing");
}

/** Restart a client's free trial: 1-3 months from today. */
export async function setTrial(organizationId: string, months: number): Promise<AdminClientBilling> {
  return apiFetch<AdminClientBilling>(`/admin/billing/organizations/${organizationId}/trial`, {
    method: "POST",
    body: JSON.stringify({ months }),
  });
}

/** Record a payment: open through the end of this date (YYYY-MM-DD), or null to clear. */
export async function setPaidUntil(propertyId: string, paidUntil: string | null): Promise<AdminClientBilling> {
  return apiFetch<AdminClientBilling>(`/admin/billing/properties/${propertyId}/paid-until`, {
    method: "POST",
    body: JSON.stringify({ paid_until: paidUntil }),
  });
}
