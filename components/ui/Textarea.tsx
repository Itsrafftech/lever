"use client";

import { forwardRef, useId, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
  hint?: string;
  /** Shows an `n/max` counter; requires maxLength. */
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, error, hint, showCount, className, id, maxLength, value, ...props },
    ref,
  ) {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const describedBy = error
      ? `${textareaId}-error`
      : hint
        ? `${textareaId}-hint`
        : undefined;
    const length = typeof value === "string" ? value.length : 0;

    return (
      <div className="w-full">
        {label || (showCount && maxLength) ? (
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            {label ? (
              <label
                htmlFor={textareaId}
                className="block text-[0.8125rem] font-medium text-[var(--text-secondary)]"
              >
                {label}
              </label>
            ) : (
              <span />
            )}
            {showCount && maxLength ? (
              <span
                className={cn(
                  "font-mono text-[0.75rem]",
                  length > maxLength * 0.9
                    ? "text-[var(--warning)]"
                    : "text-[var(--text-muted)]",
                )}
              >
                {length}/{maxLength}
              </span>
            ) : null}
          </div>
        ) : null}

        <textarea
          ref={ref}
          id={textareaId}
          maxLength={maxLength}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "w-full resize-y rounded-[var(--radius)] border bg-[var(--bg-surface)]",
            "min-h-[76px] px-3 py-2 text-[0.875rem] text-[var(--text-primary)]",
            "placeholder:text-[var(--text-muted)]",
            "transition-colors duration-150 outline-none",
            "focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]",
            "disabled:bg-[var(--bg-subtle)] disabled:text-[var(--text-disabled)]",
            error
              ? "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]"
              : "border-[var(--border)]",
            className,
          )}
          {...props}
        />

        {error ? (
          <p
            id={`${textareaId}-error`}
            className="mt-1.5 text-[0.8125rem] text-[var(--danger)]"
          >
            {error}
          </p>
        ) : hint ? (
          <p
            id={`${textareaId}-hint`}
            className="mt-1.5 text-[0.8125rem] text-[var(--text-muted)]"
          >
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
