"use client";

import { ReactNode, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { hasToken } from "@/lib/api-client";

// Re-check on "storage" for a sign-out in another tab, and on "pageshow" because the
// back button can restore a signed-out page from memory without running it again.
function subscribeToSession(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("pageshow", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("pageshow", onChange);
  };
}

/** The token lives in localStorage, so only the browser can tell whether someone is
 *  signed in. Nothing renders until it has, otherwise the pages call the API without
 *  a token and show its "Not authenticated" reply. */
export default function RequireSession({ children }: { children: ReactNode }) {
  const router = useRouter();
  const signedIn = useSyncExternalStore(subscribeToSession, hasToken, () => null);

  useEffect(() => {
    if (signedIn === false) router.replace("/login");
  }, [signedIn, router]);

  if (!signedIn) return <div className="min-h-screen bg-canvas" />;
  return children;
}
