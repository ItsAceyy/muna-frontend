import { apiFetch, setToken, clearToken } from "./api-client";
import { InviteDetails, InviteAcceptRequest, MyAccessItem } from "./types";

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface SignupPayload {
  email: string;
  password: string;
  full_name?: string;
}

interface OrgCreatePayload {
  mode: "individual" | "organization";
  name?: string;
}

export interface PropertyStaffMember {
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

export async function login(email: string, password: string): Promise<void> {
  const data = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password } satisfies LoginPayload),
  });
  setToken(data.access_token);
}

export async function signup(
  email: string,
  password: string,
  fullName: string,
  orgMode: "individual" | "organization",
  orgName?: string
): Promise<void> {
  await apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      full_name: fullName,
    } satisfies SignupPayload),
  });

  await login(email, password);

  await apiFetch("/me/organizations", {
    method: "POST",
    body: JSON.stringify({
      mode: orgMode,
      name: orgMode === "organization" ? orgName : undefined,
    } satisfies OrgCreatePayload),
  });
}

export function logout(): void {
  clearToken();
  window.location.href = "/login";
}

export async function getInviteDetails(token: string): Promise<InviteDetails> {
  return apiFetch<InviteDetails>(`/invites/${token}`);
}

export async function acceptInvite(
  token: string,
  fullName: string,
  password: string,
  email: string
): Promise<void> {
  await apiFetch(`/invites/${token}/accept`, {
    method: "POST",
    body: JSON.stringify({
      full_name: fullName,
      password,
    } satisfies InviteAcceptRequest),
  });

  await login(email, password);
}

export async function getMyAccess(): Promise<MyAccessItem[]> {
  return apiFetch<MyAccessItem[]>("/me/access");
}

export function decideRedirectPath(access: MyAccessItem[]): string {
  if (access.some((a) => a.role === "owner")) return "/dashboard";
  if (access.some((a) => a.role === "manager")) return "/manager";
  if (access.some((a) => a.role === "staff")) return "/manager";
  if (access.some((a) => a.role === "guard")) return "/guard";
  if (access.some((a) => a.role === "tenant")) return "/resident";
  return "/no-access";
}

export async function createInvite(
  propertyId: string,
  email: string,
  role: "manager" | "guard" | "tenant",
  unitId?: string,
  phoneNumber?: string
): Promise<InviteDetails> {
  const path = unitId
    ? `/properties/${propertyId}/units/${unitId}/invites`
    : `/properties/${propertyId}/invites`;
  return apiFetch<InviteDetails>(path, {
    method: "POST",
    body: JSON.stringify({ email, role, phone_number: phoneNumber }),
  });
}

export async function getPropertyStaff(propertyId: string): Promise<PropertyStaffMember[]> {
  return apiFetch<PropertyStaffMember[]>(`/properties/${propertyId}/staff`);
}