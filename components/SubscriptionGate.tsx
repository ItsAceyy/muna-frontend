"use client";

import { ReactNode, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useProperty } from "@/lib/property-context";
import { PropertySubscription } from "@/lib/types";

function formatDay(iso: string | null): string {
  if (!iso) return "";
  // UTC, matching how billing dates are stored: see ClientBilling.
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", timeZone: "UTC" });
}

/** Shows the current property's subscription state around a page.
 *
 *  Locked: the page is replaced by a plain explanation - the backend refuses every
 *  request for a locked property anyway, so there is nothing useful to render.
 *  Ending soon or in grace: owners and managers get a quiet banner above the page.
 *  Everyone else sees nothing until it actually locks. */
export default function SubscriptionGate({ children }: { children: ReactNode }) {
  const { propertyId } = useProperty();
  const [subs, setSubs] = useState<PropertySubscription[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<PropertySubscription[]>("/me/subscriptions")
      .then((data) => {
        if (!cancelled) setSubs(data);
      })
      .catch(() => {
        // Never block a page on this: the backend enforces the lock regardless.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sub = subs?.find((s) => s.property_id === propertyId);

  if (sub?.status === "locked") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-3">
            {sub.property_name}
          </p>
          <h1 className="font-display text-2xl font-medium text-foreground mb-3">
            This property&apos;s subscription has ended
          </h1>
          <p className="text-sm text-muted-foreground">
            {sub.can_renew
              ? "Muna is paused here until the subscription is renewed. Contact Muna to renew, and access returns as soon as payment is recorded. Nothing has been deleted."
              : sub.role === "manager"
                ? "Muna is paused here until the subscription is renewed. The property owner can renew it, and everything returns as it was."
                : "Muna is paused here until the property renews its subscription. Please let your property manager know."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {sub?.warn && (
        <div role="status" className="border-b border-border bg-card px-8 py-2.5 text-sm text-foreground">
          {sub.status === "grace" ? (
            <>
              Payment for {sub.property_name} is overdue. Access stops on{" "}
              <span className="font-medium">{formatDay(sub.locks_at)}</span>
              {sub.can_renew ? " unless it's renewed." : "."}
            </>
          ) : (
            <>
              {sub.status === "trial" ? "The free trial" : "The paid period"} for {sub.property_name} ends on{" "}
              <span className="font-medium">{formatDay(sub.ends_at)}</span>.
              {sub.can_renew ? " Contact Muna to continue without interruption." : ""}
            </>
          )}
        </div>
      )}
      {children}
    </>
  );
}
