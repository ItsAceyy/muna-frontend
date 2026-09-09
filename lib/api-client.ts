// NEXT_PUBLIC_* is inlined at build time, not read at runtime - so setting it in
// the hosting dashboard after a deploy changes nothing until a rebuild. When it is
// missing the template below produces "undefined/auth/login", which resolves
// against the app's own origin and returns a 404 that points nowhere near the cause.
const API_URL = process.env.NEXT_PUBLIC_API_URL;

function requireApiUrl(): string {
  if (!API_URL) {
    throw new ApiError(
      0,
      "The app is not configured to reach its server. NEXT_PUBLIC_API_URL was " +
        "missing when this build was created - set it and redeploy without the " +
        "build cache."
    );
  }
  return API_URL;
}

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("muna_token");
}

export function setToken(token: string) {
  localStorage.setItem("muna_token", token);
}

export function clearToken() {
  localStorage.removeItem("muna_token");
}


/** FastAPI reports errors in two shapes and the difference is not obvious:
 *  a deliberate HTTPException gives `detail` as a string, while a validation
 *  failure gives an array of objects. Only handling the string case is why a bad
 *  email or a weak password used to surface as "Request failed: 422". */
interface ValidationIssue {
  loc?: (string | number)[];
  msg?: string;
}

function fieldLabel(loc: (string | number)[] | undefined): string | null {
  if (!loc || loc.length === 0) return null;
  // loc looks like ["body", "email"] - the last entry is the field.
  const field = String(loc[loc.length - 1]);
  if (field === "body") return null;
  const labels: Record<string, string> = {
    email: "Email",
    password: "Password",
    new_password: "Password",
    full_name: "Full name",
    phone_number: "Phone number",
  };
  return labels[field] ?? field.replace(/_/g, " ");
}

function readDetail(detail: unknown): string | null {
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const messages = (detail as ValidationIssue[])
      .map((issue) => {
        // Pydantic prefixes its own validators with "Value error, " - noise to a reader.
        let raw = (issue.msg ?? "").replace(/^Value error,\s*/i, "");
        if (!raw) return null;
        // Its email message explains the RFC to someone who just mistyped an address.
        if (/valid email address/i.test(raw)) raw = "Enter a valid email address";
        const label = fieldLabel(issue.loc);
        // Don't prefix when the message already names the field.
        if (!label || raw.toLowerCase().startsWith(label.toLowerCase())) {
          return raw.charAt(0).toUpperCase() + raw.slice(1);
        }
        return `${label}: ${raw}`;
      })
      .filter((m): m is string => Boolean(m));

    if (messages.length) return messages.join(". ");
  }

  if (detail && typeof detail === "object") {
    const asObject = detail as { message?: unknown };
    if (typeof asObject.message === "string") return asObject.message;
  }

  return null;
}

/** Used when the response carries no usable body. These are the cases a person can
 *  act on, said in plain words rather than as a status code. */
function fallbackMessage(status: number): string {
  switch (status) {
    case 404:
      return "Could not reach the server. It may be starting up - try again in a moment.";
    case 409:
      return "That conflicts with something that already exists.";
    case 429:
      return "Too many attempts. Wait a few minutes and try again.";
    case 500:
    case 502:
    case 503:
      return "The server had a problem. Try again shortly.";
    default:
      return `Something went wrong (error ${status}).`;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${requireApiUrl()}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Session expired");
  }

  if (!res.ok) {
    let message = fallbackMessage(res.status);
    let detail: unknown;
    try {
      const body = await res.json();
      detail = body.detail;
      const parsed = readDetail(detail);
      if (parsed) message = parsed;
    } catch {
      // No JSON body - keep the status-based fallback.
    }
    throw new ApiError(res.status, message, detail);
  }

  // Handle empty responses (204 etc.)
  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}