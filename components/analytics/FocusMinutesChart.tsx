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
import { compactMinutes, shortDayLabel } from "@/components/analytics/format";
import { formatDuration } from "@/lib/date";
import type { DayPoint } from "@/lib/hooks/useAnalytics";

export function FocusMinutesChart({ days }: { days: DayPoint[] }) {
  const data = days.map((day) => ({ ...day, label: shortDayLabel(day.date) }));

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis dataKey="label" interval={4} {...AXIS_STYLE} />
          <YAxis
            width={48}
            allowDecimals={false}
            tickFormatter={(value: number) => compactMinutes(value)}
            {...AXIS_STYLE}
          />
          <Tooltip
            cursor={{ fill: "var(--bg-subtle)" }}
            {...TOOLTIP_STYLE}
            formatter={(value) => [formatDuration(Number(value ?? 0)), "Waktu fokus"]}
          />
          <Bar
            dataKey="focusMinutes"
            fill="var(--accent)"
            radius={[3, 3, 0, 0]}
            maxBarSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
