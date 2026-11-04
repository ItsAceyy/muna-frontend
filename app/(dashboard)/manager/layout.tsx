"use client";

import { ReactNode, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SubscriptionGate from "@/components/SubscriptionGate";
import { logout } from "@/lib/auth";
import { PropertyProvider, useProperty } from "@/lib/property-context";
import { hasModule } from "@/lib/vertical";

const NAV_ITEMS: { href: string; label: string; module?: string }[] = [
  { href: "/manager", label: "Home" },
  { href: "/manager/maintenance", label: "Maintenance" },
  { href: "/manager/deliveries", label: "Deliveries", module: "packages" },
  { href: "/manager/staff", label: "Staff" },
  { href: "/manager/residences", label: "Residences" },
];

function useNavItems() {
  const { propertyConfig } = useProperty();
  return NAV_ITEMS.filter((item) => !item.module || hasModule(propertyConfig, item.module));
}

/** Below md the sidebar becomes this bar, the same shape as the guard and resident
 *  consoles: who you are at the top, a tab row that scrolls sideways underneath. */
function MobileBar() {
  const pathname = usePathname();
  const { propertyName, loading } = useProperty();
  const navItems = useNavItems();
  const activeTab = useRef<HTMLAnchorElement>(null);

  // The row is wider than a phone, so opening a later page directly would otherwise
  // leave its tab scrolled out of sight.
  useEffect(() => {
    activeTab.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname]);

  return (
    <header className="md:hidden bg-sidebar text-sidebar-foreground sticky top-0 z-20">
      <div className="flex items-center justify-between gap-4 px-4 pt-4 pb-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/40">Muna</p>
          <p className="text-base font-medium truncate">
            {loading ? " " : propertyName ?? "No property"}
          </p>
        </div>
        <button
          onClick={logout}
          className="shrink-0 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors px-2 py-1"
        >
          Sign out
        </button>
      </div>

      <nav aria-label="Manager" className="flex gap-1 px-2 scroll-px-2 overflow-x-auto [scrollbar-width:none]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              ref={isActive ? activeTab : undefined}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "shrink-0 px-4 py-3 text-sm font-medium rounded-t-lg bg-canvas text-foreground"
                  : "shrink-0 px-4 py-3 text-sm font-medium rounded-t-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/70 transition-colors"
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

function Sidebar() {
  const pathname = usePathname();
  const { propertyName } = useProperty();
  const navItems = useNavItems();

  return (
    <aside className="hidden md:flex w-64 shrink-0 bg-sidebar text-sidebar-foreground flex-col h-screen sticky top-0 border-r border-sidebar-border">
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
        {navItems.map((item) => {
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
        <button
          onClick={logout}
          className="block text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors mb-3"
        >
          Sign out
        </button>
        <p className="text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/30">
          Muna by Horus Group
        </p>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="hidden md:flex h-16 border-b border-border bg-card/80 backdrop-blur items-center justify-between px-8 shrink-0 sticky top-0 z-10">
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
      <div className="flex flex-col md:flex-row min-h-screen bg-canvas">
        <MobileBar />
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
