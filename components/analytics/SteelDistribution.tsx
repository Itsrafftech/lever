"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AXIS_STYLE, TOOLTIP_STYLE } from "@/components/analytics/ChartFrame";
import type { ScoreBucket } from "@/lib/hooks/useAnalytics";

/** Same bands the score badge uses: red <40, amber 40-69, green 70+. */
function bucketColor(bucket: ScoreBucket): string {
  if (bucket.from >= 70) return "var(--success)";
  if (bucket.from >= 40) return "var(--warning)";
  return "var(--danger)";
}

export function SteelDistribution({ buckets }: { buckets: ScoreBucket[] }) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={buckets} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis dataKey="bucket" {...AXIS_STYLE} />
          <YAxis width={40} allowDecimals={false} {...AXIS_STYLE} />
          <Tooltip
            cursor={{ fill: "var(--bg-subtle)" }}
            {...TOOLTIP_STYLE}
            labelFormatter={(label) => `Skor ${label}`}
            formatter={(value) => [`${Number(value ?? 0)} tugas`, "Jumlah"]}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={48}>
            {buckets.map((bucket) => (
              <Cell key={bucket.bucket} fill={bucketColor(bucket)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
