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
import { hourLabel } from "@/components/analytics/format";
import type { HourPoint } from "@/lib/hooks/useAnalytics";

export function PeakHoursChart({ hours }: { hours: HourPoint[] }) {
  const data = hours.map((hour) => ({ ...hour, label: hourLabel(hour.hour) }));
  const peak = Math.max(...data.map((row) => row.procrastination));

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis dataKey="label" interval={1} {...AXIS_STYLE} />
          <YAxis width={40} allowDecimals={false} {...AXIS_STYLE} />
          <Tooltip
            cursor={{ fill: "var(--bg-subtle)" }}
            {...TOOLTIP_STYLE}
            labelFormatter={(label) => `Jam ${label}.00`}
            formatter={(value, _name, item) => {
              const point = item?.payload as HourPoint | undefined;
              return [
                `${Number(value ?? 0)} kejadian (${point?.skips ?? 0} dilewati, ${point?.lateStarts ?? 0} mulai terlambat)`,
                "Menunda",
              ];
            }}
          />
          <Bar dataKey="procrastination" radius={[3, 3, 0, 0]} maxBarSize={20}>
            {data.map((row) => (
              <Cell
                key={row.hour}
                // The worst hour is what the user needs to act on, so it is the
                // only bar carrying full accent weight.
                fill={
                  row.procrastination > 0 && row.procrastination === peak
                    ? "var(--danger)"
                    : "var(--accent)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
