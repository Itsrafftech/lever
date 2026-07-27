"use client";

import Link from "next/link";
import useSWR from "swr";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ChartFrame } from "@/components/analytics/ChartFrame";
import { CompletionChart } from "@/components/analytics/CompletionChart";
import { FocusMinutesChart } from "@/components/analytics/FocusMinutesChart";
import { InsightCard, ComparisonRow } from "@/components/analytics/InsightCard";
import { PeakHoursChart } from "@/components/analytics/PeakHoursChart";
import { SkipReasonsChart } from "@/components/analytics/SkipReasonsChart";
import { SteelDistribution } from "@/components/analytics/SteelDistribution";
import { StreakCalendar } from "@/components/analytics/StreakCalendar";
import { TimeToStartChart } from "@/components/analytics/TimeToStartChart";
import { describeError, fetcher } from "@/lib/fetcher";
import { useInsights, useThirtyDays } from "@/lib/hooks/useAnalytics";

interface SummaryResponse {
  streak: number;
}

export function AnalyticsView() {
  const { data, error, isLoading } = useThirtyDays();
  const { data: insights, isLoading: insightsLoading } = useInsights();
  const { data: summary } = useSWR<SummaryResponse>(
    "/api/analytics/summary",
    fetcher,
    { revalidateOnFocus: false },
  );

  if (error) {
    return (
      <div className="lever-card p-4">
        <p className="text-[0.875rem] text-[var(--danger)]">
          {describeError(error)}
        </p>
        <Button
          className="mt-3"
          size="sm"
          variant="ghost"
          onClick={() => window.location.reload()}
        >
          Muat ulang
        </Button>
      </div>
    );
  }

  const days = data?.days ?? [];

  // Nothing has happened yet: seven empty charts communicate less than one
  // sentence explaining what will fill them.
  const hasAnyData =
    days.some(
      (day) =>
        day.tasksPlanned > 0 ||
        day.tasksCompleted > 0 ||
        day.focusMinutes > 0 ||
        day.sessionsStarted > 0,
    ) || (data?.scoredTaskCount ?? 0) > 0;

  if (!isLoading && data && !hasAnyData) {
    return (
      <div className="lever-card">
        <EmptyState
          message="Belum ada data untuk dianalisis. Selesaikan satu tugas atau jalankan satu sesi fokus, lalu grafik 30 hari akan mulai terisi."
          action={
            <Link
              href="/focus"
              className="inline-flex h-8 items-center rounded-[var(--radius)] bg-[var(--accent)] px-3 text-[0.8125rem] font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
            >
              Mulai sesi fokus
            </Link>
          }
        />
      </div>
    );
  }

  const hasCompletion = days.some((day) => day.tasksPlanned > 0);
  const hasStartData = days.some((day) => day.avgTimeToStartSecs !== null);
  const hasFocus = days.some((day) => day.focusMinutes > 0);
  const hasHours = (data?.hours ?? []).some((hour) => hour.procrastination > 0);
  const hasSkips = (data?.skipReasons ?? []).some((reason) => reason.count > 0);
  const hasScores = (data?.scoredTaskCount ?? 0) > 0;

  const adherenceDays = days.filter((day) => day.scheduleAdherence !== null);
  const adherenceAverage =
    adherenceDays.length > 0
      ? Math.round(
          adherenceDays.reduce(
            (sum, day) => sum + (day.scheduleAdherence ?? 0),
            0,
          ) / adherenceDays.length,
        )
      : null;

  return (
    <div className="space-y-5">
      <p className="text-[0.8125rem] text-[var(--text-secondary)]">
        Rentang 30 hari terakhir
        {data?.from && data?.to ? (
          <span className="font-mono text-[var(--text-muted)]">
            {" "}
            ({data.from} — {data.to})
          </span>
        ) : null}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartFrame
          title="Tingkat penyelesaian"
          description="Persentase tugas yang direncanakan dan benar-benar selesai, per hari."
          loading={isLoading}
          hasData={hasCompletion}
          emptyMessage="Belum ada tugas dengan deadline atau jadwal dalam 30 hari terakhir."
        >
          <CompletionChart days={days} />
        </ChartFrame>

        <ChartFrame
          title="Time-to-start"
          description="Jeda antara waktu rencana dan waktu mulai. Semakin rendah, semakin baik."
          loading={isLoading}
          hasData={hasStartData}
          emptyMessage="Belum ada sesi fokus yang dimulai. Metrik ini muncul setelah sesi pertama."
          aside={
            adherenceAverage !== null ? (
              <span className="text-[0.8125rem] text-[var(--text-secondary)]">
                Kepatuhan jadwal{" "}
                <span className="font-mono text-[var(--text-primary)]">
                  {adherenceAverage}%
                </span>
              </span>
            ) : null
          }
        >
          <TimeToStartChart days={days} />
        </ChartFrame>

        <ChartFrame
          title="Menit fokus per hari"
          description="Total waktu sesi Pomodoro dan deep work yang benar-benar berjalan."
          loading={isLoading}
          hasData={hasFocus}
          emptyMessage="Belum ada waktu fokus tercatat dalam 30 hari terakhir."
        >
          <FocusMinutesChart days={days} />
        </ChartFrame>

        <ChartFrame
          title="Jam rawan menunda"
          description="Tugas dilewati dan sesi yang mulai lebih dari 30 menit terlambat, per jam."
          loading={isLoading}
          hasData={hasHours}
          emptyMessage="Belum ada pola menunda yang terdeteksi. Ini kabar baik."
        >
          <PeakHoursChart hours={data?.hours ?? []} />
        </ChartFrame>

        <ChartFrame
          title="Alasan melewati tugas"
          description="Dikelompokkan dari alasan yang kamu pilih saat melewati tugas."
          loading={isLoading}
          hasData={hasSkips}
          emptyMessage="Belum ada tugas yang dilewati dalam 30 hari terakhir."
        >
          <SkipReasonsChart reasons={data?.skipReasons ?? []} />
        </ChartFrame>

        <ChartFrame
          title="Distribusi skor Steel"
          description="Sebaran skor motivasi di semua tugas yang sudah didiagnosa."
          loading={isLoading}
          hasData={hasScores}
          emptyMessage="Belum ada tugas yang didiagnosa. Jalankan Diagnose (Steel) dari menu tugas."
          aside={
            data ? (
              <span className="text-[0.8125rem] text-[var(--text-secondary)]">
                <span className="font-mono text-[var(--text-primary)]">
                  {data.scoredTaskCount}
                </span>{" "}
                didiagnosa ·{" "}
                <span className="font-mono text-[var(--text-primary)]">
                  {data.unscoredTaskCount}
                </span>{" "}
                belum
              </span>
            ) : null
          }
        >
          <SteelDistribution buckets={data?.scoreDistribution ?? []} />
        </ChartFrame>
      </div>

      <ChartFrame
        title="Kalender streak"
        description="Intensitas warna mengikuti total menit fokus setiap hari."
        loading={isLoading}
        hasData={days.length > 0}
        emptyMessage="Belum ada data untuk ditampilkan."
      >
        <StreakCalendar days={days} currentStreak={summary?.streak ?? 0} />
      </ChartFrame>

      <section>
        <h2 className="text-[1.125rem] font-semibold">Minggu ini vs minggu lalu</h2>
        <div className="lever-card mt-3 overflow-hidden">
          {insightsLoading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-6 w-full" />
              ))}
            </div>
          ) : (
            (insights?.comparisons ?? []).map((metric) => (
              <ComparisonRow key={metric.key} metric={metric} />
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-[1.125rem] font-semibold">Temuan</h2>
        {insightsLoading ? (
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {[0, 1].map((index) => (
              <Skeleton
                key={index}
                className="h-24 w-full rounded-[var(--radius-lg)]"
              />
            ))}
          </div>
        ) : (insights?.insights ?? []).length === 0 ? (
          <p className="mt-3 text-[0.875rem] text-[var(--text-muted)]">
            Belum cukup data untuk menarik kesimpulan. Temuan muncul setelah
            beberapa hari pemakaian.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {(insights?.insights ?? []).map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
