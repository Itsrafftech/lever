"use client";

import { AlertTriangle, Info, TrendingDown, TrendingUp } from "lucide-react";

import { formatDuration, formatSeconds } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { Insight, MetricComparison } from "@/lib/hooks/useAnalytics";

const TONE_STYLES = {
  positive: {
    wrap: "border-[color:var(--success)]/25 bg-[var(--success-bg)]",
    icon: "text-[var(--success)]",
  },
  warning: {
    wrap: "border-[color:var(--warning)]/25 bg-[var(--warning-bg)]",
    icon: "text-[var(--warning)]",
  },
  neutral: {
    wrap: "border-[var(--border)] bg-[var(--bg-surface)]",
    icon: "text-[var(--text-secondary)]",
  },
} as const;

const TONE_ICONS = {
  positive: TrendingUp,
  warning: AlertTriangle,
  neutral: Info,
} as const;

export function InsightCard({ insight }: { insight: Insight }) {
  const styles = TONE_STYLES[insight.tone];
  const Icon = TONE_ICONS[insight.tone];

  return (
    <article
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-lg)] border p-4",
        styles.wrap,
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", styles.icon)} aria-hidden />
      <div className="min-w-0">
        <h3 className="text-[0.9375rem] font-medium">{insight.title}</h3>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
          {insight.detail}
        </p>
      </div>
    </article>
  );
}

function formatValue(value: number | null, unit: MetricComparison["unit"]): string {
  if (value === null) return "—";
  if (unit === "percent") return `${value}%`;
  if (unit === "minutes") return formatDuration(value);
  if (unit === "seconds") return formatSeconds(value);
  return String(value);
}

export function ComparisonRow({ metric }: { metric: MetricComparison }) {
  const { delta, lowerIsBetter } = metric;

  // A drop in time-to-start is an improvement; a drop in focus minutes is not.
  const improving =
    delta === null ? null : lowerIsBetter ? delta < 0 : delta > 0;
  const flat = delta === 0;

  const Icon = delta === null || flat ? Info : delta < 0 ? TrendingDown : TrendingUp;

  return (
    <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-2.5 last:border-b-0">
      <span className="min-w-0 flex-1 truncate text-[0.875rem] text-[var(--text-secondary)]">
        {metric.label}
      </span>

      <span className="shrink-0 font-mono text-[0.8125rem] text-[var(--text-muted)]">
        {formatValue(metric.previous, metric.unit)}
      </span>

      <span aria-hidden className="shrink-0 text-[var(--text-disabled)]">
        →
      </span>

      <span className="w-16 shrink-0 text-right font-mono text-[0.875rem] text-[var(--text-primary)]">
        {formatValue(metric.current, metric.unit)}
      </span>

      <span
        className={cn(
          "flex w-20 shrink-0 items-center justify-end gap-1 font-mono text-[0.8125rem]",
          delta === null || flat
            ? "text-[var(--text-muted)]"
            : improving
              ? "text-[var(--success)]"
              : "text-[var(--danger)]",
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta}%`}
      </span>
    </div>
  );
}
