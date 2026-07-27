/** Axis label for a YYYY-MM-DD day key, e.g. "27/7". */
export function shortDayLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return `${parsed.getUTCDate()}/${parsed.getUTCMonth() + 1}`;
}

/** Compact duration for axis ticks: 90 -> "1j 30m". */
export function compactMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}j` : `${hours}j ${rest}m`;
}

/** Seconds rendered for a y-axis tick: 930 -> "15m". */
export function compactSeconds(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.round(seconds / 60)}m`;
}

export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}`;
}
