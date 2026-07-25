"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import {
  OccupancyStatusCountsResponse,
  OccupancyRateResponse,
  OccupancyByUnitTypeResponse,
} from "@/lib/types";
import TeamSection from "@/components/TeamSection";
import StaffSection from "@/components/StaffSection";
import UnitsSection from "@/components/UnitsSection";
import { Skeleton } from "@/components/ui/skeleton";


const STATUS_COLORS: Record<string, string> = {
  vacant: "bg-muted text-muted-foreground",
  occupied: "bg-sage/15 text-sage",
  maintenance: "bg-gold/15 text-gold",
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-display font-medium mt-1 text-foreground">{value}</div>
    </div>
  );
}

function OccupancyRing({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate * circumference);

  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="shrink-0">
      <circle
        cx="44"
        cy="44"
        r={radius}
        fill="none"
        stroke="rgba(241,236,225,0.15)"
        strokeWidth="7"
      />
      <circle
        cx="44"
        cy="44"
        r={radius}
        fill="none"
        stroke="#B8935A"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 44 44)"
        className="transition-all duration-700 ease-out"
      />
      <text
        x="44"
        y="49"
        textAnchor="middle"
        className="fill-canvas font-display text-lg font-medium"
      >
        {pct}%
      </text>
    </svg>
  );
}

function HeroSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
      <div className="bg-ink rounded-2xl p-5 flex items-center justify-between shadow-sm sm:col-span-1">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16 bg-canvas/10" />
          <Skeleton className="h-7 w-14 bg-canvas/10" />
        </div>
        <Skeleton className="h-[88px] w-[88px] rounded-full bg-canvas/10" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-2xl p-4 shadow-sm border border-border/60 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-12" />
        </div>
      ))}
    </div>
  );
}

function PillRowSkeleton() {
  return (
    <div className="flex gap-3 flex-wrap mb-8">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-7 w-24 rounded-full" />
      ))}
    </div>
  );
}

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-card rounded-2xl divide-y divide-border/60 shadow-sm border border-border/60 mb-8">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params.propertyId as string;

  const [rate, setRate] = useState<OccupancyRateResponse | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);

  const [statusCounts, setStatusCounts] = useState<OccupancyStatusCountsResponse | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [byType, setByType] = useState<OccupancyByUnitTypeResponse | null>(null);
  const [byTypeError, setByTypeError] = useState<string | null>(null);

  const loadOccupancy = useCallback(() => {
    apiFetch<OccupancyRateResponse>(`/properties/${propertyId}/occupancy/rate`)
      .then(setRate)
      .catch((err) => setRateError(err instanceof Error ? err.message : "Failed to load occupancy"));

    apiFetch<OccupancyStatusCountsResponse>(`/properties/${propertyId}/occupancy/status-counts`)
      .then(setStatusCounts)
      .catch((err) => setStatusError(err instanceof Error ? err.message : "Failed to load status breakdown"));

    apiFetch<OccupancyByUnitTypeResponse>(`/properties/${propertyId}/occupancy/by-unit-type`)
      .then(setByType)
      .catch((err) => setByTypeError(err instanceof Error ? err.message : "Failed to load unit type breakdown"));
  }, [propertyId]);

  useEffect(() => {
    loadOccupancy();
  }, [loadOccupancy]);

  const vacantCount = statusCounts?.counts.find((c) => c.status === "vacant")?.count ?? 0;

  return (
    <div className="p-8 max-w-5xl mx-auto bg-canvas min-h-screen">
      <Link href="/dashboard" className="text-sm text-gold hover:underline inline-flex items-center gap-1 group">
        <span className="transition-transform duration-150 group-hover:-translate-x-0.5">{"<-"}</span> Back to dashboard
      </Link>

      <h1 className="text-3xl font-display font-medium mt-4 mb-6 text-foreground">Property Overview</h1>

      {rateError ? (
        <p className="text-sm text-rust mb-8">{rateError}</p>
      ) : !rate ? (
        <HeroSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-ink rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 sm:col-span-1">
            <div>
              <div className="text-xs text-canvas/50 uppercase tracking-wide">Occupancy</div>
              <div className="text-2xl font-display font-medium mt-1 text-canvas">
                {rate.occupied_units}/{rate.total_units}
              </div>
            </div>
            <OccupancyRing rate={rate.occupancy_rate} />
          </div>
          <StatCard label="Total Units" value={rate.total_units} />
          <StatCard label="Occupied" value={rate.occupied_units} />
          <StatCard label="Vacant" value={vacantCount} />
        </div>
      )}

      {statusError ? (
        <p className="text-sm text-rust mb-8">{statusError}</p>
      ) : !statusCounts ? (
        <PillRowSkeleton />
      ) : statusCounts.counts.length > 0 ? (
        <section className="mb-8">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            By Status
          </h2>
          <div className="flex gap-3 flex-wrap">
            {statusCounts.counts.map((sc) => (
              <span
                key={sc.status}
                className={`text-sm px-3 py-1.5 rounded-full font-medium capitalize transition-transform duration-150 hover:scale-105 ${
                  STATUS_COLORS[sc.status] ?? "bg-muted text-muted-foreground"
                }`}
              >
                {sc.status}: {sc.count}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {byTypeError ? (
        <p className="text-sm text-rust mb-8">{byTypeError}</p>
      ) : !byType ? (
        <ListSkeleton rows={2} />
      ) : byType.breakdown.length > 0 ? (
        <section className="mb-8">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            By Unit Type
          </h2>
          <div className="bg-card rounded-2xl divide-y divide-border/60 shadow-sm border border-border/60">
            {byType.breakdown.map((item) => (
              <div
                key={item.unit_type}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors duration-150"
              >
                <span className="text-sm font-medium uppercase text-foreground">{item.unit_type}</span>
                <span className="text-sm text-muted-foreground">
                  {item.occupied_units}/{item.total_units} occupied (
                  {(item.occupancy_rate * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <TeamSection propertyId={propertyId} />

      <StaffSection propertyId={propertyId} />

      <UnitsSection propertyId={propertyId} onUnitsChanged={loadOccupancy} />
    </div>
  );
}