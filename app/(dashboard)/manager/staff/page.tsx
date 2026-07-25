"use client";
import { useEffect, useState, useCallback } from "react";
import { createInvite, getPropertyStaff, PropertyStaffMember } from "@/lib/auth";
import { useProperty } from "@/lib/property-context";

const ROLE_LABELS: Record<string, string> = {
  guard: "Guard",
  staff: "Staff",
};

export default function StaffPage() {
  const { propertyId, loadError: accessError, loading: accessLoading } = useProperty();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [inviteStatusIsError, setInviteStatusIsError] = useState(false);
  const [inviting, setInviting] = useState(false);

  const [staff, setStaff] = useState<PropertyStaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    if (!propertyId) return;
    setStaffLoading(true);
    setStaffError(null);
    try {
      const data = await getPropertyStaff(propertyId);
      setStaff(data);
    } catch (err) {
      setStaffError(err instanceof Error ? err.message : "Failed to load staff");
    } finally {
      setStaffLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleInviteGuard = async () => {
    if (!propertyId || !inviteEmail) return;
    setInviting(true);
    setInviteStatus(null);
    try {
      await createInvite(propertyId, inviteEmail, "guard");
      setInviteStatus(`Invite sent to ${inviteEmail}`);
      setInviteStatusIsError(false);
      setInviteEmail("");
    } catch (err) {
      setInviteStatus(err instanceof Error ? err.message : "Failed to send invite");
      setInviteStatusIsError(true);
    } finally {
      setInviting(false);
    }
  };

  if (accessLoading) {
    return <div className="min-h-screen bg-canvas" />;
  }

  if (accessError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-rust">{accessError}</p>
      </div>
    );
  }

  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-8">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Staff</p>
        <h1 className="text-3xl font-display font-medium text-foreground">Guards</h1>
      </div>

      {/* Invite guard card */}
      <section className="mb-10">
        <div className="bg-card rounded-2xl shadow-sm border border-border/60 p-6 max-w-md">
          <h2 className="text-sm font-medium text-foreground mb-1">Invite a guard</h2>
          <p className="text-xs text-muted-foreground mb-4">
            They&apos;ll get a link to set up their account and sign in on their own from then on.
          </p>
          <div className="space-y-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="guard@email.com"
              className="w-full px-3 py-2 rounded-lg border border-border/60 bg-canvas text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sage/40"
            />
            <button
              onClick={handleInviteGuard}
              disabled={inviting || !inviteEmail}
              className="w-full px-4 py-2 rounded-lg bg-sage text-white text-sm font-medium disabled:opacity-50 transition-opacity"
            >
              {inviting ? "Sending..." : "Invite Guard"}
            </button>
          </div>
          {inviteStatus && (
            <p className={`text-sm mt-3 ${inviteStatusIsError ? "text-rust" : "text-muted-foreground"}`}>
              {inviteStatus}
            </p>
          )}
        </div>
      </section>

      {/* Current staff */}
      <section>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Current Staff
        </h2>
        <div className="bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden">
          {staffLoading ? (
            <div className="p-6">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : staffError ? (
            <div className="p-6">
              <p className="text-sm text-rust">{staffError}</p>
            </div>
          ) : staff.length === 0 ? (
            <div className="p-6">
              <p className="text-sm text-muted-foreground">
                No guards on this property yet. Invite one above.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {staff.map((member) => (
                <li
                  key={member.user_id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {member.full_name || member.email}
                    </p>
                    {member.full_name && (
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    )}
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-sage/10 text-sage">
                    {ROLE_LABELS[member.role] || member.role}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}