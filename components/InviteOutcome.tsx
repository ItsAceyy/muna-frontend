"use client";

import { useState } from "react";
import { InviteDetails } from "@/lib/types";

/** What actually happened to an invite that was just created.
 *
 *  Screens used to say "Invite sent" whether or not anything was sent. Now the
 *  backend emails the link and reports whether it went out: when it did, this says
 *  so; when it did not, it hands over the link to pass on by hand, so the invite
 *  is never silently lost. */
export default function InviteOutcome({ invite }: { invite: InviteDetails }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/invites/${invite.token}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the link is on screen to copy by hand.
    }
  }

  if (invite.email_sent) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Invite emailed to <span className="font-medium text-foreground">{invite.email}</span>.
      </p>
    );
  }

  return (
    <div role="status" className="space-y-2">
      <p className="text-sm text-muted-foreground">
        We couldn&apos;t email <span className="font-medium text-foreground">{invite.email}</span>. Send them
        this link yourself, by email or message:
      </p>
      <div className="flex gap-2">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          aria-label={`Invite link for ${invite.email}`}
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground"
        />
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
