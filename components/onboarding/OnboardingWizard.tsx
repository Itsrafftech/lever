"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Globe } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { describeError, mutateJson } from "@/lib/fetcher";
import { createGoal } from "@/lib/hooks/useGoals";
import { toast } from "@/lib/store/toast";
import { TIMEZONES, guessTimezone } from "@/lib/timezones";
import { cn } from "@/lib/utils";
import {
  GOAL_CATEGORY_OPTIONS,
  MAX_GOAL_TITLE,
  createGoalSchema,
} from "@/lib/validations/goal";
import type { GoalCategory } from "@/types/api";

const STEPS = [
  { id: 1, label: "North Star" },
  { id: 2, label: "Zona waktu" },
  { id: 3, label: "Kalender" },
] as const;

export interface OnboardingWizardProps {
  initialTimezone: string;
  /** True when the account already has at least one goal (e.g. re-entry). */
  hasGoal: boolean;
  calendarConnected: boolean;
}

export function OnboardingWizard({
  initialTimezone,
  hasGoal,
  calendarConnected,
}: OnboardingWizardProps) {
  const router = useRouter();

  const [step, setStep] = useState(hasGoal ? 2 : 1);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GoalCategory>("PERSONAL");
  const [targetDate, setTargetDate] = useState("");
  const [goalErrors, setGoalErrors] = useState<Record<string, string>>({});

  const [timezone, setTimezone] = useState(initialTimezone);

  useEffect(() => {
    // Only pre-fill from the browser when the account is still on the default.
    if (initialTimezone === "Asia/Jakarta") setTimezone(guessTimezone());
  }, [initialTimezone]);

  async function submitGoal() {
    setGoalErrors({});
    const parsed = createGoalSchema.safeParse({
      title,
      description: description.trim() ? description : null,
      category,
      targetDate: targetDate || null,
      isPinned: true,
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setGoalErrors(next);
      return;
    }

    setBusy(true);
    try {
      await createGoal(parsed.data);
      setStep(2);
    } catch (error) {
      toast.error("Tujuan gagal disimpan", describeError(error));
    } finally {
      setBusy(false);
    }
  }

  async function submitTimezone() {
    setBusy(true);
    try {
      await mutateJson("/api/settings", "PATCH", { timezone });
      setStep(3);
    } catch (error) {
      toast.error("Zona waktu gagal disimpan", describeError(error));
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setBusy(true);
    try {
      await mutateJson("/api/settings", "PATCH", { markOnboarded: true });
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setBusy(false);
      toast.error("Onboarding gagal diselesaikan", describeError(error));
    }
  }

  return (
    <div className="w-full max-w-[480px]">
      <ol className="mb-6 flex items-center gap-2" aria-label="Langkah onboarding">
        {STEPS.map((item) => {
          const done = item.id < step;
          const active = item.id === step;
          return (
            <li key={item.id} className="flex flex-1 items-center gap-2">
              <span
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.75rem] font-medium",
                  done && "border-[var(--success)] bg-[var(--success)] text-white",
                  active &&
                    "border-[var(--accent)] bg-[var(--accent)] text-white",
                  !done &&
                    !active &&
                    "border-[var(--border-strong)] text-[var(--text-muted)]",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : item.id}
              </span>
              <span
                className={cn(
                  "hidden truncate text-[0.8125rem] sm:block",
                  active
                    ? "font-medium text-[var(--text-primary)]"
                    : "text-[var(--text-muted)]",
                )}
              >
                {item.label}
              </span>
              {item.id !== STEPS.length ? (
                <span
                  aria-hidden
                  className={cn(
                    "h-px flex-1",
                    done ? "bg-[var(--success)]" : "bg-[var(--border)]",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="lever-card p-5">
        {step === 1 ? (
          <>
            <h1 className="text-[1.5rem] font-semibold">Tentukan North Star</h1>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--text-muted)]">
              Satu kalimat tentang apa yang ingin kamu capai. Tugas yang
              terhubung ke tujuan bermakna punya nilai Value lebih tinggi — dan
              itu variabel yang paling menurunkan dorongan menunda.
            </p>

            <div className="mt-5 space-y-4">
              <Textarea
                label="Tujuan utama"
                placeholder="Menyelesaikan thesis S2 sebelum Oktober 2026"
                value={title}
                maxLength={MAX_GOAL_TITLE}
                showCount
                error={goalErrors.title}
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
                hint="Opsional, tapi deadline konkret menurunkan variabel Delay."
                onChange={(event) => setTargetDate(event.target.value)}
              />

              <Textarea
                label="Kenapa ini penting?"
                placeholder="Apa yang berubah dalam hidupmu kalau ini selesai?"
                value={description}
                maxLength={600}
                error={goalErrors.description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <Button
              className="mt-5"
              size="lg"
              fullWidth
              loading={busy}
              iconRight={<ArrowRight className="h-4 w-4" aria-hidden />}
              onClick={submitGoal}
            >
              Simpan dan lanjut
            </Button>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h1 className="text-[1.5rem] font-semibold">Zona waktu</h1>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--text-muted)]">
              Menentukan kapan harimu dimulai dan berakhir. Semua statistik
              harian — streak, time-to-start, check-in — dihitung memakai zona
              ini.
            </p>

            <div className="mt-5">
              <Select
                label="Zona waktu"
                value={timezone}
                onChange={setTimezone}
                options={TIMEZONES.map((zone) => ({
                  value: zone.value,
                  label: zone.label,
                  description: zone.description,
                }))}
              />
            </div>

            <div className="mt-5 flex gap-2">
              <Button
                variant="ghost"
                size="lg"
                disabled={busy || hasGoal}
                icon={<ArrowLeft className="h-4 w-4" aria-hidden />}
                onClick={() => setStep(1)}
              >
                Kembali
              </Button>
              <Button
                size="lg"
                fullWidth
                loading={busy}
                iconRight={<ArrowRight className="h-4 w-4" aria-hidden />}
                onClick={submitTimezone}
              >
                Simpan dan lanjut
              </Button>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h1 className="text-[1.5rem] font-semibold">Google Calendar</h1>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--text-muted)]">
              Menghubungkan kalender membuat sesi fokus muncul sebagai acara,
              dan mendeteksi bentrok saat kamu menjadwalkan sesi baru. Ini
              opsional — semua fitur lain tetap berfungsi tanpanya.
            </p>

            {calendarConnected ? (
              <div className="mt-5 flex items-center gap-2 rounded-[var(--radius)] border border-[color:var(--success)]/25 bg-[var(--success-bg)] p-3">
                <Check
                  className="h-4 w-4 shrink-0 text-[var(--success)]"
                  aria-hidden
                />
                <p className="text-[0.8125rem]">
                  Kalender sudah terhubung lewat akun Google kamu.
                </p>
              </div>
            ) : (
              <Button
                className="mt-5"
                variant="ghost"
                size="lg"
                fullWidth
                disabled={busy}
                icon={<Globe className="h-[18px] w-[18px]" aria-hidden />}
                onClick={() => {
                  toast.info(
                    "Hubungkan lewat Pengaturan",
                    "Integrasi kalender diaktifkan di halaman Pengaturan > Kalender setelah onboarding selesai.",
                  );
                }}
              >
                Hubungkan Google Calendar
              </Button>
            )}

            <div className="mt-5 flex gap-2">
              <Button
                variant="ghost"
                size="lg"
                disabled={busy}
                icon={<ArrowLeft className="h-4 w-4" aria-hidden />}
                onClick={() => setStep(2)}
              >
                Kembali
              </Button>
              <Button size="lg" fullWidth loading={busy} onClick={finish}>
                {calendarConnected ? "Selesai" : "Lewati dulu"}
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
