const DAY_MS = 24 * 60 * 60 * 1000;

/** Formats a date in the user's timezone, e.g. "Sabtu, 26 Juli 2026". */
export function formatLongDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  }).format(date);
}

/** Formats a date as "26 Jul". */
export function formatShortDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: timezone,
  }).format(date);
}

/** Formats a time as "14:30". */
export function formatTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(date);
}

/** Renders a minute count as "1j 25m" / "25m". */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}j`;
  return `${hours}j ${rest}m`;
}

/** Renders a second count as "2m 30s" / "45s". */
export function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`;
}

/**
 * Midnight of the given instant *in the user's timezone*, expressed as a UTC
 * Date. Every daily bucket in the app is keyed off this so a Jakarta user's
 * "today" does not roll over at UTC midnight.
 */
export function startOfDayInTimezone(date: Date, timezone: string): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return new Date(`${parts}T00:00:00.000Z`);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Inclusive list of day-start dates from `start` spanning `count` days. */
export function dayRange(start: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, index) => addDays(start, index));
}

/** Stable YYYY-MM-DD key for a normalized day-start date. */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
