"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AXIS_STYLE, TOOLTIP_STYLE } from "@/components/analytics/ChartFrame";
import type { SkipReasonPoint } from "@/lib/hooks/useAnalytics";

/** Trims the parenthetical so the y-axis stays readable. */
function shortLabel(label: string): string {
  return label.replace(/\s*\(.*\)$/, "");
}

export function SkipReasonsChart({ reasons }: { reasons: SkipReasonPoint[] }) {
  const data = reasons
    .filter((reason) => reason.count > 0)
    .map((reason) => ({ ...reason, short: shortLabel(reason.label) }));

  return (
    <div style={{ height: Math.max(160, data.length * 44) }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            horizontal={false}
          />
          <XAxis type="number" allowDecimals={false} {...AXIS_STYLE} />
          <YAxis
            type="category"
            dataKey="short"
            width={150}
            {...AXIS_STYLE}
          />
          <Tooltip
            cursor={{ fill: "var(--bg-subtle)" }}
            {...TOOLTIP_STYLE}
            formatter={(value) => [`${Number(value ?? 0)} tugas`, "Dilewati"]}
          />
          <Bar
            dataKey="count"
            fill="var(--accent)"
            radius={[0, 3, 3, 0]}
            maxBarSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
