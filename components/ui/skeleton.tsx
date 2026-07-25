export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-border/50 rounded-md ${className}`} />;
}