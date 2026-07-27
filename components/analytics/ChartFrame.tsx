"use client";

import type { ReactNode } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

export interface ChartFrameProps {
  /** Section label lives above the chart — never inside it. */
  title: string;
  description?: string;
  loading?: boolean;
  /** When false the frame shows the empty message instead of the chart. */
  hasData: boolean;
  emptyMessage: string;
  children: ReactNode;
  aside?: ReactNode;
}

export function ChartFrame({
  title,
  description,
  loading,
  hasData,
  emptyMessage,
  children,
  aside,
}: ChartFrameProps) {
  return (
    <section className="lever-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[1.125rem] font-semibold">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-[0.8125rem] text-[var(--text-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {aside}
      </div>

      <div className="mt-4">
        {loading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : hasData ? (
          children
        ) : (
          <EmptyState message={emptyMessage} />
        )}
      </div>
    </section>
  );
}

/** Shared Recharts tooltip styling so every chart reads the same. */
export const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    fontSize: "0.8125rem",
    boxShadow: "0 1px 3px rgba(0,0,0,.08)",
  },
  labelStyle: { color: "var(--text-secondary)" },
} as const;

export const AXIS_STYLE = {
  tickLine: false,
  axisLine: false,
  tick: { fill: "var(--text-muted)", fontSize: 12 },
} as const;
