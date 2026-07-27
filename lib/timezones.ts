export interface TimezoneOption {
  value: string;
  label: string;
  description: string;
}

/**
 * Curated rather than exhaustive: the target market is Indonesian, with a long
 * tail of users abroad. `Intl.supportedValuesOf` would list 400+ entries and
 * make the picker unusable.
 */
export const TIMEZONES: TimezoneOption[] = [
  { value: "Asia/Jakarta", label: "Jakarta (WIB)", description: "UTC+7" },
  { value: "Asia/Makassar", label: "Makassar (WITA)", description: "UTC+8" },
  { value: "Asia/Jayapura", label: "Jayapura (WIT)", description: "UTC+9" },
  { value: "Asia/Singapore", label: "Singapura", description: "UTC+8" },
  { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur", description: "UTC+8" },
  { value: "Asia/Bangkok", label: "Bangkok", description: "UTC+7" },
  { value: "Asia/Tokyo", label: "Tokyo", description: "UTC+9" },
  { value: "Asia/Seoul", label: "Seoul", description: "UTC+9" },
  { value: "Asia/Shanghai", label: "Shanghai", description: "UTC+8" },
  { value: "Asia/Hong_Kong", label: "Hong Kong", description: "UTC+8" },
  { value: "Asia/Dubai", label: "Dubai", description: "UTC+4" },
  { value: "Australia/Sydney", label: "Sydney", description: "UTC+10/+11" },
  { value: "Europe/London", label: "London", description: "UTC+0/+1" },
  { value: "Europe/Amsterdam", label: "Amsterdam", description: "UTC+1/+2" },
  { value: "Europe/Berlin", label: "Berlin", description: "UTC+1/+2" },
  { value: "America/New_York", label: "New York", description: "UTC-5/-4" },
  { value: "America/Chicago", label: "Chicago", description: "UTC-6/-5" },
  { value: "America/Los_Angeles", label: "Los Angeles", description: "UTC-8/-7" },
  { value: "UTC", label: "UTC", description: "Waktu universal" },
];

export const TIMEZONE_VALUES = TIMEZONES.map((zone) => zone.value);

export function isSupportedTimezone(value: string): boolean {
  return TIMEZONE_VALUES.includes(value);
}

/** Best-effort guess from the browser, falling back to Jakarta. */
export function guessTimezone(): string {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isSupportedTimezone(detected) ? detected : "Asia/Jakarta";
  } catch {
    return "Asia/Jakarta";
  }
}
