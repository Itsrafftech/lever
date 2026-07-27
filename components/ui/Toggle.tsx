"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
  ariaLabel,
}: ToggleProps) {
  const id = useId();

  const control = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label ? undefined : ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-150",
        "lever-focus-ring disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "border-[var(--accent)] bg-[var(--accent)]"
          : "border-[var(--border-strong)] bg-[var(--bg-sunken)]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white transition-[left] duration-150",
          checked ? "left-[18px]" : "left-[2px]",
        )}
      />
    </button>
  );

  if (!label) return <span className={className}>{control}</span>;

  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-[0.875rem] text-[var(--text-primary)]">
          {label}
        </span>
        {description ? (
          <span className="block text-[0.8125rem] text-[var(--text-muted)]">
            {description}
          </span>
        ) : null}
      </label>
      {control}
    </div>
  );
}
