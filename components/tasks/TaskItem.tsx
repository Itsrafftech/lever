"use client";

import { useState } from "react";
import {
  Activity,
  CalendarClock,
  GripVertical,
  Pencil,
  SkipForward,
  Target,
  Timer,
  Trash2,
  Waypoints,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { SteelScoreBadge } from "@/components/tasks/SteelScoreBadge";
import { formatShortDate, formatTime } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { TaskDTO } from "@/types/api";

const PRIORITY_DOTS: Record<string, string> = {
  LOW: "bg-[var(--text-muted)]",
  MEDIUM: "bg-[#C98A2E]",
  HIGH: "bg-[var(--accent)]",
  URGENT: "bg-[var(--danger)]",
};

const PRIORITY_TITLES: Record<string, string> = {
  LOW: "Prioritas rendah",
  MEDIUM: "Prioritas sedang",
  HIGH: "Prioritas tinggi",
  URGENT: "Prioritas mendesak",
};

export interface TaskItemProps {
  task: TaskDTO;
  timezone: string;
  isOverdue?: boolean;
  draggable?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onToggleComplete: (task: TaskDTO) => void;
  onEdit: (task: TaskDTO) => void;
  onDiagnose: (task: TaskDTO) => void;
  onSetIntention: (task: TaskDTO) => void;
  onSkip: (task: TaskDTO) => void;
  onDelete: (task: TaskDTO) => void;
  onStartSession: (task: TaskDTO) => void;
  onDragStart?: (event: React.DragEvent<HTMLLIElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLLIElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLLIElement>) => void;
  onDragEnd?: () => void;
}

export function TaskItem({
  task,
  timezone,
  isOverdue,
  draggable,
  isDragging,
  isDropTarget,
  onToggleComplete,
  onEdit,
  onDiagnose,
  onSetIntention,
  onSkip,
  onDelete,
  onStartSession,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: TaskItemProps) {
  const [expanded, setExpanded] = useState(false);

  const done = task.status === "DONE";
  const skipped = task.status === "SKIPPED";
  const closed = done || skipped;

  return (
    <li
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "group border-b border-[var(--border)] last:border-b-0",
        "transition-colors duration-150",
        isDragging && "opacity-40",
        isDropTarget && "border-t-2 border-t-[var(--accent)]",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-subtle)]",
          expanded && "bg-[var(--bg-subtle)]",
        )}
      >
        {draggable ? (
          <span
            aria-hidden
            className="cursor-grab text-[var(--text-disabled)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </span>
        ) : null}

        <Checkbox
          checked={done}
          disabled={skipped}
          ariaLabel={
            done ? `Batalkan penyelesaian ${task.title}` : `Selesaikan ${task.title}`
          }
          onChange={() => onToggleComplete(task)}
        />

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="min-w-0 flex-1 text-left"
        >
          <span
            className={cn(
              "block truncate text-[0.875rem]",
              closed
                ? "text-[var(--text-muted)] line-through decoration-[var(--text-disabled)]"
                : "text-[var(--text-primary)]",
            )}
          >
            {task.title}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          {task.intention ? (
            <Waypoints
              className="h-3.5 w-3.5 text-[var(--text-muted)]"
              aria-label="Punya niat jika-maka"
            />
          ) : null}

          <span
            title={PRIORITY_TITLES[task.priority]}
            aria-label={PRIORITY_TITLES[task.priority]}
            className={cn(
              "h-2 w-2 rounded-full",
              PRIORITY_DOTS[task.priority] ?? PRIORITY_DOTS.MEDIUM,
            )}
          />

          {task.dueDate ? (
            <span
              className={cn(
                "hidden font-mono text-[0.75rem] sm:inline",
                isOverdue && !closed
                  ? "text-[var(--danger)]"
                  : "text-[var(--text-muted)]",
              )}
            >
              {formatShortDate(new Date(task.dueDate), timezone)}
            </span>
          ) : null}

          {task.motivationScore !== null ? (
            <SteelScoreBadge score={task.motivationScore} />
          ) : null}

          <ContextMenu
            ariaLabel={`Aksi untuk ${task.title}`}
            items={[
              {
                label: "Ubah tugas",
                icon: <Pencil className="h-4 w-4" aria-hidden />,
                onSelect: () => onEdit(task),
              },
              {
                label: task.intention ? "Ubah niat jika-maka" : "Set niat jika-maka",
                icon: <Waypoints className="h-4 w-4" aria-hidden />,
                onSelect: () => onSetIntention(task),
              },
              {
                label: "Diagnose (Steel)",
                icon: <Activity className="h-4 w-4" aria-hidden />,
                onSelect: () => onDiagnose(task),
              },
              {
                label: "Mulai sesi fokus",
                icon: <Timer className="h-4 w-4" aria-hidden />,
                disabled: closed,
                onSelect: () => onStartSession(task),
              },
              {
                label: "Lewati tugas",
                icon: <SkipForward className="h-4 w-4" aria-hidden />,
                disabled: skipped,
                separated: true,
                onSelect: () => onSkip(task),
              },
              {
                label: "Hapus",
                icon: <Trash2 className="h-4 w-4" aria-hidden />,
                tone: "danger",
                onSelect: () => onDelete(task),
              },
            ]}
          />
        </div>
      </div>

      {expanded ? (
        <div className="space-y-3 border-t border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-3 pl-11">
          {task.description ? (
            <p className="whitespace-pre-wrap text-[0.8125rem] text-[var(--text-secondary)]">
              {task.description}
            </p>
          ) : (
            <p className="text-[0.8125rem] text-[var(--text-muted)]">
              Belum ada deskripsi.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            {task.goal ? (
              <Badge tone="accent">
                <Target className="mr-1 h-3 w-3" aria-hidden />
                {task.goal.title.length > 40
                  ? `${task.goal.title.slice(0, 40)}…`
                  : task.goal.title}
              </Badge>
            ) : (
              <Badge tone="neutral">Tanpa tujuan</Badge>
            )}

            {task.estimatedMinutes ? (
              <Badge tone="neutral">Estimasi {task.estimatedMinutes}m</Badge>
            ) : null}

            {task.focusSessionCount > 0 ? (
              <Badge tone="neutral">{task.focusSessionCount} sesi fokus</Badge>
            ) : null}

            {task.scheduledFor ? (
              <Badge tone="neutral">
                <CalendarClock className="mr-1 h-3 w-3" aria-hidden />
                {formatShortDate(new Date(task.scheduledFor), timezone)}{" "}
                {formatTime(new Date(task.scheduledFor), timezone)}
              </Badge>
            ) : null}

            {skipped && task.skippedReason ? (
              <Badge tone="warning">Dilewati: {task.skippedReason}</Badge>
            ) : null}
          </div>

          {task.intention ? (
            <div className="rounded-[var(--radius)] border border-[var(--accent-border)] bg-[var(--accent-subtle)] p-2.5">
              <p className="text-[0.8125rem] leading-relaxed text-[var(--text-primary)]">
                <span className="font-medium">Jika</span> {task.intention.ifClause}
                {", "}
                <span className="font-medium">maka</span>{" "}
                {task.intention.thenClause}
              </p>
            </div>
          ) : null}

          {task.motivationScore !== null ? (
            <div className="flex flex-wrap items-center gap-3 font-mono text-[0.75rem] text-[var(--text-secondary)]">
              <span>E {task.expectancy}</span>
              <span>V {task.value}</span>
              <span>I {task.impulsiveness}</span>
              <span>D {task.delay}</span>
              <span className="text-[var(--text-muted)]">
                skor {task.motivationScore}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
