"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useProperty } from "@/lib/property-context";
import { checkoutGuest, getGuardOccupancy } from "@/lib/guard";
import { GuestOccupancyEntry } from "@/lib/types";
import { formatDuration, formatTime, VisitDestination, VisitorAvatar } from "./visit-display";

const REFRESH_MS = 30_000;

export default function GuardOccupancyPage() {
  const {
    propertyId,
    config,
    loadError: accessError,
    loading: accessLoading,
  } = useProperty();

  const [entries, setEntries] = useState<GuestOccupancyEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Debounce the search so typing does not fire a request per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(id);
  }, [search]);

  const fetchOccupancy = useCallback(
    async (opts: { quiet?: boolean } = {}) => {
      if (!propertyId) return;
      if (!opts.quiet) setLoading(true);
      try {
        const data = await getGuardOccupancy(propertyId, debouncedSearch || undefined);
        setEntries(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load who is on site");
      } finally {
        setLoading(false);
      }
    },
    [propertyId, debouncedSearch]
  );

  useEffect(() => {
    fetchOccupancy();
  }, [fetchOccupancy]);

  // Keep the desk view current without the guard having to reload, and tick the
  // clock so the "on site for" durations stay honest between refreshes.
  useEffect(() => {
    const refresh = setInterval(() => fetchOccupancy({ quiet: true }), REFRESH_MS);
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      clearInterval(refresh);
      clearInterval(tick);
    };
  }, [fetchOccupancy]);

  const handleCheckout = async (entry: GuestOccupancyEntry) => {
    if (!propertyId) return;
    setCheckingOut(entry.invite_id);
    // Optimistically drop the row - the desk queue moves fast and a spinner on a
    // list that is about to lose the row reads as a hang.
    const previous = entries;
    setEntries((rows) => rows.filter((r) => r.invite_id !== entry.invite_id));
    try {
      await checkoutGuest(propertyId, entry.invite_id);
      setError(null);
    } catch (err) {
      setEntries(previous);
      setError(
        err instanceof Error
          ? `Could not check out ${entry.full_name}: ${err.message}`
          : "Checkout failed"
      );
    } finally {
      setCheckingOut(null);
    }
  };

  if (accessLoading) {
    return <div className="min-h-[60vh]" />;
  }

  if (accessError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-sm text-rust">{accessError}</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto">
      <div className="flex items-baseline justify-between gap-4 mb-5">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Currently on site
          </p>
          <h1 className="text-3xl font-display font-medium text-foreground">
            {loading && entries.length === 0 ? " " : entries.length}
            <span className="text-base font-sans font-normal text-muted-foreground ml-2">
              {entries.length === 1
                ? config.visitor_noun.toLowerCase()
                : `${config.visitor_noun.toLowerCase()}s`}
            </span>
          </h1>
        </div>
        <Link
          href="/guard/checkin"
          className="shrink-0 px-5 py-3 rounded-xl bg-sage text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Check someone in
        </Link>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`Search name, phone${config.has_spaces ? `, ${config.space_noun.toLowerCase()}` : ""} or host`}
        aria-label={`Search ${config.visitor_noun.toLowerCase()}s on site`}
        className="w-full px-4 py-3 mb-5 rounded-xl border border-border/60 bg-card text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/40"
      />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rust/10 border border-rust/20">
          <p className="text-sm text-rust">{error}</p>
        </div>
      )}

      {loading && entries.length === 0 ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-card border border-border/60 animate-pulse"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border/60 px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            {debouncedSearch
              ? `Nobody on site matches "${debouncedSearch}".`
              : "Nobody is checked in right now."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.invite_id}
              className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 flex items-center gap-4"
            >
              <VisitorAvatar
                photoUrl={entry.photo_url}
                photoKey={entry.invite_id}
                name={entry.full_name}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-base font-medium text-foreground truncate">
                    {entry.full_name}
                  </p>
                  {entry.visit_type === "walk_in" && (
                    <span className="text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded-full bg-gold/15 text-gold">
                      Walk-in
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  <VisitDestination
                    unitNumber={entry.unit_number}
                    hostName={entry.host_name}
                    purpose={entry.purpose}
                    spaceNoun={config.space_noun}
                  />
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                  In at {formatTime(entry.checked_in_at)} ·{" "}
                  {formatDuration(entry.checked_in_at, now)} on site
                  {entry.phone ? ` · ${entry.phone}` : ""}
                </p>
              </div>

              <button
                onClick={() => handleCheckout(entry)}
                disabled={checkingOut === entry.invite_id}
                className="shrink-0 px-4 py-3 rounded-xl border border-border bg-canvas text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50 transition-colors"
              >
                Check out
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
