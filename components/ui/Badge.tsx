import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BadgeTone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info";

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const TONES: Record<BadgeTone, string> = {
  neutral:
    "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border)]",
  accent:
    "bg-[var(--accent-subtle)] text-[var(--accent-hover)] border-[var(--accent-border)]",
  success:
    "bg-[var(--success-bg)] text-[var(--success)] border-[color:var(--success)]/20",
  warning:
    "bg-[var(--warning-bg)] text-[var(--warning)] border-[color:var(--warning)]/20",
  danger:
    "bg-[var(--danger-bg)] text-[var(--danger)] border-[color:var(--danger)]/20",
  info: "bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-strong)]",
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-sm)] border",
        "px-2 py-0.5 text-[0.75rem] font-medium leading-5 whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---- Domain badge mappings ---------------------------------------------- */

export const GOAL_CATEGORY_LABELS: Record<string, string> = {
  PERSONAL: "Pribadi",
  WORK: "Pekerjaan",
  HEALTH: "Kesehatan",
  LEARNING: "Pembelajaran",
  FINANCIAL: "Keuangan",
  RELATIONSHIP: "Relasi",
};

export const GOAL_CATEGORY_TONES: Record<string, BadgeTone> = {
  PERSONAL: "neutral",
  WORK: "accent",
  HEALTH: "success",
  LEARNING: "info",
  FINANCIAL: "warning",
  RELATIONSHIP: "neutral",
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
  URGENT: "Mendesak",
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: "Belum mulai",
  IN_PROGRESS: "Sedang dikerjakan",
  DONE: "Selesai",
  SKIPPED: "Dilewati",
};
