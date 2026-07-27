"use client";

import { useId, type ReactNode } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
  ariaLabel,
}: CheckboxProps) {
  const id = useId();

  const box = (
    <span
      aria-hidden
      className={cn(
        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border",
        "transition-colors duration-150",
        checked
          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
          : "border-[var(--border-strong)] bg-[var(--bg-surface)]",
        disabled && "opacity-50",
      )}
    >
      {checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
    </span>
  );

  if (!label) {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          onChange(!checked);
        }}
        className={cn(
          "rounded-[5px] lever-focus-ring disabled:cursor-not-allowed",
          className,
        )}
      >
        {box}
      </button>
    );
  }

  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="mt-0.5 rounded-[5px] lever-focus-ring disabled:cursor-not-allowed"
      >
        {box}
      </button>
      <label
        htmlFor={id}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "min-w-0 cursor-pointer select-none",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span className="block text-[0.875rem] text-[var(--text-primary)]">
          {label}
        </span>
        {description ? (
          <span className="block text-[0.8125rem] text-[var(--text-muted)]">
            {description}
          </span>
        ) : null}
      </label>
    </div>
  );
}
