"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

export interface QuickAddProps {
  onSubmit: (title: string) => void | Promise<void>;
  /** Controlled from the parent so the `N` shortcut can open it. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
}

export function QuickAdd({
  onSubmit,
  open,
  onOpenChange,
  placeholder = "Tulis tugas, tekan Enter untuk simpan",
}: QuickAddProps) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else setTitle("");
  }, [open]);

  async function commit() {
    const trimmed = title.trim();
    if (trimmed.length < 2) return;
    await onSubmit(trimmed);
    // Stay open so several tasks can be added in a row.
    setTitle("");
    inputRef.current?.focus();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2.5 text-left",
          "text-[0.875rem] text-[var(--text-muted)]",
          "transition-colors duration-150 hover:bg-[var(--bg-subtle)] hover:text-[var(--text-secondary)]",
        )}
      >
        <Plus className="h-4 w-4" aria-hidden />
        Tambah tugas
        <kbd className="ml-auto rounded-[4px] border border-[var(--border)] px-1 font-mono text-[0.6875rem] text-[var(--text-muted)]">
          N
        </kbd>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 border-l-2 border-l-[var(--accent)] bg-[var(--bg-subtle)] px-3 py-2">
      <Plus className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden />
      <input
        ref={inputRef}
        value={title}
        placeholder={placeholder}
        aria-label="Judul tugas baru"
        onChange={(event) => setTitle(event.target.value)}
        onBlur={() => {
          if (!title.trim()) onOpenChange(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void commit();
          } else if (event.key === "Escape") {
            event.preventDefault();
            onOpenChange(false);
          }
        }}
        className="h-6 w-full bg-transparent text-[0.875rem] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
      />
      <kbd className="shrink-0 rounded-[4px] border border-[var(--border)] px-1 font-mono text-[0.6875rem] text-[var(--text-muted)]">
        Esc
      </kbd>
    </div>
  );
}
