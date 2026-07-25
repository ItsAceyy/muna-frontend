"use client";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";
import { Organization } from "@/lib/types";
import NewOrgModal from "@/components/NewOrgModal";
import NewPropertyModal from "@/components/NewPropertyModal";
import { Skeleton } from "@/components/ui/skeleton";

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: "bg-sage/15 text-sage",
    pending_approval: "bg-gold/15 text-gold",
    rejected: "bg-rust/15 text-rust",
  };
  const label = status.replace("_", " ");
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
        styles[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {label}
    </span>
  );
}

function RolePill({ role }: { role: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize bg-gold/15 text-gold">
      {role}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-canvas">
      <aside className="w-72 bg-ink p-4 overflow-y-auto flex flex-col">
        <div className="px-2 py-3 mb-4">
          <h1 className="font-display text-xl tracking-wide text-sidebar-foreground">Muna</h1>
          <p className="text-xs text-sidebar-foreground/50 mt-0.5">BQ Property Platform</p>
        </div>
        <div className="flex items-center justify-between mb-3 px-1">
          <Skeleton className="h-3 w-24 bg-sidebar-foreground/10" />
        </div>
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full bg-sidebar-accent/40" />
          ))}
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-16 rounded-md" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-4 shadow-sm border border-border/60 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </section>

        <section>
          <Skeleton className="h-3 w-28 mb-3" />
          <div className="bg-card rounded-2xl divide-y divide-border/60 shadow-sm border border-border/60">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewOrg, setShowNewOrg] = useState(false);
  const [showNewProperty, setShowNewProperty] = useState(false);

  const load = useCallback(async (preserveSelection = false) => {
    try {
      const data = await apiFetch<Organization[]>("/me/organizations");
      setOrgs(data);
      if (!preserveSelection && data.length > 0) {
        setSelectedOrgId(data[0].id);
      } else if (preserveSelection && data.length > 0 && !data.find((o) => o.id === selectedOrgId)) {
        setSelectedOrgId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, [selectedOrgId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedOrg = orgs.find((o) => o.id === selectedOrgId) ?? null;

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <div className="p-8 text-sm text-rust bg-canvas min-h-screen">{error}</div>;
  }

  if (orgs.length === 0) {
    return (
      <div className="p-8 bg-canvas min-h-screen">
        <h1 className="text-xl font-display font-medium mb-2">No organizations yet</h1>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have any organizations or properties set up yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-canvas">
      {/* Sidebar */}
      <aside className="w-72 bg-ink text-sidebar-foreground p-4 overflow-y-auto flex flex-col">
        <div className="px-2 py-3 mb-4">
          <h1 className="font-display text-xl tracking-wide">Muna</h1>
          <p className="text-xs text-sidebar-foreground/50 mt-0.5">BQ Property Platform</p>
        </div>

        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wide">
            Organizations
          </h2>
          <button
            onClick={() => setShowNewOrg(true)}
            className="text-xs font-medium text-ink bg-gold hover:brightness-110 hover:scale-[1.03] active:scale-[0.97] px-2.5 py-1 rounded-md transition-all duration-150"
          >
            + New
          </button>
        </div>
        <div className="space-y-1">
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => setSelectedOrgId(org.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 border-l-2 ${
                org.id === selectedOrgId
                  ? "bg-sidebar-accent text-gold border-gold translate-x-0.5"
                  : "hover:bg-sidebar-accent/60 hover:translate-x-0.5 text-sidebar-foreground/80 border-transparent"
              }`}
            >
              <div className="font-medium truncate">{org.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs capitalize text-sidebar-foreground/40">
                  {org.org_type}
                </span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main panel */}
      <main className="flex-1 p-8 overflow-y-auto">
        {selectedOrg && (
          <>
            <div className="flex items-center gap-3 mb-8">
              <h1 className="text-3xl font-display font-medium text-foreground">{selectedOrg.name}</h1>
              <StatusPill status={selectedOrg.approval_status} />
              <span className="text-sm text-muted-foreground capitalize">
                {selectedOrg.org_type}
              </span>
            </div>

            <section className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Properties ({selectedOrg.properties.length})
                </h2>
                <button
                  onClick={() => setShowNewProperty(true)}
                  className="text-sm font-medium text-ink bg-gold hover:brightness-110 hover:scale-[1.03] active:scale-[0.97] px-3 py-1.5 rounded-md transition-all duration-150"
                >
                  + New
                </button>
              </div>
              {selectedOrg.properties.length === 0 ? (
                <p className="text-sm text-muted-foreground">No properties yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedOrg.properties.map((prop) => (
                    <Link
                      key={prop.id}
                      href={`/dashboard/properties/${prop.id}`}
                      className="block bg-card rounded-2xl p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-gold/40 transition-all duration-200 ease-out border border-border/60"
                    >
                      <div className="font-medium text-foreground">{prop.name}</div>
                      <div className="text-sm text-muted-foreground capitalize mt-1">
                        {prop.property_type.replace("_", " ")}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Members ({selectedOrg.members.length})
              </h2>
              {selectedOrg.members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members yet.</p>
              ) : (
                <div className="bg-card rounded-2xl divide-y divide-border/60 shadow-sm border border-border/60">
                  {selectedOrg.members.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors duration-150"
                    >
                      <div>
                        <div className="font-medium text-sm text-foreground">{member.full_name}</div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>
                      <RolePill role={member.role} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {showNewOrg && (
        <NewOrgModal
          onClose={() => setShowNewOrg(false)}
          onCreated={() => load(false)}
        />
      )}

      {showNewProperty && selectedOrg && (
        <NewPropertyModal
          organizationId={selectedOrg.id}
          onClose={() => setShowNewProperty(false)}
          onCreated={() => load(true)}
        />
      )}
    </div>
  );
}