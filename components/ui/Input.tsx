"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  hint?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, trailing, className, id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;

  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-[0.8125rem] font-medium text-[var(--text-secondary)]"
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        {icon ? (
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            aria-hidden
          >
            {icon}
          </span>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-9 w-full rounded-[var(--radius)] border bg-[var(--bg-surface)]",
            "px-3 text-[0.875rem] text-[var(--text-primary)]",
            "placeholder:text-[var(--text-muted)]",
            "transition-colors duration-150 outline-none",
            "focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-0",
            "disabled:bg-[var(--bg-subtle)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed",
            error
              ? "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]"
              : "border-[var(--border)]",
            icon && "pl-9",
            trailing && "pr-10",
            className,
          )}
          {...props}
        />

        {trailing ? (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">
            {trailing}
          </span>
        ) : null}
      </div>

      {error ? (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 text-[0.8125rem] text-[var(--danger)]"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${inputId}-hint`}
          className="mt-1.5 text-[0.8125rem] text-[var(--text-muted)]"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
});
