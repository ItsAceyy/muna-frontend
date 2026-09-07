"use client";

import { ReactNode } from "react";

/** Shared pieces for the resident portal. Colocated with the routes — the App Router
 *  only treats page/layout/route/loading/error files as routes. */

export function parseApiDate(value: string): Date {
  const hasZone = /[Zz]$|[+-]\d{2}:?\d{2}$/.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}

export function formatDate(value: string): string {
  return parseApiDate(value).toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string): string {
  const d = parseApiDate(value);
  return `${d.toLocaleDateString([], { day: "numeric", month: "short" })}, ${d.toLocaleTimeString(
    [],
    { hour: "2-digit", minute: "2-digit" }
  )}`;
}

export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-display font-medium text-foreground">{title}</h1>
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-card rounded-2xl border border-border/60 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <Card className="px-6 py-14 text-center">
      <p className="text-sm text-muted-foreground">{children}</p>
    </Card>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 px-4 py-3 rounded-xl bg-rust/10 border border-rust/20">
      <p className="text-sm text-rust">{children}</p>
    </div>
  );
}

export function Skeletons({ count = 3, height = "h-20" }: { count?: number; height?: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`${height} rounded-2xl bg-card border border-border/60 animate-pulse`}
        />
      ))}
    </div>
  );
}

const BADGE_BASE =
  "shrink-0 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap";

export function Badge({ tone, children }: { tone: "sage" | "gold" | "rust" | "muted"; children: ReactNode }) {
  const tones = {
    sage: "bg-sage/15 text-sage",
    gold: "bg-gold/15 text-gold",
    rust: "bg-rust/10 text-rust",
    muted: "bg-muted text-muted-foreground",
  };
  return <span className={`${BADGE_BASE} ${tones[tone]}`}>{children}</span>;
}

export const inputClass =
  "w-full px-4 py-3 rounded-xl border border-border/60 bg-card text-base text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-ring/35 focus:border-border-strong transition-shadow";

export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm text-foreground mb-1.5 block">
        {label}
        {required && <span className="text-rust ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="px-5 py-3 rounded-xl bg-ink text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
    >
      {children}
    </button>
  );
}
