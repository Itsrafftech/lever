"use client";

import { useMemo } from "react";

import { formatDuration } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { DayPoint } from "@/lib/hooks/useAnalytics";

const WEEKDAY_HEADS = ["S", "S", "R", "K", "J", "S", "M"];

interface Cell {
  key: string;
  date: string | null;
  minutes: number;
  completed: number;
  level: 0 | 1 | 2 | 3 | 4;
  /** False for days outside the 30-day window — including future dates. */
  inWindow: boolean;
}

/** Focus minutes mapped to four visible intensities plus empty. */
function intensity(minutes: number): Cell["level"] {
  if (minutes <= 0) return 0;
  if (minutes < 25) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

const LEVEL_CLASSES: Record<Cell["level"], string> = {
  0: "bg-[var(--bg-sunken)]",
  1: "bg-[#F6D9BC]",
  2: "bg-[#EEB47C]",
  3: "bg-[#E08A3C]",
  4: "bg-[var(--accent)]",
};

/** ISO weekday index where Monday is 0, matching the header row. */
function mondayIndex(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month, 1)));
}

export function StreakCalendar({
  days,
  currentStreak,
}: {
  days: DayPoint[];
  currentStreak: number;
}) {
  const months = useMemo(() => {
    const byDate = new Map(days.map((day) => [day.date, day]));
    if (days.length === 0) return [];

    const first = new Date(`${days[0].date}T00:00:00.000Z`);
    const last = new Date(`${days[days.length - 1].date}T00:00:00.000Z`);

    const result: {
      key: string;
      label: string;
      cells: Cell[];
    }[] = [];

    const cursor = new Date(
      Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1),
    );

    while (cursor <= last) {
      const year = cursor.getUTCFullYear();
      const month = cursor.getUTCMonth();
      const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      const leading = mondayIndex(new Date(Date.UTC(year, month, 1)));

      const cells: Cell[] = Array.from({ length: leading }, (_, index) => ({
        key: `${year}-${month}-pad-${index}`,
        date: null,
        minutes: 0,
        completed: 0,
        level: 0 as const,
        inWindow: false,
      }));

      for (let day = 1; day <= daysInMonth; day += 1) {
        const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const point = byDate.get(key);
        cells.push({
          key,
          date: key,
          minutes: point?.focusMinutes ?? 0,
          completed: point?.tasksCompleted ?? 0,
          level: point ? intensity(point.focusMinutes) : 0,
          // Days the window does not cover (older, or still in the future) must
          // not read as "you did nothing that day".
          inWindow: Boolean(point),
        });
      }

      result.push({
        key: `${year}-${month}`,
        label: monthLabel(year, month),
        cells,
      });

      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    return result;
  }, [days]);

  const activeDays = days.filter((day) => day.focusMinutes > 0).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <p className="text-[0.8125rem] text-[var(--text-secondary)]">
          Streak saat ini:{" "}
          <span className="font-mono text-[var(--text-primary)]">
            {currentStreak} hari
          </span>
        </p>
        <p className="text-[0.8125rem] text-[var(--text-secondary)]">
          Hari aktif:{" "}
          <span className="font-mono text-[var(--text-primary)]">
            {activeDays}/{days.length}
          </span>
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-6">
        {months.map((month) => (
          <div key={month.key}>
            <p className="mb-2 text-[0.8125rem] font-medium text-[var(--text-secondary)]">
              {month.label}
            </p>

            <div className="grid grid-cols-7 gap-1" aria-hidden>
              {WEEKDAY_HEADS.map((head, index) => (
                <span
                  key={`${month.key}-head-${index}`}
                  className="flex h-4 w-6 items-center justify-center text-[0.6875rem] text-[var(--text-muted)]"
                >
                  {head}
                </span>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1">
              {month.cells.map((cell) =>
                cell.date === null ? (
                  <span key={cell.key} className="h-6 w-6" />
                ) : cell.inWindow ? (
                  <span
                    key={cell.key}
                    title={`${cell.date}: ${formatDuration(cell.minutes)} fokus, ${cell.completed} tugas selesai`}
                    className={cn(
                      "h-6 w-6 rounded-[4px] border border-[var(--border)]",
                      LEVEL_CLASSES[cell.level],
                    )}
                  />
                ) : (
                  <span
                    key={cell.key}
                    title={`${cell.date}: di luar rentang 30 hari`}
                    className="h-6 w-6 rounded-[4px] border border-dashed border-[var(--border)]"
                  />
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-[0.75rem] text-[var(--text-muted)]">Sedikit</span>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <span
            key={level}
            className={cn(
              "h-3.5 w-3.5 rounded-[3px] border border-[var(--border)]",
              LEVEL_CLASSES[level],
            )}
          />
        ))}
        <span className="text-[0.75rem] text-[var(--text-muted)]">Banyak</span>
      </div>
    </div>
  );
}
