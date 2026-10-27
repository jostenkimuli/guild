// Tiny CSS/SVG chart primitives for the playground dashboard preview. No chart
// dependency — everything is a flex bar, a split bar, an SVG ring, or a pair of
// labelled bars, styled with Tailwind tokens.

import { cn } from "@/lib/utils";

export function DeltaChip({ t1, t2 }: { t1: number; t2: number }) {
  const delta = Math.round(t2 - t1);
  if (delta === 0) {
    return <span className="text-xs text-muted-foreground">no change</span>;
  }
  const improving = delta > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        improving ? "text-emerald-600" : "text-destructive",
      )}
    >
      {improving ? "▲" : "▼"} {Math.abs(delta)}
    </span>
  );
}

export function HBar({
  value,
  target,
  tone = "primary",
  className,
}: {
  value: number;
  target?: number;
  tone?: "primary" | "emerald" | "amber" | "red";
  className?: string;
}) {
  const barClass =
    tone === "emerald"
      ? "bg-emerald-500"
      : tone === "amber"
        ? "bg-amber-500"
        : tone === "red"
          ? "bg-red-500"
          : "bg-primary";
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("relative h-2 w-full rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full", barClass)}
        style={{ width: `${pct}%` }}
      />
      {target !== undefined ? (
        <span
          className="absolute top-[-3px] h-[14px] w-0.5 rounded bg-foreground/40"
          style={{ left: `${Math.min(100, Math.max(0, target))}%` }}
          title={`Target ${target}%`}
        />
      ) : null}
    </div>
  );
}

export function SplitBar({
  segments,
  className,
}: {
  segments: { label: string; value: number; className: string }[];
  className?: string;
}) {
  const total = Math.max(
    1,
    segments.reduce((sum, segment) => sum + segment.value, 0),
  );
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className={cn(segment.className)}
            style={{ width: `${(segment.value / total) * 100}%` }}
            title={segment.label}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((segment) => (
          <span
            key={segment.label}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span className={cn("size-2 rounded-sm", segment.className)} />
            {segment.label} · {Math.round((segment.value / total) * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
}

export function RingGauge({
  value,
  size = 132,
  stroke = 10,
  label,
  sublabel,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100);
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "transition-all duration-500",
            value >= 80 ? "stroke-emerald-500" : value >= 65 ? "stroke-amber-500" : "stroke-red-500",
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{value}%</span>
        {label ? <span className="text-xs text-muted-foreground">{label}</span> : null}
        {sublabel ? <span className="text-[10px] text-muted-foreground">{sublabel}</span> : null}
      </div>
    </div>
  );
}

export function GenderBars({ female, male }: { female: number; male: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="w-11 shrink-0 text-xs text-muted-foreground">Female</span>
        <HBar value={female} tone="primary" />
        <span className="w-9 shrink-0 text-right text-xs font-medium">{female}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-11 shrink-0 text-xs text-muted-foreground">Male</span>
        <HBar value={male} tone="emerald" />
        <span className="w-9 shrink-0 text-right text-xs font-medium">{male}%</span>
      </div>
    </div>
  );
}