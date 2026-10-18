"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SubscriptionGate from "@/components/SubscriptionGate";
import { PropertyProvider, useProperty } from "@/lib/property-context";

const NAV_ITEMS = [
  { href: "/manager", label: "Home" },
  { href: "/manager/maintenance", label: "Maintenance" },
  { href: "/manager/staff", label: "Staff" },
  { href: "/manager/residences", label: "Residences" },
];

function Sidebar() {
  const pathname = usePathname();
  const { propertyName } = useProperty();

  return (
    <aside className="w-64 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0 border-r border-sidebar-border">
      <div className="px-5 pt-7 pb-5">
        <p className="text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/40 mb-3">
          Muna
        </p>
        <div className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-sidebar-accent border border-sidebar-border">
          <span className="text-sm font-medium truncate">
            {propertyName ? propertyName : "Select Property"}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const linkClass = isActive
            ? "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium border-l-2 bg-sidebar-accent border-sidebar-primary text-sidebar-primary"
            : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium border-l-2 border-transparent text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/70 transition-colors";

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={linkClass}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-5 border-t border-sidebar-border">
        <p className="text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/30">
          Muna by Horus Group
        </p>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur flex items-center justify-between px-8 shrink-0 sticky top-0 z-10">
      <input
        type="search"
        placeholder="Search"
        aria-label="Search"
        className="w-80 px-3.5 py-2 rounded-lg border border-border bg-canvas text-sm text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-ring/35 focus:border-border-strong transition-shadow"
      />
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-full bg-ink text-primary-foreground text-xs font-medium flex items-center justify-center">
          MG
        </div>
      </div>
    </header>
  );
}

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <PropertyProvider>
      <div className="flex min-h-screen bg-canvas">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <TopBar />
          <main className="flex-1 min-w-0">
            <SubscriptionGate>{children}</SubscriptionGate>
          </main>
        </div>
      </div>
    </PropertyProvider>
  );
}
