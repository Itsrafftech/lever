"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";
import { SKIP_REASONS } from "@/lib/validations/task";
import type { TaskDTO } from "@/types/api";

export interface SkipTaskDialogProps {
  task: TaskDTO | null;
  onClose: () => void;
  onConfirm: (reason: string, note?: string) => void;
  saving?: boolean;
}

export function SkipTaskDialog({
  task,
  onClose,
  onConfirm,
  saving,
}: SkipTaskDialogProps) {
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState("");

  if (!task) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title="Kenapa tugas ini dilewati?"
      description="Alasannya dipakai di analitik untuk menemukan pola penundaan."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button
            variant="danger"
            disabled={!reason}
            loading={saving}
            onClick={() => onConfirm(reason, note.trim() || undefined)}
          >
            Tandai dilewati
          </Button>
        </>
      }
    >
      <p className="mb-3 truncate text-[0.875rem] font-medium">{task.title}</p>

      <div className="space-y-1.5" role="radiogroup" aria-label="Alasan melewati">
        {SKIP_REASONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={reason === option.value}
            onClick={() => setReason(option.value)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-[var(--radius)] border px-3 py-2 text-left",
              "text-[0.875rem] transition-colors duration-150",
              reason === option.value
                ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--text-primary)]"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                reason === option.value
                  ? "border-[var(--accent)]"
                  : "border-[var(--border-strong)]",
              )}
            >
              {reason === option.value ? (
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              ) : null}
            </span>
            {option.label}
          </button>
        ))}
      </div>

      {reason === "OTHER" || reason === "TOO_BIG" ? (
        <Textarea
          className="mt-3 min-h-[60px]"
          label="Catatan"
          placeholder={
            reason === "TOO_BIG"
              ? "Bagian mana yang terasa paling berat?"
              : "Apa yang terjadi?"
          }
          value={note}
          maxLength={300}
          onChange={(event) => setNote(event.target.value)}
        />
      ) : null}
    </Modal>
  );
}
