"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    <aside className="w-64 shrink-0 bg-[#1e1e1e] text-white flex flex-col h-screen sticky top-0">
      <div className="px-5 pt-6 pb-4">
        <p className="text-[11px] uppercase tracking-wider text-white/40 mb-3">Muna</p>
        <div className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 border border-white/10">
          <span className="text-sm font-medium text-white truncate">
            {propertyName ? propertyName : "Select Property"}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const linkClass = isActive
            ? "flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-lg text-sm font-medium border-l-2 bg-white/10 border-amber-400 text-amber-400"
            : "flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-lg text-sm font-medium border-l-2 border-transparent text-white/60 hover:text-white hover:bg-white/5";

          return (
            <Link key={item.href} href={item.href} className={linkClass}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-[10px] uppercase tracking-wider text-white/30">
          Muna by Horus Group
        </p>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="h-16 border-b border-black/[0.06] bg-white flex items-center justify-between px-8 shrink-0">
      <input
        type="text"
        placeholder="Search"
        className="w-80 px-3 py-2 rounded-lg border border-black/10 bg-black/[0.02] text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40"
      />
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-full bg-[#1e1e1e] text-white text-xs font-medium flex items-center justify-center">
          MG
        </div>
      </div>
    </header>
  );
}

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <PropertyProvider>
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <TopBar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </PropertyProvider>
  );
}