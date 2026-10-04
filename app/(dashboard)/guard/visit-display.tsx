"use client";

import { useState } from "react";

/** Shared formatting for the reception views. Colocated with the guard routes -
 *  App Router only treats page/layout/route/loading/error files as routes, so
 *  ordinary modules can live alongside them. */

/** The API returns naive UTC timestamps with no zone suffix. Left as-is, the browser
 *  reads them as local time and every duration is wrong by the UTC offset. */
export function parseApiDate(value: string): Date {
  const hasZone = /[Zz]$|[+-]\d{2}:?\d{2}$/.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}

export function formatTime(value: string): string {
  return parseApiDate(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(value: string): string {
  const d = parseApiDate(value);
  return `${d.toLocaleDateString([], { day: "numeric", month: "short" })}, ${d.toLocaleTimeString(
    [],
    { hour: "2-digit", minute: "2-digit" }
  )}`;
}

/** Human duration from a check-in time to now (or to a check-out time). */
export function formatDuration(from: string, to: number | string): string {
  const start = parseApiDate(from).getTime();
  const end = typeof to === "string" ? parseApiDate(to).getTime() : to;
  const minutes = Math.max(0, Math.floor((end - start) / 60000));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours < 24) return remainder ? `${hours}h ${remainder}m` : `${hours}h`;

  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

/** Where a visitor is headed. An apartment guest has a unit; an office, gym or
 *  hotel-lobby visitor has a host, or nothing at all. */
export function VisitDestination({
  unitNumber,
  hostName,
  purpose,
  spaceNoun = "Unit",
}: {
  unitNumber: string | null;
  hostName: string | null;
  purpose: string | null;
  /** What this business calls its spaces - Unit, Suite, Room. */
  spaceNoun?: string;
}) {
  const parts: string[] = [];
  if (unitNumber) parts.push(`${spaceNoun} ${unitNumber}`);
  if (hostName) parts.push(unitNumber ? `for ${hostName}` : `Visiting ${hostName}`);
  if (purpose) parts.push(purpose);

  if (parts.length === 0) return <span className="italic">No destination recorded</span>;
  return <>{parts.join(" · ")}</>;
}

// Photo links are signed and short-lived, and the backend issues a fresh one on
// every refresh. A fresh link is a different URL, so the browser would download the
// same photo again every 30 seconds. Instead the first link seen for a visit is
// reused until shortly before it expires, and the browser serves it from cache.
const PHOTO_LINK_REUSE_MS = 10 * 60 * 1000; // links last 15 minutes
const photoLinks = new Map<string, { url: string; at: number }>();

function stablePhotoUrl(key: string | undefined, url: string | null): string | null {
  if (!key || !url) return url;
  const seen = photoLinks.get(key);
  if (seen && Date.now() - seen.at < PHOTO_LINK_REUSE_MS) return seen.url;
  photoLinks.set(key, { url, at: Date.now() });
  return url;
}

export function VisitorAvatar({
  photoUrl,
  photoKey,
  name,
  size = "md",
}: {
  photoUrl: string | null;
  /** Identifies the visit, so its photo link can be reused across refreshes. */
  photoKey?: string;
  name: string;
  /** md on the live console, sm in the denser visitor log. */
  size?: "sm" | "md";
}) {
  const [failed, setFailed] = useState(false);
  photoUrl = stablePhotoUrl(photoKey, photoUrl);
  const box = size === "sm" ? "w-10 h-10 rounded-lg text-xs" : "w-14 h-14 rounded-xl text-sm";

  // Photos are short-lived signed links from a private Supabase bucket, which is
  // not configured as a next/image remote pattern - a plain img is correct here.
  // A link that has expired or a photo removed by the retention policy both fall
  // back to initials.
  if (photoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        onError={() => setFailed(true)}
        className={`${box} object-cover bg-secondary shrink-0`}
      />
    );
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      aria-hidden
      className={`${box} bg-secondary text-muted-foreground shrink-0 flex items-center justify-center font-medium`}
    >
      {initials || "?"}
    </div>
  );
}
