"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Slider } from "@/components/ui/Slider";
import { describeError } from "@/lib/fetcher";
import { diagnoseTask } from "@/lib/hooks/useTasks";
import {
  SLIDER_META,
  calculateMotivation,
  riskLabel,
  scoreTone,
  type SteelScores,
} from "@/lib/steel-formula";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";
import type { TaskDTO } from "@/types/api";

const SCORE_TONES = {
  danger: "border-[color:var(--danger)]/25 bg-[var(--danger-bg)] text-[var(--danger)]",
  warning:
    "border-[color:var(--warning)]/25 bg-[var(--warning-bg)] text-[var(--warning)]",
  success:
    "border-[color:var(--success)]/25 bg-[var(--success-bg)] text-[var(--success)]",
};

export interface SteelDrawerProps {
  task: TaskDTO | null;
  onClose: () => void;
  onSaved: () => void;
}

export function SteelDrawer({ task, onClose, onSaved }: SteelDrawerProps) {
  const [scores, setScores] = useState<SteelScores>({
    expectancy: task?.expectancy ?? 5,
    value: task?.value ?? 5,
    impulsiveness: task?.impulsiveness ?? 5,
    delay: task?.delay ?? 5,
  });
  const [saving, setSaving] = useState(false);

  // Recomputed on every drag so the score and advice move with the sliders.
  const result = useMemo(() => calculateMotivation(scores), [scores]);
  const tone = scoreTone(result.score);

  if (!task) return null;

  async function save() {
    if (!task) return;
    setSaving(true);
    try {
      await diagnoseTask(task.id, scores);
      toast.success(
        "Skor motivasi disimpan",
        `Skor ${result.score}/100 — ${riskLabel(result.risk).toLowerCase()}.`,
      );
      onSaved();
      onClose();
    } catch (error) {
      toast.error("Skor gagal disimpan", describeError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Diagnosa motivasi"
      description="Temporal Motivation Theory — Steel, 2007"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button loading={saving} onClick={save}>
            Simpan skor
          </Button>
        </>
      }
    >
      <p className="mb-4 line-clamp-2 text-[0.875rem] font-medium">
        {task.title}
      </p>

      <div
        className={cn(
          "mb-5 flex items-center gap-4 rounded-[var(--radius-lg)] border p-4",
          SCORE_TONES[tone],
        )}
      >
        <span className="font-mono text-[2rem] font-semibold leading-none">
          {result.score}
        </span>
        <div className="min-w-0">
          <p className="text-[0.875rem] font-medium text-[var(--text-primary)]">
            {riskLabel(result.risk)}
          </p>
          <p className="font-mono text-[0.75rem] text-[var(--text-secondary)]">
            (E×V)/(I×D) = {result.rawRatio.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {SLIDER_META.map((meta) => (
          <Slider
            key={meta.key}
            label={`${meta.lever} — ${meta.label}`}
            question={meta.question}
            lowLabel={meta.low}
            highLabel={meta.high}
            inverted={meta.inverted}
            value={scores[meta.key]}
            onChange={(next) =>
              setScores((current) => ({ ...current, [meta.key]: next }))
            }
          />
        ))}
      </div>

      <div className="mt-6 border-t border-[var(--border)] pt-4">
        <h3 className="text-[0.9375rem] font-medium">Intervensi yang disarankan</h3>

        {result.interventions.length === 0 ? (
          <p className="mt-2 text-[0.8125rem] text-[var(--text-muted)]">
            Tidak ada variabel yang berada di zona kritis. Tugas ini seharusnya
            bisa langsung dikerjakan — mulai sesi fokus sekarang.
          </p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {result.interventions.map((item) => (
              <li
                key={item.lever}
                className={cn(
                  "rounded-[var(--radius)] border p-3",
                  item.priority === "primary"
                    ? "border-[var(--accent-border)] bg-[var(--accent-subtle)]"
                    : "border-[var(--border)] bg-[var(--bg-subtle)]",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] font-mono text-[0.75rem] font-medium",
                      item.priority === "primary"
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--bg-sunken)] text-[var(--text-secondary)]",
                    )}
                  >
                    {item.lever}
                  </span>
                  <p className="text-[0.875rem] font-medium">{item.label}</p>
                  {item.priority === "primary" ? (
                    <span className="ml-auto text-[0.6875rem] uppercase tracking-wider text-[var(--accent-hover)]">
                      Utama
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Drawer>
  );
}
