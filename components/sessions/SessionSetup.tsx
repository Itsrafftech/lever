"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { describeError, mutateJson } from "@/lib/fetcher";
import { createSession, startSession } from "@/lib/hooks/useSessions";
import { useTasks } from "@/lib/hooks/useTasks";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";
import {
  DURATION_PRESETS,
  ENVIRONMENT_CHECKLIST,
} from "@/lib/validations/session";
import type { FocusSessionDTO } from "@/types/api";

export interface SessionSetupProps {
  initialTaskId?: string;
  initialChecklist: string[];
  onStarted: (session: FocusSessionDTO) => void;
}

export function SessionSetup({
  initialTaskId,
  initialChecklist,
  onStarted,
}: SessionSetupProps) {
  const { tasks, isLoading } = useTasks("all");

  const [taskId, setTaskId] = useState(initialTaskId ?? "none");
  const [durationMins, setDurationMins] = useState(25);
  const [customMins, setCustomMins] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [ifClause, setIfClause] = useState("");
  const [thenClause, setThenClause] = useState("");
  const [checked, setChecked] = useState<string[]>(initialChecklist);
  const [starting, setStarting] = useState(false);

  // plannedStart is fixed the moment setup opens; the gap between it and the
  // click on "Mulai sesi" is exactly the time-to-start metric.
  const plannedStartRef = useRef(new Date().toISOString());

  const selectedTask = tasks.find((task) => task.id === taskId);

  useEffect(() => {
    if (!selectedTask?.intention) return;
    setIfClause(selectedTask.intention.ifClause);
    setThenClause(selectedTask.intention.thenClause);
  }, [selectedTask]);

  const effectiveDuration = useCustom ? Number(customMins) || 0 : durationMins;

  const sessionType = useMemo(() => {
    if (effectiveDuration <= 10) return "QUICK" as const;
    if (effectiveDuration <= 25) return "POMODORO" as const;
    return "DEEP_WORK" as const;
  }, [effectiveDuration]);

  const durationValid = effectiveDuration >= 5 && effectiveDuration <= 180;

  async function start() {
    if (!durationValid) return;
    setStarting(true);

    try {
      const intentionText =
        ifClause.trim() && thenClause.trim()
          ? `Jika ${ifClause.trim()}, maka ${thenClause.trim()}`
          : null;

      const created = await createSession({
        taskId: taskId === "none" ? null : taskId,
        type: sessionType,
        durationMins: effectiveDuration,
        plannedStart: plannedStartRef.current,
        intentionText,
      });

      const started = await startSession(created.id);

      // Remember the checklist so the next session starts pre-filled.
      void mutateJson("/api/settings", "PATCH", { focusChecklist: checked }).catch(
        () => undefined,
      );

      onStarted(started);
    } catch (error) {
      toast.error("Sesi gagal dimulai", describeError(error));
    } finally {
      setStarting(false);
    }
  }

  const taskOptions = [
    {
      value: "none",
      label: "Sesi tanpa tugas spesifik",
      description: "Waktu fokus tetap tercatat",
    },
    ...tasks.map((task) => ({
      value: task.id,
      label: task.title.length > 52 ? `${task.title.slice(0, 52)}…` : task.title,
      description: task.goal?.title ?? undefined,
    })),
  ];

  return (
    <div className="mx-auto max-w-[560px] space-y-5">
      <section className="lever-card p-5">
        <h2 className="text-[1.125rem] font-semibold">1. Pilih tugas</h2>
        <p className="mt-0.5 text-[0.8125rem] text-[var(--text-muted)]">
          Satu sesi, satu tugas. Memilih lebih dari satu memecah perhatian.
        </p>
        <div className="mt-3">
          <Select
            label="Tugas"
            value={taskId}
            onChange={setTaskId}
            options={taskOptions}
            disabled={isLoading}
          />
        </div>
      </section>

      <section className="lever-card p-5">
        <h2 className="text-[1.125rem] font-semibold">2. Durasi</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {DURATION_PRESETS.map((preset) => {
            const active = !useCustom && durationMins === preset.minutes;
            return (
              <button
                key={preset.minutes}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setUseCustom(false);
                  setDurationMins(preset.minutes);
                }}
                className={cn(
                  "rounded-[var(--radius)] border px-3 py-2 text-left transition-colors duration-150",
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
                    : "border-[var(--border)] hover:bg-[var(--bg-subtle)]",
                )}
              >
                <span
                  className={cn(
                    "block font-mono text-[0.875rem]",
                    active
                      ? "text-[var(--accent-hover)]"
                      : "text-[var(--text-primary)]",
                  )}
                >
                  {preset.label}
                </span>
                <span className="block text-[0.75rem] text-[var(--text-muted)]">
                  {preset.hint}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            aria-pressed={useCustom}
            onClick={() => setUseCustom(true)}
            className={cn(
              "rounded-[var(--radius)] border px-3 py-2 text-left transition-colors duration-150",
              useCustom
                ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
                : "border-[var(--border)] hover:bg-[var(--bg-subtle)]",
            )}
          >
            <span className="block text-[0.875rem]">Custom</span>
            <span className="block text-[0.75rem] text-[var(--text-muted)]">
              5–180 menit
            </span>
          </button>
        </div>

        {useCustom ? (
          <div className="mt-3">
            <Input
              label="Durasi (menit)"
              type="number"
              min={5}
              max={180}
              value={customMins}
              placeholder="90"
              error={
                customMins && !durationValid
                  ? "Durasi harus antara 5 dan 180 menit."
                  : undefined
              }
              onChange={(event) => setCustomMins(event.target.value)}
            />
          </div>
        ) : null}
      </section>

      <section className="lever-card p-5">
        <h2 className="text-[1.125rem] font-semibold">3. Niat jika-maka</h2>
        <p className="mt-0.5 text-[0.8125rem] text-[var(--text-muted)]">
          {selectedTask?.intention
            ? "Diambil dari niat yang tersimpan pada tugas ini."
            : "Opsional, tapi ini yang membuat langkah pertama otomatis."}
        </p>

        <div className="mt-3 space-y-3">
          <Textarea
            label="Jika saya…"
            placeholder="duduk di meja kerja dengan laptop terbuka"
            value={ifClause}
            maxLength={240}
            onChange={(event) => setIfClause(event.target.value)}
            className="min-h-[56px]"
          />
          <Textarea
            label="…maka saya akan"
            placeholder="membuka dokumen bab 3 dan menulis satu paragraf di 10 menit pertama"
            value={thenClause}
            maxLength={240}
            onChange={(event) => setThenClause(event.target.value)}
            className="min-h-[56px]"
          />
        </div>
      </section>

      <section className="lever-card p-5">
        <h2 className="text-[1.125rem] font-semibold">4. Siapkan lingkungan</h2>
        <p className="mt-0.5 text-[0.8125rem] text-[var(--text-muted)]">
          Menurunkan variabel Impulsiveness sebelum sesi dimulai.
        </p>

        <div className="mt-3 space-y-2.5">
          {ENVIRONMENT_CHECKLIST.map((item) => (
            <Checkbox
              key={item.id}
              checked={checked.includes(item.id)}
              label={item.label}
              onChange={(next) =>
                setChecked((current) =>
                  next
                    ? [...current, item.id]
                    : current.filter((id) => id !== item.id),
                )
              }
            />
          ))}
        </div>
      </section>

      <Button
        size="lg"
        fullWidth
        loading={starting}
        disabled={!durationValid}
        icon={<Play className="h-4 w-4" aria-hidden />}
        onClick={start}
      >
        Mulai sesi
      </Button>
    </div>
  );
}
