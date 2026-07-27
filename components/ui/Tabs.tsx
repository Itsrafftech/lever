"use client";

import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  count?: number;
  icon?: ReactNode;
}

export interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  variant?: "underline" | "segmented";
  ariaLabel?: string;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  variant = "underline",
  ariaLabel,
}: TabsProps<T>) {
  const id = useId();

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = items.findIndex((item) => item.value === value);
    if (index === -1) return;

    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % items.length;
    else if (event.key === "ArrowLeft")
      next = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;

    event.preventDefault();
    onChange(items[next].value);
  }

  if (variant === "segmented") {
    return (
      <div
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
        className={cn(
          "inline-flex gap-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-subtle)] p-1",
          className,
        )}
      >
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              id={`${id}-${item.value}`}
              role="tab"
              type="button"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(item.value)}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 text-[0.8125rem]",
                "transition-colors duration-150 lever-focus-ring",
                active
                  ? "bg-[var(--bg-surface)] font-medium text-[var(--text-primary)] shadow-card"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              {item.icon}
              {item.label}
              {typeof item.count === "number" ? (
                <span className="font-mono text-[0.75rem] text-[var(--text-muted)]">
                  {item.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn(
        "flex items-center gap-1 border-b border-[var(--border)]",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            id={`${id}-${item.value}`}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              "-mb-px flex h-9 items-center gap-1.5 border-b-2 px-3 text-[0.875rem]",
              "transition-colors duration-150 lever-focus-ring",
              active
                ? "border-[var(--accent)] font-medium text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
          >
            {item.icon}
            {item.label}
            {typeof item.count === "number" ? (
              <span
                className={cn(
                  "rounded-[4px] px-1 font-mono text-[0.75rem]",
                  active
                    ? "bg-[var(--accent-subtle)] text-[var(--accent-hover)]"
                    : "bg-[var(--bg-subtle)] text-[var(--text-muted)]",
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
