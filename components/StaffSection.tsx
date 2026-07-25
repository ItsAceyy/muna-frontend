"use client";

import { useState } from "react";
import InviteModal from "./InviteModal";

interface StaffSectionProps {
  propertyId: string;
}

export default function StaffSection({ propertyId }: StaffSectionProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Staff
        </h2>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-gold text-ink text-sm font-medium px-4 py-2 rounded-md hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
        >
          + Invite Guard
        </button>
      </div>

      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/60">
        <p className="text-sm text-muted-foreground">
          Guard list coming soon — invited guards won&apos;t appear here yet.
        </p>
      </div>

      {showInviteModal && (
        <InviteModal
          propertyId={propertyId}
          role="guard"
          roleLabel="Guard"
          onClose={() => setShowInviteModal(false)}
          onInvited={() => setShowInviteModal(false)}
        />
      )}
    </section>
  );
}