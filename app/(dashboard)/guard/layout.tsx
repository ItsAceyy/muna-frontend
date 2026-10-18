"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SubscriptionGate from "@/components/SubscriptionGate";
import { PropertyProvider, useProperty } from "@/lib/property-context";
import { logout } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/guard", label: "On site" },
  { href: "/guard/checkin", label: "Check in" },
  { href: "/guard/log", label: "Log" },
];

// A guard is scoped to exactly one property and never holds manager access to it,
// so the shared provider has to be told which role to resolve the property from.
const GUARD_ROLES = ["guard"];

function DeskClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Set on the client only: rendering a time during SSR would mismatch on hydration.
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return <span className="text-sm text-white/40 tabular-nums">--:--</span>;

  return (
    <span className="text-sm text-white/70 tabular-nums">
      {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

function GuardBar() {
  const pathname = usePathname();
  const { propertyName, loading } = useProperty();

  return (
    <header className="bg-ink text-white sticky top-0 z-20">
      <div className="flex items-center justify-between px-6 pt-4 pb-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-white/40">
            Muna · Reception
          </p>
          <p className="text-base font-medium truncate">
            {loading ? " " : propertyName ?? "No property"}
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <DeskClock />
          <button
            onClick={logout}
            className="text-xs text-white/50 hover:text-white transition-colors px-2 py-1"
          >
            Sign out
          </button>
        </div>
      </div>

      <nav className="flex gap-1 px-4 pb-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "px-5 py-3 text-sm font-medium rounded-t-lg bg-canvas text-ink"
                  : "px-5 py-3 text-sm font-medium rounded-t-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

export default function GuardLayout({ children }: { children: ReactNode }) {
  return (
    <PropertyProvider roles={GUARD_ROLES}>
      <div className="min-h-screen bg-canvas flex flex-col">
        <GuardBar />
        <main className="flex-1 min-w-0">
            <SubscriptionGate>{children}</SubscriptionGate>
          </main>
      </div>
    </PropertyProvider>
  );
}
