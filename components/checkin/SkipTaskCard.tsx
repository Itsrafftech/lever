"use client";

import { useState } from "react";
import { CalendarPlus, Check, SkipForward, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { SKIP_REASONS } from "@/lib/validations/task";

export interface UnfinishedTask {
  id: string;
  title: string;
  status: string;
  priority: string;
}

export type CheckinResolution =
  | { kind: "tomorrow" }
  | { kind: "delete" }
  | { kind: "skip"; reason: string };

export interface SkipTaskCardProps {
  task: UnfinishedTask;
  resolution: CheckinResolution | null;
  onResolve: (resolution: CheckinResolution | null) => void;
}

export function SkipTaskCard({ task, resolution, onResolve }: SkipTaskCardProps) {
  const [pickingReason, setPickingReason] = useState(false);

  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border p-3 transition-colors duration-150",
        resolution
          ? "border-[var(--border)] bg-[var(--bg-subtle)]"
          : "border-[var(--border)]",
      )}
    >
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 text-[0.875rem] text-[var(--text-primary)]">
          {task.title}
        </p>
        {resolution ? (
          <span className="flex shrink-0 items-center gap-1 text-[0.75rem] text-[var(--success)]">
            <Check className="h-3.5 w-3.5" aria-hidden />
            {resolution.kind === "tomorrow"
              ? "Besok"
              : resolution.kind === "delete"
                ? "Dihapus"
                : "Dilewati"}
          </span>
        ) : null}
      </div>

      {resolution ? (
        <Button
          className="mt-2"
          size="sm"
          variant="link"
          onClick={() => {
            onResolve(null);
            setPickingReason(false);
          }}
        >
          Ubah
        </Button>
      ) : pickingReason ? (
        <div className="mt-2 space-y-1.5">
          <p className="text-[0.8125rem] text-[var(--text-muted)]">
            Kenapa dilewati?
          </p>
          {SKIP_REASONS.map((reason) => (
            <button
              key={reason.value}
              type="button"
              onClick={() => {
                onResolve({ kind: "skip", reason: reason.value });
                setPickingReason(false);
              }}
              className="block w-full rounded-[var(--radius-sm)] border border-[var(--border)] px-2.5 py-1.5 text-left text-[0.8125rem] text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            >
              {reason.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            icon={<CalendarPlus className="h-3.5 w-3.5" aria-hidden />}
            onClick={() => onResolve({ kind: "tomorrow" })}
          >
            Pindah ke besok
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<SkipForward className="h-3.5 w-3.5" aria-hidden />}
            onClick={() => setPickingReason(true)}
          >
            Tandai skip
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
            onClick={() => onResolve({ kind: "delete" })}
          >
            Hapus
          </Button>
        </div>
      )}
    </div>
  );
}
