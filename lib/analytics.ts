import { addDays, dayKey, startOfDayInTimezone } from "@/lib/date";
import { SKIP_REASONS } from "@/lib/validations/task";

/** A session counts as "on time" if it started within 15 minutes of plan. */
export const ADHERENCE_GRACE_SECS = 15 * 60;

/** A start later than this is treated as a procrastination event. */
export const LATE_START_SECS = 30 * 60;

export interface DayPoint {
  date: string;
  /** Percent of the day's planned tasks that were completed, or null if none planned. */
  completionRate: number | null;
  tasksPlanned: number;
  tasksCompleted: number;
  avgTimeToStartSecs: number | null;
  focusMinutes: number;
  /** Percent of started sessions that began within the grace window. */
  scheduleAdherence: number | null;
  sessionsStarted: number;
  sessionsOnTime: number;
}

export interface HourPoint {
  hour: number;
  /** Skips plus late session starts attributed to this hour. */
  procrastination: number;
  skips: number;
  lateStarts: number;
  completed: number;
}

export interface SkipReasonPoint {
  code: string;
  label: string;
  count: number;
}

export interface ScoreBucket {
  bucket: string;
  from: number;
  to: number;
  count: number;
}

export const SKIP_REASON_LABELS: Record<string, string> = Object.fromEntries(
  SKIP_REASONS.map((reason) => [reason.value, reason.label]),
);

/** Builds an empty day-keyed series covering `days` days ending today. */
export function emptySeries(
  todayStart: Date,
  days: number,
): { points: DayPoint[]; index: Map<string, number> } {
  const first = addDays(todayStart, -(days - 1));
  const points: DayPoint[] = Array.from({ length: days }, (_, offset) => ({
    date: dayKey(addDays(first, offset)),
    completionRate: null,
    tasksPlanned: 0,
    tasksCompleted: 0,
    avgTimeToStartSecs: null,
    focusMinutes: 0,
    scheduleAdherence: null,
    sessionsStarted: 0,
    sessionsOnTime: 0,
  }));

  return {
    points,
    index: new Map(points.map((point, position) => [point.date, position])),
  };
}

/** Local-day key for an instant, in the user's timezone. */
export function localDayKey(date: Date, timezone: string): string {
  return dayKey(startOfDayInTimezone(date, timezone));
}

/** Local hour (0-23) for an instant, in the user's timezone. */
export function localHour(date: Date, timezone: string): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: timezone,
    }).format(date),
  );
}

/** Local weekday index (0 = Sunday) for an instant, in the user's timezone. */
export function localWeekday(date: Date, timezone: string): number {
  const name = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: timezone,
  }).format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}

export function bucketScores(scores: number[]): ScoreBucket[] {
  const buckets: ScoreBucket[] = [
    { bucket: "0–19", from: 0, to: 19, count: 0 },
    { bucket: "20–39", from: 20, to: 39, count: 0 },
    { bucket: "40–59", from: 40, to: 59, count: 0 },
    { bucket: "60–79", from: 60, to: 79, count: 0 },
    { bucket: "80–100", from: 80, to: 100, count: 0 },
  ];

  for (const score of scores) {
    const target = buckets.find((item) => score >= item.from && score <= item.to);
    if (target) target.count += 1;
  }

  return buckets;
}

/** Mean of a list, or null when there is nothing to average. */
export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Percent change from `previous` to `current`. Null when there is no usable
 * baseline — showing "+100%" against a zero week would be misleading.
 */
export function percentDelta(
  current: number | null,
  previous: number | null,
): number | null {
  if (current === null || previous === null) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}
