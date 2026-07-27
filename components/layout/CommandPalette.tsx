"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { mutate as globalMutate } from "swr";
import { CornerDownLeft, Plus, Search } from "lucide-react";

import { SteelScoreBadge } from "@/components/tasks/SteelScoreBadge";
import { describeError } from "@/lib/fetcher";
import { createTask } from "@/lib/hooks/useTasks";
import { ALL_NAV } from "@/lib/nav";
import { toast } from "@/lib/store/toast";
import { useUiStore } from "@/lib/store/ui";
import { cn } from "@/lib/utils";
import type { TaskDTO } from "@/types/api";

const SEARCH_DEBOUNCE_MS = 200;

type Row =
  | { kind: "nav"; id: string; label: string; href: string }
  | { kind: "task"; id: string; task: TaskDTO }
  | { kind: "create"; id: string; title: string };

/** Revalidates every task/analytics key after a palette-driven write. */
function revalidateTasks() {
  void globalMutate(
    (key) =>
      typeof key === "string" &&
      (key.startsWith("/api/tasks") || key.startsWith("/api/analytics")),
    undefined,
    { revalidate: true },
  );
}

export function CommandPalette() {
  const router = useRouter();
  const open = useUiStore((state) => state.paletteOpen);
  const close = useUiStore((state) => state.closePalette);

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [creating, setCreating] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebounced("");
      setTasks([]);
      setActiveIndex(0);
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  // Debounce so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebounced(query.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open || debounced.length === 0) {
      setTasks([]);
      return;
    }

    const controller = new AbortController();
    setSearching(true);

    fetch(`/api/tasks?q=${encodeURIComponent(debounced)}&limit=6`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((payload: { data?: { tasks?: TaskDTO[] } }) => {
        setTasks(payload.data?.tasks ?? []);
      })
      .catch(() => {
        // Aborted or offline: leave the previous results rather than flashing.
      })
      .finally(() => setSearching(false));

    return () => controller.abort();
  }, [debounced, open]);

  const rows = useMemo<Row[]>(() => {
    const term = query.trim().toLowerCase();

    const navRows: Row[] = ALL_NAV.filter((item) =>
      term.length === 0 ? true : item.label.toLowerCase().includes(term),
    ).map((item) => ({
      kind: "nav" as const,
      id: `nav-${item.href}`,
      label: item.label,
      href: item.href,
    }));

    const taskRows: Row[] = tasks.map((task) => ({
      kind: "task" as const,
      id: `task-${task.id}`,
      task,
    }));

    const createRows: Row[] =
      query.trim().length >= 2
        ? [{ kind: "create" as const, id: "create", title: query.trim() }]
        : [];

    return [...taskRows, ...createRows, ...navRows];
  }, [query, tasks]);

  useEffect(() => {
    setActiveIndex(0);
  }, [rows.length]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const run = useCallback(
    async (row: Row) => {
      if (row.kind === "nav") {
        close();
        router.push(row.href);
        return;
      }

      if (row.kind === "task") {
        close();
        router.push("/tasks");
        return;
      }

      setCreating(true);
      try {
        await createTask({ title: row.title, priority: "MEDIUM" });
        toast.success("Tugas dibuat", row.title);
        revalidateTasks();
        close();
      } catch (error) {
        toast.error("Tugas gagal dibuat", describeError(error));
      } finally {
        setCreating(false);
      }
    },
    [close, router],
  );

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => (rows.length === 0 ? 0 : (index + 1) % rows.length));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) =>
          rows.length === 0 ? 0 : (index - 1 + rows.length) % rows.length,
        );
      } else if (event.key === "Home") {
        event.preventDefault();
        setActiveIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setActiveIndex(Math.max(0, rows.length - 1));
      } else if (event.key === "Enter") {
        event.preventDefault();
        const row = rows[activeIndex];
        if (row) void run(row);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, rows, activeIndex, close, run]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-start justify-center p-4 pt-[12vh]">
      <div
        className="absolute inset-0 bg-black/25 animate-fade-in"
        onClick={close}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className={cn(
          "relative flex w-full max-w-[560px] flex-col overflow-hidden",
          "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)]",
          "shadow-card animate-toast-in",
        )}
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-3.5">
          <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari tugas, tambah tugas baru, atau buka halaman…"
            aria-label="Cari atau jalankan perintah"
            aria-autocomplete="list"
            aria-controls="palette-list"
            className="h-12 w-full bg-transparent text-[0.9375rem] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
          {searching ? (
            <span className="shrink-0 text-[0.75rem] text-[var(--text-muted)]">
              mencari…
            </span>
          ) : null}
        </div>

        <div
          id="palette-list"
          ref={listRef}
          role="listbox"
          aria-label="Hasil"
          className="max-h-[min(420px,50vh)] overflow-y-auto p-1.5"
        >
          {rows.length === 0 ? (
            <p className="px-2.5 py-6 text-center text-[0.875rem] text-[var(--text-muted)]">
              Tidak ada hasil untuk &ldquo;{query}&rdquo;.
            </p>
          ) : (
            rows.map((row, index) => {
              const active = index === activeIndex;
              return (
                <button
                  key={row.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  data-index={index}
                  disabled={creating && row.kind === "create"}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => void run(row)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-left",
                    "transition-colors duration-150",
                    active ? "bg-[var(--bg-subtle)]" : "bg-transparent",
                  )}
                >
                  {row.kind === "create" ? (
                    <>
                      <Plus
                        className="h-4 w-4 shrink-0 text-[var(--accent)]"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate text-[0.875rem]">
                        Tambah tugas{" "}
                        <span className="font-medium">
                          &ldquo;{row.title}&rdquo;
                        </span>
                      </span>
                    </>
                  ) : row.kind === "task" ? (
                    <>
                      <Search
                        className="h-4 w-4 shrink-0 text-[var(--text-muted)]"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate text-[0.875rem]">
                        {row.task.title}
                      </span>
                      {row.task.motivationScore !== null ? (
                        <SteelScoreBadge score={row.task.motivationScore} />
                      ) : null}
                    </>
                  ) : (
                    <>
                      <CornerDownLeft
                        className="h-4 w-4 shrink-0 text-[var(--text-muted)]"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate text-[0.875rem]">
                        Buka {row.label}
                      </span>
                    </>
                  )}

                  {active ? (
                    <kbd className="shrink-0 rounded-[4px] border border-[var(--border)] px-1 font-mono text-[0.6875rem] text-[var(--text-muted)]">
                      Enter
                    </kbd>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2 text-[0.75rem] text-[var(--text-muted)]">
          <span>↑ ↓ pilih</span>
          <span>Enter jalankan</span>
          <span>Esc tutup</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
