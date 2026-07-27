"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AXIS_STYLE, TOOLTIP_STYLE } from "@/components/analytics/ChartFrame";
import { compactSeconds, shortDayLabel } from "@/components/analytics/format";
import { formatSeconds } from "@/lib/date";
import type { DayPoint } from "@/lib/hooks/useAnalytics";

const ON_TIME_SECS = 15 * 60;

export function TimeToStartChart({ days }: { days: DayPoint[] }) {
  const data = days.map((day) => ({ ...day, label: shortDayLabel(day.date) }));

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis dataKey="label" interval={4} {...AXIS_STYLE} />
          <YAxis
            width={52}
            tickFormatter={(value: number) => compactSeconds(value)}
            {...AXIS_STYLE}
          />
          {/* The 15-minute line is the schedule-adherence threshold. */}
          <ReferenceLine
            y={ON_TIME_SECS}
            stroke="var(--border-strong)"
            strokeDasharray="4 4"
            label={{
              value: "batas tepat waktu",
              position: "insideTopRight",
              fill: "var(--text-muted)",
              fontSize: 11,
            }}
          />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value) => [formatSeconds(Number(value ?? 0)), "Jeda mulai"]}
          />
          <Line
            type="monotone"
            dataKey="avgTimeToStartSecs"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "var(--accent)" }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
