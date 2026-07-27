"use client";

import { useEffect, useState } from "react";

import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";

export interface GoalProgressProps {
  value: number;
  onCommit: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Progress is deliberately manual — the spec treats updating it as a moment of
 * reflection, so nothing here derives it from task completion.
 */
export function GoalProgress({
  value,
  onCommit,
  disabled,
  className,
}: GoalProgressProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[0.8125rem] text-[var(--text-secondary)]">
          Progres
        </span>
        <span className="font-mono text-[0.875rem] text-[var(--text-primary)]">
          {draft}%
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={draft}
        disabled={disabled}
        aria-label="Perbarui progres tujuan"
        onChange={(event) => setDraft(Number(event.target.value))}
        onPointerUp={() => draft !== value && onCommit(draft)}
        onKeyUp={() => draft !== value && onCommit(draft)}
        onBlur={() => draft !== value && onCommit(draft)}
        className={cn(
          "h-4 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed",
          "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full",
          "[&::-webkit-slider-runnable-track]:bg-[var(--bg-sunken)]",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:-mt-[5px]",
          "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)]",
          "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--bg-surface)]",
          "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full",
          "[&::-moz-range-track]:bg-[var(--bg-sunken)]",
          "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:border-0",
          "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--accent)]",
          "lever-focus-ring",
        )}
      />
    </div>
  );
}

/** Read-only variant for surfaces that only display progress. */
export function GoalProgressReadonly({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3">
      <ProgressBar value={value} />
      <span className="shrink-0 font-mono text-[0.8125rem] text-[var(--text-secondary)]">
        {value}%
      </span>
    </div>
  );
}
