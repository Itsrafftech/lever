"use client";

import { Filter, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { PRIORITY_OPTIONS } from "@/lib/validations/task";
import type { TaskFilters } from "@/lib/hooks/useTasks";
import type { GoalDTO } from "@/types/api";

export interface TaskFilterProps {
  goals: GoalDTO[];
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toggle(list: string[] | undefined, value: string): string[] {
  const current = list ?? [];
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-sm)] border px-2 py-1 text-[0.8125rem]",
        "transition-colors duration-150 lever-focus-ring",
        active
          ? "border-[var(--accent)] bg-[var(--accent-subtle)] font-medium text-[var(--accent-hover)]"
          : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]",
      )}
    >
      {children}
    </button>
  );
}

export function TaskFilter({
  goals,
  filters,
  onChange,
  open,
  onOpenChange,
}: TaskFilterProps) {
  const activeCount =
    (filters.goalIds?.length ?? 0) +
    (filters.priorities?.length ?? 0) +
    (filters.hasScore ? 1 : 0);

  return (
    <div>
      <Button
        size="sm"
        variant="ghost"
        icon={<Filter className="h-4 w-4" aria-hidden />}
        onClick={() => onOpenChange(!open)}
      >
        Filter
        {activeCount > 0 ? (
          <span className="ml-1 rounded-[4px] bg-[var(--accent)] px-1 font-mono text-[0.6875rem] text-white">
            {activeCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="mt-3 space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          <div>
            <p className="mb-2 text-[0.8125rem] font-medium text-[var(--text-secondary)]">
              Tujuan
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Chip
                active={filters.goalIds?.includes("none") ?? false}
                onClick={() =>
                  onChange({ ...filters, goalIds: toggle(filters.goalIds, "none") })
                }
              >
                Tanpa tujuan
              </Chip>
              {goals
                .filter((goal) => !goal.isArchived)
                .map((goal) => (
                  <Chip
                    key={goal.id}
                    active={filters.goalIds?.includes(goal.id) ?? false}
                    onClick={() =>
                      onChange({
                        ...filters,
                        goalIds: toggle(filters.goalIds, goal.id),
                      })
                    }
                  >
                    {goal.title.length > 28
                      ? `${goal.title.slice(0, 28)}…`
                      : goal.title}
                  </Chip>
                ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[0.8125rem] font-medium text-[var(--text-secondary)]">
              Prioritas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITY_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  active={filters.priorities?.includes(option.value) ?? false}
                  onClick={() =>
                    onChange({
                      ...filters,
                      priorities: toggle(filters.priorities, option.value),
                    })
                  }
                >
                  {option.label}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[0.8125rem] font-medium text-[var(--text-secondary)]">
              Skor Steel
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Chip
                active={filters.hasScore === "true"}
                onClick={() =>
                  onChange({
                    ...filters,
                    hasScore: filters.hasScore === "true" ? undefined : "true",
                  })
                }
              >
                Sudah didiagnosa
              </Chip>
              <Chip
                active={filters.hasScore === "false"}
                onClick={() =>
                  onChange({
                    ...filters,
                    hasScore: filters.hasScore === "false" ? undefined : "false",
                  })
                }
              >
                Belum didiagnosa
              </Chip>
            </div>
          </div>

          {activeCount > 0 ? (
            <Button
              size="sm"
              variant="ghost"
              icon={<X className="h-4 w-4" aria-hidden />}
              onClick={() => onChange({})}
            >
              Hapus semua filter
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
