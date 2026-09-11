// Shared class strings for the unit setup screens, so the toolbar, the modals and the
// type list read as one piece. Primary actions are ink, per the Haven direction: the
// bronze accent is kept for emphasis, never for the main button.

export const primaryButton =
  "rounded-md px-3.5 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

export const secondaryButton =
  "rounded-md px-3 py-2 text-sm font-medium border border-border bg-card text-foreground hover:bg-muted/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

export const quietButton =
  "rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-50 transition-colors";

export const inputClass =
  "border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-ring/35 focus:border-border-strong transition-shadow";

export const labelClass = "block text-xs font-medium text-muted-foreground mb-1";
