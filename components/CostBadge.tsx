"use client";

interface CostBadgeProps {
  cost: number;
  calls: number;
  duration: number;
}

export default function CostBadge({ cost, calls, duration }: CostBadgeProps) {
  const durationStr = duration > 0 ? `${(duration / 1000).toFixed(1)}s` : "...";
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded font-mono text-xs text-text-muted">
      <span className="text-accent">${cost.toFixed(2)}</span>
      <span className="text-border">|</span>
      <span>{calls} calls</span>
      <span className="text-border">|</span>
      <span>{durationStr}</span>
    </div>
  );
}
