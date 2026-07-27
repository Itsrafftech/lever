"use client";

import { Archive, ArchiveRestore, Pencil, Pin, PinOff } from "lucide-react";

import {
  Badge,
  GOAL_CATEGORY_LABELS,
  GOAL_CATEGORY_TONES,
} from "@/components/ui/Badge";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { GoalProgress } from "@/components/goals/GoalProgress";
import { formatShortDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { GoalDTO } from "@/types/api";

export interface GoalCardProps {
  goal: GoalDTO;
  timezone: string;
  onEdit: (goal: GoalDTO) => void;
  onProgressChange: (goal: GoalDTO, progress: number) => void;
  onTogglePin: (goal: GoalDTO) => void;
  onToggleArchive: (goal: GoalDTO) => void;
}

export function GoalCard({
  goal,
  timezone,
  onEdit,
  onProgressChange,
  onTogglePin,
  onToggleArchive,
}: GoalCardProps) {
  return (
    <article
      className={cn(
        "lever-card flex flex-col gap-3 p-4 transition-colors duration-150",
        goal.isArchived && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={GOAL_CATEGORY_TONES[goal.category] ?? "neutral"}>
            {GOAL_CATEGORY_LABELS[goal.category] ?? goal.category}
          </Badge>
          {goal.isPinned ? <Badge tone="accent">North Star</Badge> : null}
          {goal.isArchived ? <Badge tone="neutral">Diarsipkan</Badge> : null}
        </div>

        <ContextMenu
          ariaLabel={`Aksi untuk ${goal.title}`}
          items={[
            {
              label: "Ubah tujuan",
              icon: <Pencil className="h-4 w-4" aria-hidden />,
              onSelect: () => onEdit(goal),
            },
            {
              label: goal.isPinned ? "Lepas dari North Star" : "Jadikan North Star",
              icon: goal.isPinned ? (
                <PinOff className="h-4 w-4" aria-hidden />
              ) : (
                <Pin className="h-4 w-4" aria-hidden />
              ),
              disabled: goal.isArchived,
              onSelect: () => onTogglePin(goal),
            },
            {
              label: goal.isArchived ? "Aktifkan kembali" : "Arsipkan",
              icon: goal.isArchived ? (
                <ArchiveRestore className="h-4 w-4" aria-hidden />
              ) : (
                <Archive className="h-4 w-4" aria-hidden />
              ),
              tone: goal.isArchived ? "default" : "danger",
              separated: true,
              onSelect: () => onToggleArchive(goal),
            },
          ]}
        />
      </div>

      <h3 className="text-[0.9375rem] font-medium leading-snug text-[var(--text-primary)]">
        {goal.title}
      </h3>

      {goal.description ? (
        <p className="line-clamp-2 text-[0.8125rem] text-[var(--text-secondary)]">
          {goal.description}
        </p>
      ) : null}

      <GoalProgress
        value={goal.progress}
        disabled={goal.isArchived}
        onCommit={(progress) => onProgressChange(goal, progress)}
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--border)] pt-3 text-[0.8125rem] text-[var(--text-muted)]">
        <span>
          {goal.activeTaskCount > 0
            ? `${goal.activeTaskCount} tugas aktif`
            : "Belum ada tugas aktif"}
        </span>
        {goal.targetDate ? (
          <span>Target {formatShortDate(new Date(goal.targetDate), timezone)}</span>
        ) : null}
        <span className="ml-auto">
          Diperbarui {formatShortDate(new Date(goal.updatedAt), timezone)}
        </span>
      </div>
    </article>
  );
}
