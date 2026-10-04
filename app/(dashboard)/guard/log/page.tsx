"use client";

import { useCallback, useEffect, useState } from "react";
import { useProperty } from "@/lib/property-context";
import { getGuardLogs } from "@/lib/guard";
import { GuestLogEntry, GuestVisitStatus } from "@/lib/types";
import { formatDateTime, formatDuration, VisitDestination, VisitorAvatar } from "../visit-display";

const PAGE_SIZE = 50;

const STATUS_STYLES: Record<GuestVisitStatus, { label: string; className: string }> = {
  checked_in: { label: "On site", className: "bg-sage/15 text-sage" },
  checked_out: { label: "Left", className: "bg-muted text-muted-foreground" },
  pending: { label: "Expected", className: "bg-gold/15 text-gold" },
  expired: { label: "Expired", className: "bg-muted text-muted-foreground" },
  revoked: { label: "Revoked", className: "bg-rust/10 text-rust" },
};

export default function GuardLogPage() {
  const {
    propertyId,
    config,
    loadError: accessError,
    loading: accessLoading,
  } = useProperty();

  const [entries, setEntries] = useState<GuestLogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(id);
  }, [search]);

  const fetchFirstPage = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const data = await getGuardLogs(propertyId, {
        search: debouncedSearch || undefined,
        limit: PAGE_SIZE,
        offset: 0,
      });
      setEntries(data);
      setHasMore(data.length === PAGE_SIZE);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the visitor log");
    } finally {
      setLoading(false);
    }
  }, [propertyId, debouncedSearch]);

  useEffect(() => {
    fetchFirstPage();
  }, [fetchFirstPage]);

  const loadMore = async () => {
    if (!propertyId) return;
    setLoadingMore(true);
    try {
      const data = await getGuardLogs(propertyId, {
        search: debouncedSearch || undefined,
        limit: PAGE_SIZE,
        offset: entries.length,
      });
      setEntries((prev) => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  };

  if (accessLoading) return <div className="min-h-[60vh]" />;

  if (accessError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-sm text-rust">{accessError}</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto">
      <div className="mb-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          History
        </p>
        <h1 className="text-3xl font-display font-medium text-foreground">
          Visitor log
        </h1>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`Search name, phone${config.has_spaces ? `, ${config.space_noun.toLowerCase()}` : ""} or host`}
        aria-label="Search the visitor log"
        className="w-full px-4 py-3 mb-5 rounded-xl border border-border/60 bg-card text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/40"
      />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rust/10 border border-rust/20">
          <p className="text-sm text-rust">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-card border border-border/60 animate-pulse"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border/60 px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            {debouncedSearch
              ? `No visits match "${debouncedSearch}".`
              : "No visits recorded on this property yet."}
          </p>
        </div>
      ) : (
        <>
          <ul className="bg-card rounded-2xl border border-border/60 overflow-hidden divide-y divide-border/60">
            {entries.map((entry) => {
              const status = STATUS_STYLES[entry.status];
              const name = entry.full_name || entry.guest_name || "Unnamed visitor";
              return (
                <li
                  key={entry.invite_id}
                  className="px-5 py-4 flex items-start justify-between gap-4"
                >
                  <VisitorAvatar photoUrl={entry.photo_url} photoKey={entry.invite_id} name={name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate">
                        {name}
                      </p>
                      {entry.visit_type === "walk_in" && (
                        <span className="text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded-full bg-gold/15 text-gold">
                          Walk-in
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      <VisitDestination
                        unitNumber={entry.unit_number}
                        hostName={entry.host_name}
                        purpose={entry.purpose}
                    spaceNoun={config.space_noun}
                      />
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                      <VisitTiming entry={entry} />
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}
                  >
                    {status.label}
                  </span>
                </li>
              );
            })}
          </ul>

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full mt-4 px-4 py-3 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50 transition-colors"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function VisitTiming({ entry }: { entry: GuestLogEntry }) {
  if (!entry.checked_in_at) {
    return <>Created {formatDateTime(entry.created_at)} · never checked in</>;
  }
  if (entry.checked_out_at) {
    return (
      <>
        {formatDateTime(entry.checked_in_at)} · stayed{" "}
        {formatDuration(entry.checked_in_at, entry.checked_out_at)}
      </>
    );
  }
  return <>In at {formatDateTime(entry.checked_in_at)}</>;
}
