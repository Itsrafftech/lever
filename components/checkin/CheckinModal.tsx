"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import {
  SkipTaskCard,
  type CheckinResolution,
  type UnfinishedTask,
} from "@/components/checkin/SkipTaskCard";
import { addDays, formatDuration, formatLongDate, formatSeconds } from "@/lib/date";
import { describeError, mutateJson } from "@/lib/fetcher";
import { deleteTask, skipTask, updateTask } from "@/lib/hooks/useTasks";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";

export interface CheckinTodayData {
  date: string;
  tasksPlanned: number;
  tasksCompleted: number;
  focusMinutes: number;
  avgTimeToStartSecs: number | null;
  unfinished: UnfinishedTask[];
  submitted: boolean;
}

export interface CheckinModalProps {
  today: CheckinTodayData;
  timezone: string;
  onClose: () => void;
  onSaved: () => void;
}

function Scale({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[0.8125rem] font-medium text-[var(--text-secondary)]">
        {label}
      </span>
      <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={label}>
        {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={value === score}
            onClick={() => onChange(score)}
            className={cn(
              "h-8 w-8 rounded-[var(--radius-sm)] border font-mono text-[0.8125rem]",
              "transition-colors duration-150 lever-focus-ring",
              value === score
                ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]",
            )}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CheckinModal({
  today,
  timezone,
  onClose,
  onSaved,
}: CheckinModalProps) {
  const [resolutions, setResolutions] = useState<
    Record<string, CheckinResolution | null>
  >({});
  const [energy, setEnergy] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const unresolved = today.unfinished.filter((task) => !resolutions[task.id]);

  async function save() {
    setSaving(true);
    try {
      // Apply each task decision before snapshotting the day's numbers.
      const tomorrow = addDays(new Date(`${today.date}T00:00:00.000Z`), 1);

      for (const task of today.unfinished) {
        const resolution = resolutions[task.id];
        if (!resolution) continue;

        if (resolution.kind === "tomorrow") {
          await updateTask(task.id, { dueDate: tomorrow.toISOString() });
        } else if (resolution.kind === "delete") {
          await deleteTask(task.id);
        } else {
          await skipTask(task.id, resolution.reason);
        }
      }

      await mutateJson("/api/checkins", "POST", {
        date: today.date,
        energyLevel: energy,
        focusQuality: focus,
        note: note.trim() || null,
      });

      toast.success("Refleksi tersimpan", "Sampai besok.");
      onSaved();
    } catch (error) {
      toast.error("Refleksi gagal disimpan", describeError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      title="Refleksi singkat"
      description={formatLongDate(
        new Date(`${today.date}T12:00:00.000Z`),
        timezone,
      )}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Nanti saja
          </Button>
          <Button loading={saving} onClick={save}>
            Selesai — simpan refleksi
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[var(--radius)] border border-[var(--border)] p-3">
          <p className="font-mono text-[1.25rem]">
            {today.tasksCompleted}
            <span className="text-[var(--text-muted)]">/{today.tasksPlanned}</span>
          </p>
          <p className="mt-0.5 text-[0.75rem] text-[var(--text-muted)]">
            Tugas selesai
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-[var(--border)] p-3">
          <p className="font-mono text-[1.25rem]">
            {formatDuration(today.focusMinutes)}
          </p>
          <p className="mt-0.5 text-[0.75rem] text-[var(--text-muted)]">
            Waktu fokus
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-[var(--border)] p-3">
          <p className="font-mono text-[1.25rem]">
            {today.avgTimeToStartSecs === null
              ? "—"
              : formatSeconds(today.avgTimeToStartSecs)}
          </p>
          <p className="mt-0.5 text-[0.75rem] text-[var(--text-muted)]">
            Time-to-start
          </p>
        </div>
      </div>

      {today.unfinished.length > 0 ? (
        <div className="mt-5">
          <p className="mb-2 text-[0.875rem] font-medium">
            Tugas yang belum selesai
            {unresolved.length > 0 ? (
              <span className="ml-1.5 font-normal text-[var(--text-muted)]">
                ({unresolved.length} belum diputuskan)
              </span>
            ) : null}
          </p>
          <div className="space-y-2">
            {today.unfinished.map((task) => (
              <SkipTaskCard
                key={task.id}
                task={task}
                resolution={resolutions[task.id] ?? null}
                onResolve={(resolution) =>
                  setResolutions((current) => ({
                    ...current,
                    [task.id]: resolution,
                  }))
                }
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        <Scale label="Energi hari ini" value={energy} onChange={setEnergy} />
        <Scale label="Kualitas fokus" value={focus} onChange={setFocus} />

        <Textarea
          label="Catatan singkat"
          placeholder="Satu kalimat: apa yang paling menghambat hari ini?"
          value={note}
          maxLength={1000}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>
    </Modal>
  );
}
