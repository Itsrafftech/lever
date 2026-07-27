"use client";

import { cn } from "@/lib/utils";
import { evaluatePassword, type PasswordStrength as Level } from "@/lib/validations/auth";

const BAR_COLORS: Record<Level, string> = {
  weak: "bg-[var(--danger)]",
  fair: "bg-[var(--warning)]",
  good: "bg-[var(--accent)]",
  strong: "bg-[var(--success)]",
};

const TEXT_COLORS: Record<Level, string> = {
  weak: "text-[var(--danger)]",
  fair: "text-[var(--warning)]",
  good: "text-[var(--accent-hover)]",
  strong: "text-[var(--success)]",
};

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;

  const { strength, score, label, hints } = evaluatePassword(password);
  const filled = Math.max(score, 1);

  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden>
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-150",
              index < filled ? BAR_COLORS[strength] : "bg-[var(--bg-sunken)]",
            )}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[0.8125rem]">
        <span className={cn("font-medium", TEXT_COLORS[strength])}>{label}</span>
        {hints.length > 0 ? (
          <span className="text-[var(--text-muted)]"> — {hints[0]}</span>
        ) : null}
      </p>
    </div>
  );
}
