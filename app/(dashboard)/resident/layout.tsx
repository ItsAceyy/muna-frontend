"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropertyProvider, useProperty } from "@/lib/property-context";
import { logout } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/resident", label: "Home" },
  { href: "/resident/maintenance", label: "Maintenance" },
  { href: "/resident/visitors", label: "Visitors" },
  { href: "/resident/deliveries", label: "Deliveries" },
];

// A resident holds tenant access, scoped to their own unit.
const RESIDENT_ROLES = ["tenant"];

function ResidentBar() {
  const pathname = usePathname();
  const { propertyName, config, loading } = useProperty();

  return (
    <header className="bg-ink text-white sticky top-0 z-20">
      <div className="flex items-center justify-between gap-4 px-6 pt-4 pb-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">
            Muna{loading ? "" : ` · ${config.occupant_noun}`}
          </p>
          <p className="text-base font-medium truncate">
            {loading ? " " : propertyName ?? "No property"}
          </p>
        </div>
        <button
          onClick={logout}
          className="shrink-0 text-xs text-white/50 hover:text-white transition-colors px-2 py-1"
        >
          Sign out
        </button>
      </div>

      <nav className="flex gap-1 px-4 pb-1 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "px-5 py-3 text-sm font-medium rounded-t-lg bg-canvas text-ink whitespace-nowrap"
                  : "px-5 py-3 text-sm font-medium rounded-t-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
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

export default function ResidentLayout({ children }: { children: ReactNode }) {
  return (
    <PropertyProvider roles={RESIDENT_ROLES}>
      <div className="min-h-screen bg-canvas flex flex-col">
        <ResidentBar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </PropertyProvider>
  );
}
