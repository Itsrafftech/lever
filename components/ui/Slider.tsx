"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  /** Small text under the label explaining what the number means. */
  question?: string;
  lowLabel?: string;
  highLabel?: string;
  /** Renders the value in the warning tone when high values are undesirable. */
  inverted?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Slider({
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  label,
  question,
  lowLabel,
  highLabel,
  inverted = false,
  disabled,
  className,
}: SliderProps) {
  const id = useId();

  // For inverted variables (I, D) a *high* number is the bad outcome.
  const concerning = inverted ? value >= 7 : value <= 4;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[0.875rem] font-medium">
          {label}
        </label>
        <span
          className={cn(
            "font-mono text-[0.875rem]",
            concerning ? "text-[var(--warning)]" : "text-[var(--text-secondary)]",
          )}
        >
          {value}
        </span>
      </div>

      {question ? (
        <p className="mt-0.5 text-[0.8125rem] text-[var(--text-muted)]">
          {question}
        </p>
      ) : null}

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={`${value} dari ${max}`}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(
          "mt-2 h-4 w-full cursor-pointer appearance-none bg-transparent",
          "disabled:cursor-not-allowed disabled:opacity-60",
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

      {lowLabel || highLabel ? (
        <div className="flex justify-between text-[0.75rem] text-[var(--text-muted)]">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
