"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AXIS_STYLE, TOOLTIP_STYLE } from "@/components/analytics/ChartFrame";
import { shortDayLabel } from "@/components/analytics/format";
import type { DayPoint } from "@/lib/hooks/useAnalytics";

export function CompletionChart({ days }: { days: DayPoint[] }) {
  const data = days.map((day) => ({
    ...day,
    label: shortDayLabel(day.date),
  }));

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis dataKey="label" interval={4} {...AXIS_STYLE} />
          <YAxis domain={[0, 100]} width={44} unit="%" {...AXIS_STYLE} />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value, _name, item) => {
              const point = item?.payload as DayPoint | undefined;
              return [
                `${Number(value ?? 0)}% (${point?.tasksCompleted ?? 0}/${point?.tasksPlanned ?? 0})`,
                "Selesai",
              ];
            }}
          />
          <Line
            type="monotone"
            dataKey="completionRate"
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
