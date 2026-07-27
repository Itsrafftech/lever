"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { describeError } from "@/lib/fetcher";
import { createGoal, updateGoal } from "@/lib/hooks/useGoals";
import { toast } from "@/lib/store/toast";
import {
  GOAL_CATEGORY_OPTIONS,
  MAX_GOAL_TITLE,
  createGoalSchema,
} from "@/lib/validations/goal";
import type { GoalCategory, GoalDTO } from "@/types/api";

export interface GoalFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: (goal: GoalDTO) => void;
  /** Present when editing; absent when creating. */
  goal?: GoalDTO;
}

export function GoalForm({ open, onClose, onSaved, goal }: GoalFormProps) {
  const isEdit = Boolean(goal);

  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [category, setCategory] = useState<GoalCategory>(
    goal?.category ?? "PERSONAL",
  );
  const [targetDate, setTargetDate] = useState(
    goal?.targetDate ? goal.targetDate.slice(0, 10) : "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const parsed = createGoalSchema.safeParse({
      title,
      description: description.trim() ? description : null,
      category,
      targetDate: targetDate || null,
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
      const saved = isEdit
        ? await updateGoal(goal!.id, parsed.data)
        : await createGoal(parsed.data);

      toast.success(
        isEdit ? "Tujuan diperbarui" : "Tujuan dibuat",
        isEdit ? undefined : "Pecah menjadi tugas 15 menit agar mudah dimulai.",
      );
      onSaved(saved);
      onClose();
    } catch (error) {
      toast.error(
        isEdit ? "Tujuan gagal diperbarui" : "Tujuan gagal dibuat",
        describeError(error),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Ubah tujuan" : "Tujuan baru"}
      description="Satu kalimat yang jelas. Tujuan yang kabur tidak menarik tindakan."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button type="submit" form="goal-form" loading={saving}>
            {isEdit ? "Simpan perubahan" : "Buat tujuan"}
          </Button>
        </>
      }
    >
      <form id="goal-form" className="space-y-4" onSubmit={onSubmit} noValidate>
        <Textarea
          label="Judul tujuan"
          placeholder="Menyelesaikan thesis S2 sebelum Oktober 2026"
          value={title}
          maxLength={MAX_GOAL_TITLE}
          showCount
          error={errors.title}
          onChange={(event) => setTitle(event.target.value)}
          className="min-h-[64px]"
        />

        <Select
          label="Kategori"
          value={category}
          onChange={setCategory}
          options={GOAL_CATEGORY_OPTIONS.map((option) => ({ ...option }))}
        />

        <Input
          label="Target tanggal"
          type="date"
          value={targetDate}
          error={errors.targetDate}
          hint="Opsional. Deadline yang konkret menurunkan variabel Delay."
          onChange={(event) => setTargetDate(event.target.value)}
        />

        <Textarea
          label="Catatan"
          placeholder="Kenapa ini penting? Apa yang berubah kalau selesai?"
          value={description}
          maxLength={600}
          showCount
          error={errors.description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </form>
    </Modal>
  );
}
