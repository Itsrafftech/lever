"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
  /** Renders a divider above this item. */
  separated?: boolean;
}

export interface ContextMenuProps {
  items: ContextMenuItem[];
  ariaLabel?: string;
  align?: "left" | "right";
  className?: string;
}

export function ContextMenu({
  items,
  ariaLabel = "Menu aksi",
  align = "right",
  className,
}: ContextMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)]",
          "text-[var(--text-muted)] transition-colors duration-150",
          "hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] lever-focus-ring",
          open && "bg-[var(--bg-subtle)] text-[var(--text-primary)]",
        )}
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={ariaLabel}
          className={cn(
            "absolute top-[calc(100%+4px)] z-50 w-52 p-1",
            "rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-surface)]",
            "shadow-card animate-fade-in",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((item, index) => (
            <div key={`${item.label}-${index}`}>
              {item.separated ? (
                <div className="my-1 h-px bg-[var(--border)]" aria-hidden />
              ) : null}
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={(event) => {
                  event.stopPropagation();
                  setOpen(false);
                  item.onSelect();
                }}
                className={cn(
                  "flex h-8 w-full items-center gap-2 rounded-[var(--radius-sm)] px-2",
                  "text-left text-[0.875rem] transition-colors duration-150",
                  "disabled:cursor-not-allowed disabled:text-[var(--text-disabled)]",
                  item.tone === "danger"
                    ? "text-[var(--text-secondary)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]",
                )}
              >
                {item.icon}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
