export type ClassValue =
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | ClassValue[];

/** Minimal class-name joiner. No dependency needed for what we do here. */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const value of values) {
    if (!value || value === true) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else {
      out.push(String(value));
    }
  }
  return out.join(" ");
}

/** Stable id generator for client-only entities (toasts, optimistic rows). */
export function clientId(): string {
  return Math.random().toString(36).slice(2, 11);
}
