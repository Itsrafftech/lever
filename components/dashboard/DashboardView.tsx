"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ChevronDown, Play } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { CheckinTrigger } from "@/components/checkin/CheckinTrigger";
import {
  DayTimeline,
  eventsToEntries,
  sessionsToEntries,
} from "@/components/calendar/DayTimeline";
import { ReconnectBanner } from "@/components/calendar/ReconnectBanner";
import { StatTile } from "@/components/dashboard/StatTile";
import { WeeklyChart, type WeeklyPoint } from "@/components/dashboard/WeeklyChart";
import { GoalBanner } from "@/components/goals/GoalBanner";
import { TaskList } from "@/components/tasks/TaskList";
import { SkipTaskDialog } from "@/components/tasks/SkipTaskDialog";
import { SteelDrawer } from "@/components/tasks/SteelDrawer";
import { IntentionForm } from "@/components/intentions/IntentionForm";
import { TaskForm } from "@/components/tasks/TaskForm";
import { addDays, formatDuration, formatSeconds, startOfDayInTimezone } from "@/lib/date";
import { describeError, fetcher } from "@/lib/fetcher";
import { useCalendarEvents } from "@/lib/hooks/useCalendar";
import { useGoals } from "@/lib/hooks/useGoals";
import { useSessions } from "@/lib/hooks/useSessions";
import { completeTask, skipTask, useTasks } from "@/lib/hooks/useTasks";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";
import type { TaskDTO } from "@/types/api";

interface SummaryResponse {
  date: string;
  tasksPlanned: number;
  tasksCompleted: number;
  focusMinutes: number;
  avgTimeToStartSecs: number | null;
  streak: number;
  weekly: WeeklyPoint[];
}

export function DashboardView({ timezone }: { timezone: string }) {
  const dayStart = startOfDayInTimezone(new Date(), timezone);

  const { goals, pinnedGoal, isLoading: goalsLoading } = useGoals();
  const {
    tasks: todayTasks,
    isLoading: tasksLoading,
    mutate: mutateTasks,
  } = useTasks("today");
  const { tasks: overdueTasks, mutate: mutateOverdue } = useTasks("overdue");
  const { sessions } = useSessions(
    `from=${dayStart.toISOString()}&to=${addDays(dayStart, 1).toISOString()}`,
  );
  const { events, status: calendarStatus } = useCalendarEvents(7);
  const { data: summary, isLoading: summaryLoading, mutate: mutateSummary } =
    useSWR<SummaryResponse>("/api/analytics/summary", fetcher, {
      revalidateOnFocus: false,
    });

  const [overdueOpen, setOverdueOpen] = useState(false);
  const [editing, setEditing] = useState<TaskDTO | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [diagnosing, setDiagnosing] = useState<TaskDTO | null>(null);
  const [intending, setIntending] = useState<TaskDTO | null>(null);
  const [skipping, setSkipping] = useState<TaskDTO | null>(null);
  const [skipSaving, setSkipSaving] = useState(false);

  function refreshAll() {
    void mutateTasks();
    void mutateOverdue();
    void mutateSummary();
  }

  async function onToggleComplete(task: TaskDTO) {
    await mutateTasks(
      async (current) => {
        await completeTask(task.id);
        return current;
      },
      {
        optimisticData: (current) =>
          current
            ? {
                ...current,
                tasks: current.tasks.map((item) =>
                  item.id === task.id
                    ? {
                        ...item,
                        status: item.status === "DONE" ? "TODO" : "DONE",
                      }
                    : item,
                ),
              }
            : current!,
        rollbackOnError: true,
        revalidate: true,
      },
    ).catch((cause) =>
      toast.error("Status tugas gagal diubah", describeError(cause)),
    );
    void mutateSummary();
  }

  const taskHandlers = {
    onToggleComplete,
    onEdit: (task: TaskDTO) => {
      setEditing(task);
      setFormOpen(true);
    },
    onDiagnose: setDiagnosing,
    onSetIntention: setIntending,
    onSkip: setSkipping,
    onDelete: (task: TaskDTO) => setSkipping(task),
    onStartSession: (task: TaskDTO) => {
      window.location.href = `/focus?taskId=${encodeURIComponent(task.id)}`;
    },
  };

  return (
    <div className="space-y-5">
      <ReconnectBanner
        show={Boolean(calendarStatus?.needsReconnect)}
        callbackUrl="/dashboard"
      />

      <GoalBanner goal={pinnedGoal} isLoading={goalsLoading} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Tugas selesai hari ini"
          loading={summaryLoading}
          value={
            <>
              {summary?.tasksCompleted ?? 0}
              <span className="text-[var(--text-muted)]">
                /{Math.max(summary?.tasksPlanned ?? 0, summary?.tasksCompleted ?? 0)}
              </span>
            </>
          }
        />
        <StatTile
          label="Waktu fokus"
          loading={summaryLoading}
          value={formatDuration(summary?.focusMinutes ?? 0)}
        />
        <StatTile
          label="Time-to-start rata-rata"
          loading={summaryLoading}
          value={
            summary?.avgTimeToStartSecs === null ||
            summary?.avgTimeToStartSecs === undefined
              ? "—"
              : formatSeconds(summary.avgTimeToStartSecs)
          }
          hint="Jeda antara rencana dan mulai"
        />
        <StatTile
          label="Streak"
          loading={summaryLoading}
          value={`${summary?.streak ?? 0} hari`}
          hint="Hari beruntun dengan sesi selesai"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="min-w-0 space-y-4 lg:col-span-3">
          <section className="lever-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <h2 className="text-[1.125rem] font-semibold">Tugas hari ini</h2>
              <Link
                href="/tasks"
                className="text-[0.8125rem] text-[var(--accent)] underline-offset-4 hover:underline"
              >
                Semua tugas
              </Link>
            </div>

            {tasksLoading && todayTasks.length === 0 ? (
              <div className="space-y-2 p-3">
                {[0, 1, 2].map((index) => (
                  <Skeleton key={index} className="h-8 w-full" />
                ))}
              </div>
            ) : todayTasks.length === 0 ? (
              <EmptyState
                message="Tidak ada tugas untuk hari ini. Pilih satu langkah kecil dari North Star kamu."
                action={
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditing(undefined);
                      setFormOpen(true);
                    }}
                  >
                    Tambah tugas
                  </Button>
                }
              />
            ) : (
              <TaskList
                tasks={todayTasks}
                timezone={timezone}
                overdueBefore={dayStart}
                {...taskHandlers}
              />
            )}
          </section>

          {overdueTasks.length > 0 ? (
            <section className="lever-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOverdueOpen((value) => !value)}
                aria-expanded={overdueOpen}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors duration-150 hover:bg-[var(--bg-subtle)]"
              >
                <span className="flex items-center gap-2 text-[1.125rem] font-semibold">
                  Terlambat
                  <span className="rounded-[4px] bg-[var(--danger-bg)] px-1.5 font-mono text-[0.75rem] font-normal text-[var(--danger)]">
                    {overdueTasks.length}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-[var(--text-muted)] transition-transform duration-150",
                    overdueOpen && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>

              {overdueOpen ? (
                <div className="border-t border-[var(--border)]">
                  <TaskList
                    tasks={overdueTasks}
                    timezone={timezone}
                    overdueBefore={dayStart}
                    {...taskHandlers}
                  />
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        <div className="min-w-0 space-y-4 lg:col-span-2">
          <section className="lever-card overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-3">
              <h2 className="text-[1.125rem] font-semibold">Jadwal hari ini</h2>
              <CheckinTrigger timezone={timezone} />
            </div>

            <DayTimeline
              entries={[
                ...sessionsToEntries(sessions),
                ...eventsToEntries(events, dayStart, addDays(dayStart, 1)),
              ]}
              timezone={timezone}
            />

            <div className="flex flex-wrap gap-2 border-t border-[var(--border)] p-3">
              <Link
                href="/focus"
                className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius)] bg-[var(--accent)] px-3 text-[0.8125rem] font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
              >
                <Play className="h-3.5 w-3.5" aria-hidden />
                Mulai sesi
              </Link>
              <Link
                href="/tasks"
                className="inline-flex h-8 items-center rounded-[var(--radius)] border border-[var(--border)] px-3 text-[0.8125rem] text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-subtle)]"
              >
                Jadwalkan sesi baru
              </Link>
            </div>
          </section>
        </div>
      </div>

      <section className="lever-card p-4">
        <h2 className="text-[1.125rem] font-semibold">Tugas selesai 7 hari terakhir</h2>
        <div className="mt-3">
          {summaryLoading || !summary ? (
            <Skeleton className="h-[180px] w-full" />
          ) : (
            <WeeklyChart data={summary.weekly} />
          )}
        </div>
      </section>

      {formOpen ? (
        <TaskForm
          key={editing?.id ?? "new"}
          open={formOpen}
          task={editing}
          goals={goals}
          onClose={() => {
            setFormOpen(false);
            setEditing(undefined);
          }}
          onSaved={refreshAll}
        />
      ) : null}

      {diagnosing ? (
        <SteelDrawer
          key={diagnosing.id}
          task={diagnosing}
          onClose={() => setDiagnosing(null)}
          onSaved={refreshAll}
        />
      ) : null}

      {intending ? (
        <IntentionForm
          key={intending.id}
          taskId={intending.id}
          taskTitle={intending.title}
          existing={intending.intention}
          onClose={() => setIntending(null)}
          onSaved={refreshAll}
        />
      ) : null}

      <SkipTaskDialog
        task={skipping}
        saving={skipSaving}
        onClose={() => setSkipping(null)}
        onConfirm={async (reason, note) => {
          if (!skipping) return;
          setSkipSaving(true);
          try {
            await skipTask(skipping.id, reason, note);
            toast.success("Tugas ditandai dilewati");
            setSkipping(null);
            refreshAll();
          } catch (cause) {
            toast.error("Tugas gagal dilewati", describeError(cause));
          } finally {
            setSkipSaving(false);
          }
        }}
      />
    </div>
  );
}
