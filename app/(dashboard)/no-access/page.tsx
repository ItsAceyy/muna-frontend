export default function NoAccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Muna</p>
        <h1 className="text-2xl font-display font-medium text-foreground mb-2">No access yet</h1>
        <p className="text-sm text-muted-foreground">Your account isn&apos;t linked to any property yet.</p>
      </div>
    </div>
  );
}