"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";
import { formatDuration } from "@/lib/date";
import { describeError } from "@/lib/fetcher";
import { completeSession } from "@/lib/hooks/useSessions";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";
import type { FocusSessionDTO } from "@/types/api";

export interface PostSessionProps {
  session: FocusSessionDTO;
  onDone: (options: { scheduleNext: boolean }) => void;
  onCancel: () => void;
}

export function PostSession({ session, onDone, onCancel }: PostSessionProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [completeTask, setCompleteTask] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save(scheduleNext: boolean) {
    setSaving(true);
    try {
      const result = await completeSession(session.id, {
        rating,
        notes: notes.trim() || null,
        completeTask,
      });
      toast.success(
        "Sesi selesai",
        `${formatDuration(result.elapsedMinutes)} waktu fokus tercatat.`,
      );
      onDone({ scheduleNext });
    } catch (error) {
      toast.error("Sesi gagal disimpan", describeError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      dismissable={false}
      title="Bagaimana sesi ini?"
      description="Refleksi singkat — 15 detik cukup."
      onClose={onCancel}
      footer={
        <>
          <Button
            variant="ghost"
            disabled={saving}
            onClick={() => save(true)}
          >
            Jadwalkan sesi berikutnya
          </Button>
          <Button loading={saving} onClick={() => save(false)}>
            Simpan refleksi
          </Button>
        </>
      }
    >
      <p className="mb-4 truncate text-[0.875rem] font-medium">
        {session.task?.title ?? "Sesi tanpa tugas spesifik"}
      </p>

      <div>
        <span className="mb-1.5 block text-[0.8125rem] font-medium text-[var(--text-secondary)]">
          Kualitas sesi
        </span>
        <div className="flex gap-1" role="radiogroup" aria-label="Nilai sesi">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} dari 5`}
              onClick={() => setRating(value)}
              className="rounded-[var(--radius-sm)] p-1 transition-colors duration-150 hover:bg-[var(--bg-subtle)] lever-focus-ring"
            >
              <Star
                className={cn(
                  "h-6 w-6",
                  rating !== null && value <= rating
                    ? "fill-[var(--accent)] text-[var(--accent)]"
                    : "text-[var(--text-disabled)]",
                )}
                aria-hidden
              />
            </button>
          ))}
        </div>
      </div>

      <Textarea
        className="mt-4"
        label="Catatan"
        placeholder="Apa yang membantu, apa yang mengganggu?"
        value={notes}
        maxLength={1000}
        onChange={(event) => setNotes(event.target.value)}
      />

      {session.task ? (
        <div className="mt-4 rounded-[var(--radius)] border border-[var(--border)] p-3">
          <Toggle
            checked={completeTask}
            onChange={setCompleteTask}
            label="Tugas selesai?"
            description={session.task.title}
          />
        </div>
      ) : null}
    </Modal>
  );
}
