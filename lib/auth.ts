import { ApiError, apiFetch, setToken, clearToken } from "./api-client";
import { CurrentUser, InviteDetails, InviteAcceptRequest, MyAccessItem } from "./types";

interface LoginResponse {
  access_token?: string;
  token_type?: string;
  trusted_device_token?: string;
  /** Set instead of a session when the account uses two-factor sign-in. */
  two_factor_required?: boolean;
  challenge?: string;
}

/** What signing in produced: a session, or a request for the two-factor code. */
export type LoginResult = { twoFactor: false } | { twoFactor: true; challenge: string };

// Trusted-device tokens, one per account, so a device that passed two-factor
// skips the code for 30 days. Not a session: on its own it signs nobody in.
const TRUSTED_DEVICES_KEY = "muna_trusted_devices";

function trustedDevices(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(TRUSTED_DEVICES_KEY) || "{}");
  } catch {
    return {};
  }
}

function rememberTrustedDevice(email: string, token: string | undefined) {
  if (!token) return;
  try {
    const all = trustedDevices();
    all[email.trim().toLowerCase()] = token;
    localStorage.setItem(TRUSTED_DEVICES_KEY, JSON.stringify(all));
  } catch {
    // Without storage the code is simply asked for each time.
  }
}

interface LoginPayload {
  email: string;
  password: string;
  /** "Keep me signed in": a month instead of a 12-hour shift. */
  remember_me?: boolean;
  trusted_device_token?: string;
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

export async function login(email: string, password: string, rememberMe = false): Promise<LoginResult> {
  const data = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      remember_me: rememberMe,
      trusted_device_token: trustedDevices()[email.trim().toLowerCase()],
    } satisfies LoginPayload),
  });
  if (data.two_factor_required && data.challenge) {
    return { twoFactor: true, challenge: data.challenge };
  }
  setToken(data.access_token!);
  return { twoFactor: false };
}

/** The second step of signing in: the code from the authenticator app. */
export async function verifyTwoFactor(
  email: string,
  challenge: string,
  code: string,
  trustDevice: boolean
): Promise<void> {
  const data = await apiFetch<LoginResponse>("/auth/2fa/verify", {
    method: "POST",
    body: JSON.stringify({ challenge, code, trust_device: trustDevice }),
  });
  setToken(data.access_token!);
  rememberTrustedDevice(email, data.trusted_device_token);
}

export interface TwoFactorSetup {
  secret: string;
  otpauth_uri: string;
}

/** Start two-factor setup: a secret for the authenticator app. */
export async function startTwoFactorSetup(): Promise<TwoFactorSetup> {
  return apiFetch<TwoFactorSetup>("/auth/2fa/setup", { method: "POST" });
}

/** Confirm setup with the first code. Swaps in a two-factor session and trusts
 *  this device, so the admin page works straight away. */
export async function enableTwoFactor(email: string, code: string): Promise<void> {
  const data = await apiFetch<LoginResponse>("/auth/2fa/enable", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  setToken(data.access_token!);
  rememberTrustedDevice(email, data.trusted_device_token);
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

/** For someone who already has a Muna account: sign in, then add the invite's
 *  access to that account. The backend checks it is the account the invite was
 *  sent to. */
export async function acceptInviteWithExistingAccount(
  token: string,
  email: string,
  password: string
): Promise<void> {
  const result = await login(email, password);
  if (result.twoFactor) {
    throw new ApiError(
      401,
      "Your account uses two-factor sign-in. Sign in on the login page first, then open this invite link again."
    );
  }
  await apiFetch(`/invites/${token}/accept-existing`, { method: "POST" });
}

export async function getMyAccess(): Promise<MyAccessItem[]> {
  return apiFetch<MyAccessItem[]>("/me/access");
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/auth/me");
}

export function decideRedirectPath(
  access: MyAccessItem[],
  isPlatformAdmin = false
): string {
  // A super admin runs the platform rather than a property, so they land on the
  // client roster. They can still reach their own dashboard from there.
  if (isPlatformAdmin) return "/admin";
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