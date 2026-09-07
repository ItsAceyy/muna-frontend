import { apiFetch } from "./api-client";
import { ApprovalStatus, ClientSummary, PlatformOverview } from "./types";

export async function getPlatformOverview(): Promise<PlatformOverview> {
  return apiFetch<PlatformOverview>("/admin/overview");
}

export async function getClients(status?: ApprovalStatus): Promise<ClientSummary[]> {
  const qs = status ? `?status=${status}` : "";
  return apiFetch<ClientSummary[]>(`/admin/clients${qs}`);
}

export async function verifyClient(organizationId: string): Promise<void> {
  await apiFetch(`/organizations/${organizationId}/approve`, { method: "POST" });
}

export async function rejectClient(organizationId: string): Promise<void> {
  await apiFetch(`/organizations/${organizationId}/reject`, { method: "POST" });
}
