"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { describeError, mutateJson } from "@/lib/fetcher";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";
import { DAY_LABELS, createIntentionSchema } from "@/lib/validations/intention";
import type { IntentionDTO } from "@/types/api";

export interface IntentionFormProps {
  taskId: string;
  taskTitle: string;
  existing?: IntentionDTO | null;
  onClose: () => void;
  onSaved: () => void;
}

export function IntentionForm({
  taskId,
  taskTitle,
  existing,
  onClose,
  onSaved,
}: IntentionFormProps) {
  const [ifClause, setIfClause] = useState(existing?.ifClause ?? "");
  const [thenClause, setThenClause] = useState(existing?.thenClause ?? "");
  const [atTime, setAtTime] = useState(existing?.atTime ?? "");
  const [days, setDays] = useState<number[]>(existing?.daysOfWeek ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function toggleDay(day: number) {
    setDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort(),
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const parsed = createIntentionSchema.safeParse({
      taskId,
      ifClause,
      thenClause,
      atTime: atTime || null,
      daysOfWeek: days,
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setSaving(true);
    try {
      await mutateJson("/api/intentions", "POST", parsed.data);
      toast.success(
        existing ? "Niat diperbarui" : "Niat jika-maka dibuat",
        "Rencana yang spesifik jauh lebih mungkin dijalankan.",
      );
      onSaved();
      onClose();
    } catch (error) {
      toast.error("Niat gagal disimpan", describeError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={existing ? "Ubah niat jika-maka" : "Niat jika-maka"}
      description="Implementation intention menghubungkan situasi konkret dengan tindakan konkret."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button type="submit" form="intention-form" loading={saving}>
            Simpan niat
          </Button>
        </>
      }
    >
      <p className="mb-4 truncate text-[0.875rem] font-medium">{taskTitle}</p>

      <form
        id="intention-form"
        className="space-y-4"
        onSubmit={onSubmit}
        noValidate
      >
        <Textarea
          label="Jika…"
          placeholder="saya sudah duduk di meja kerja dan laptop terbuka"
          value={ifClause}
          maxLength={240}
          error={errors.ifClause}
          onChange={(event) => setIfClause(event.target.value)}
          className="min-h-[60px]"
        />

        <Textarea
          label="…maka saya akan"
          placeholder="langsung membuka dokumen bab 3 dan menulis satu paragraf selama 25 menit"
          value={thenClause}
          maxLength={240}
          error={errors.thenClause}
          onChange={(event) => setThenClause(event.target.value)}
          className="min-h-[60px]"
        />

        <Input
          label="Jam"
          type="time"
          value={atTime}
          error={errors.atTime}
          hint="Opsional. Dipakai untuk menghitung tingkat aktivasi."
          onChange={(event) => setAtTime(event.target.value)}
        />

        <div>
          <span className="mb-1.5 block text-[0.8125rem] font-medium text-[var(--text-secondary)]">
            Hari
          </span>
          <div className="flex flex-wrap gap-1.5">
            {DAY_LABELS.map((day) => {
              const active = days.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  aria-pressed={active}
                  aria-label={day.full}
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    "h-8 w-11 rounded-[var(--radius)] border text-[0.8125rem]",
                    "transition-colors duration-150 lever-focus-ring",
                    active
                      ? "border-[var(--accent)] bg-[var(--accent-subtle)] font-medium text-[var(--accent-hover)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]",
                  )}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[0.8125rem] text-[var(--text-muted)]">
            Kosongkan untuk niat harian.
          </p>
        </div>

        <p className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-subtle)] p-2.5 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
          Implementation intentions meningkatkan follow-through rata-rata 40–50%
          dibanding niat biasa. — Gollwitzer, 1999
        </p>
      </form>
    </Modal>
  );
}
