"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface WeeklyPoint {
  date: string;
  completed: number;
  isToday: boolean;
}

function weekdayLabel(date: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

export function WeeklyChart({ data }: { data: WeeklyPoint[] }) {
  const points = data.map((row) => ({ ...row, label: weekdayLabel(row.date) }));
  const max = Math.max(1, ...points.map((row) => row.completed));

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={points}
          margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
        >
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, max]}
            tickLine={false}
            axisLine={false}
            width={40}
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "var(--bg-subtle)" }}
            contentStyle={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              fontSize: "0.8125rem",
              boxShadow: "0 1px 3px rgba(0,0,0,.08)",
            }}
            labelStyle={{ color: "var(--text-secondary)" }}
            formatter={(value) => [`${Number(value ?? 0)} tugas`, "Selesai"]}
          />
          <Bar dataKey="completed" radius={[4, 4, 0, 0]} maxBarSize={36}>
            {points.map((row) => (
              <Cell
                key={row.date}
                fill={row.isToday ? "var(--accent)" : "var(--accent-border)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
