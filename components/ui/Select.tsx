"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

export interface SelectProps<T extends string> {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  placeholder?: string;
  error?: string | null;
  hint?: string;
  disabled?: boolean;
  className?: string;
  /** Caps the popup height; longer lists scroll. */
  maxHeight?: number;
}

/** Custom dropdown — native <select> cannot be styled to the design system. */
export function Select<T extends string>({
  options,
  value,
  onChange,
  label,
  placeholder = "Pilih…",
  error,
  hint,
  disabled,
  className,
  maxHeight = 260,
}: SelectProps<T>) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const index = options.findIndex((option) => option.value === value);
    setActiveIndex(index === -1 ? 0 : index);
  }, [open, options, value]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (disabled) return;

    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + options.length) % options.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) {
        onChange(option.value);
        setOpen(false);
      }
    }
  }

  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <label
          htmlFor={id}
          className="mb-1.5 block text-[0.8125rem] font-medium text-[var(--text-secondary)]"
        >
          {label}
        </label>
      ) : null}

      <div ref={containerRef} className="relative">
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-haspopup="listbox"
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={onKeyDown}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-[var(--radius)] border",
            "bg-[var(--bg-surface)] px-3 text-left text-[0.875rem]",
            "transition-colors duration-150 outline-none",
            "focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]",
            "disabled:cursor-not-allowed disabled:bg-[var(--bg-subtle)] disabled:text-[var(--text-disabled)]",
            error ? "border-[var(--danger)]" : "border-[var(--border)]",
          )}
        >
          <span
            className={cn(
              "truncate",
              selected ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]",
            )}
          >
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-150",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        {open ? (
          <div
            ref={listRef}
            id={`${id}-listbox`}
            role="listbox"
            aria-label={label}
            style={{ maxHeight }}
            className={cn(
              "absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-y-auto p-1",
              "rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-surface)]",
              "shadow-card animate-fade-in",
            )}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  data-index={index}
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left",
                    "transition-colors duration-150",
                    index === activeIndex
                      ? "bg-[var(--bg-subtle)]"
                      : "bg-transparent",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.875rem] text-[var(--text-primary)]">
                      {option.label}
                    </span>
                    {option.description ? (
                      <span className="block truncate text-[0.8125rem] text-[var(--text-muted)]">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                  {isSelected ? (
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]"
                      aria-hidden
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mt-1.5 text-[0.8125rem] text-[var(--danger)]">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[0.8125rem] text-[var(--text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}
