"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { describeError } from "@/lib/fetcher";
import { createTask, updateTask } from "@/lib/hooks/useTasks";
import { toast } from "@/lib/store/toast";
import { PRIORITY_OPTIONS, createTaskSchema } from "@/lib/validations/task";
import type { GoalDTO, Priority, TaskDTO } from "@/types/api";

export interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  task?: TaskDTO;
  goals: GoalDTO[];
  /** Pre-selects a goal when adding from a goal-filtered view. */
  defaultGoalId?: string | null;
}

/** `datetime-local` needs "YYYY-MM-DDTHH:mm" in local time, not an ISO string. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function TaskForm({
  open,
  onClose,
  onSaved,
  task,
  goals,
  defaultGoalId,
}: TaskFormProps) {
  const isEdit = Boolean(task);

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [goalId, setGoalId] = useState(
    task?.goal?.id ?? defaultGoalId ?? "none",
  );
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "MEDIUM");
  const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0, 10) ?? "");
  const [scheduledFor, setScheduledFor] = useState(
    toLocalInput(task?.scheduledFor ?? null),
  );
  const [estimate, setEstimate] = useState(
    task?.estimatedMinutes ? String(task.estimatedMinutes) : "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const payload = {
      title,
      description: description.trim() ? description : null,
      goalId: goalId === "none" ? null : goalId,
      priority,
      dueDate: dueDate || null,
      scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
      estimatedMinutes: estimate ? Number(estimate) : null,
    };

    const parsed = createTaskSchema.safeParse(payload);
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
      if (isEdit) await updateTask(task!.id, parsed.data);
      else await createTask(parsed.data);

      toast.success(isEdit ? "Tugas diperbarui" : "Tugas dibuat");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(
        isEdit ? "Tugas gagal diperbarui" : "Tugas gagal dibuat",
        describeError(error),
      );
    } finally {
      setSaving(false);
    }
  }

  const goalOptions = [
    { value: "none", label: "Tanpa tujuan", description: "Tidak terhubung ke North Star" },
    ...goals
      .filter((goal) => !goal.isArchived)
      .map((goal) => ({
        value: goal.id,
        label: goal.title.length > 52 ? `${goal.title.slice(0, 52)}…` : goal.title,
      })),
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Ubah tugas" : "Tugas baru"}
      description="Tugas yang terhubung ke tujuan lebih mudah dimulai."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button type="submit" form="task-form" loading={saving}>
            {isEdit ? "Simpan perubahan" : "Buat tugas"}
          </Button>
        </>
      }
    >
      <form id="task-form" className="space-y-4" onSubmit={onSubmit} noValidate>
        <Input
          label="Judul"
          placeholder="Menulis paragraf pertama bab 3"
          value={title}
          error={errors.title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <Textarea
          label="Deskripsi"
          placeholder="Langkah konkret pertama apa yang akan kamu lakukan?"
          value={description}
          maxLength={2000}
          error={errors.description}
          onChange={(event) => setDescription(event.target.value)}
        />

        <Select
          label="Tujuan"
          value={goalId}
          onChange={setGoalId}
          options={goalOptions}
          error={errors.goalId}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Prioritas"
            value={priority}
            onChange={setPriority}
            options={PRIORITY_OPTIONS.map((option) => ({ ...option }))}
          />

          <Input
            label="Estimasi (menit)"
            type="number"
            min={5}
            max={600}
            placeholder="25"
            value={estimate}
            error={errors.estimatedMinutes}
            onChange={(event) => setEstimate(event.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Deadline"
            type="date"
            value={dueDate}
            error={errors.dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />

          <Input
            label="Dijadwalkan"
            type="datetime-local"
            value={scheduledFor}
            hint="Kapan kamu berencana mengerjakannya."
            error={errors.scheduledFor}
            onChange={(event) => setScheduledFor(event.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
