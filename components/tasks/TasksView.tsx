"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { QuickAdd } from "@/components/tasks/QuickAdd";
import { SkipTaskDialog } from "@/components/tasks/SkipTaskDialog";
import { SteelDrawer } from "@/components/tasks/SteelDrawer";
import { TaskFilter } from "@/components/tasks/TaskFilter";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskList } from "@/components/tasks/TaskList";
import { IntentionForm } from "@/components/intentions/IntentionForm";
import { startOfDayInTimezone } from "@/lib/date";
import { describeError } from "@/lib/fetcher";
import { useGoals } from "@/lib/hooks/useGoals";
import {
  completeTask,
  createTask,
  deleteTask,
  reorderTasks,
  skipTask,
  useTasks,
  type TaskFilters,
  type TaskView,
} from "@/lib/hooks/useTasks";
import { toast } from "@/lib/store/toast";
import type { TaskDTO } from "@/types/api";

const EMPTY_MESSAGES: Record<TaskView, string> = {
  today: "Tidak ada tugas untuk hari ini. Tambahkan satu yang bisa selesai dalam 25 menit.",
  all: "Belum ada tugas aktif. Pecah tujuanmu menjadi langkah konkret pertama.",
  overdue: "Tidak ada tugas yang terlambat. Pertahankan.",
  done: "Belum ada tugas yang selesai atau dilewati.",
};

export function TasksView({ timezone }: { timezone: string }) {
  const router = useRouter();

  const [view, setView] = useState<TaskView>("today");
  const [filters, setFilters] = useState<TaskFilters>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TaskDTO | undefined>();
  const [diagnosing, setDiagnosing] = useState<TaskDTO | null>(null);
  const [intending, setIntending] = useState<TaskDTO | null>(null);
  const [skipping, setSkipping] = useState<TaskDTO | null>(null);
  const [skipSaving, setSkipSaving] = useState(false);

  const { goals } = useGoals();
  const { tasks, counts, isLoading, error, mutate } = useTasks(view, filters);

  const dayStart = startOfDayInTimezone(new Date(), timezone);

  const refresh = useCallback(() => {
    void mutate();
  }, [mutate]);

  /** Optimistically patch one task in the cached list, rolling back on error. */
  const patchTask = useCallback(
    async (
      task: TaskDTO,
      optimistic: Partial<TaskDTO>,
      run: () => Promise<unknown>,
      failureTitle: string,
    ) => {
      await mutate(
        async (current) => {
          await run();
          return current;
        },
        {
          optimisticData: (current) =>
            current
              ? {
                  ...current,
                  tasks: current.tasks.map((item) =>
                    item.id === task.id ? { ...item, ...optimistic } : item,
                  ),
                }
              : current!,
          rollbackOnError: true,
          revalidate: true,
        },
      ).catch((cause) => {
        toast.error(failureTitle, describeError(cause));
      });
    },
    [mutate],
  );

  /** Deleting removes the row outright rather than patching its status. */
  const removeTask = useCallback(
    async (task: TaskDTO) => {
      await mutate(
        async (current) => {
          await deleteTask(task.id);
          return current;
        },
        {
          optimisticData: (current) =>
            current
              ? {
                  ...current,
                  tasks: current.tasks.filter((item) => item.id !== task.id),
                  total: Math.max(0, current.total - 1),
                }
              : current!,
          rollbackOnError: true,
          revalidate: true,
        },
      ).catch((cause) => {
        toast.error("Tugas gagal dihapus", describeError(cause));
      });
    },
    [mutate],
  );

  async function onQuickAdd(title: string) {
    try {
      // Quick-added tasks land on today's list, which is where you're looking.
      await createTask({
        title,
        priority: "MEDIUM",
        ...(view === "today" ? { dueDate: dayStart.toISOString() } : {}),
      });
      refresh();
    } catch (cause) {
      toast.error("Tugas gagal ditambahkan", describeError(cause));
    }
  }

  async function onReorder(ids: string[]) {
    await mutate(
      async (current) => {
        await reorderTasks(ids);
        return current;
      },
      {
        optimisticData: (current) =>
          current
            ? {
                ...current,
                tasks: ids
                  .map((id) => current.tasks.find((task) => task.id === id))
                  .filter((task): task is TaskDTO => Boolean(task)),
              }
            : current!,
        rollbackOnError: true,
        revalidate: false,
      },
    ).catch((cause) => {
      toast.error("Urutan gagal disimpan", describeError(cause));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          ariaLabel="Tampilan tugas"
          value={view}
          onChange={setView}
          items={[
            { value: "today", label: "Hari ini", count: counts.today },
            { value: "all", label: "Semua", count: counts.all },
            { value: "overdue", label: "Terlambat", count: counts.overdue },
            { value: "done", label: "Selesai", count: counts.done },
          ]}
        />

        <div className="flex items-center gap-2">
          <TaskFilter
            goals={goals}
            filters={filters}
            onChange={setFilters}
            open={filterOpen}
            onOpenChange={setFilterOpen}
          />
          <Button
            size="sm"
            icon={<Plus className="h-4 w-4" aria-hidden />}
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            Tugas baru
          </Button>
        </div>
      </div>

      <section className="lever-card overflow-hidden">
        {view !== "done" ? (
          <div className="border-b border-[var(--border)]">
            <QuickAdd
              open={quickAddOpen}
              onOpenChange={setQuickAddOpen}
              onSubmit={onQuickAdd}
            />
          </div>
        ) : null}

        {error ? (
          <div className="p-4">
            <p className="text-[0.875rem] text-[var(--danger)]">
              {describeError(error)}
            </p>
            <Button className="mt-3" size="sm" variant="ghost" onClick={refresh}>
              Coba lagi
            </Button>
          </div>
        ) : isLoading && tasks.length === 0 ? (
          <div className="space-y-3 p-3">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            message={EMPTY_MESSAGES[view]}
            action={
              // Every tab offers exactly one next step, never zero.
              view === "overdue" || view === "done" ? (
                <Button size="sm" variant="ghost" onClick={() => setView("today")}>
                  Lihat tugas hari ini
                </Button>
              ) : (
                <Button size="sm" onClick={() => setQuickAddOpen(true)}>
                  Tambah tugas
                </Button>
              )
            }
          />
        ) : (
          <TaskList
            tasks={tasks}
            timezone={timezone}
            reorderable={view === "today" || view === "all"}
            overdueBefore={dayStart}
            onReorder={onReorder}
            onToggleComplete={(task) =>
              patchTask(
                task,
                {
                  status: task.status === "DONE" ? "TODO" : "DONE",
                  completedAt:
                    task.status === "DONE" ? null : new Date().toISOString(),
                },
                () => completeTask(task.id),
                "Status tugas gagal diubah",
              )
            }
            onEdit={(task) => {
              setEditing(task);
              setFormOpen(true);
            }}
            onDiagnose={setDiagnosing}
            onSetIntention={setIntending}
            onSkip={setSkipping}
            onDelete={removeTask}
            onStartSession={(task) =>
              router.push(`/focus?taskId=${encodeURIComponent(task.id)}`)
            }
          />
        )}
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
          onSaved={refresh}
        />
      ) : null}

      {diagnosing ? (
        <SteelDrawer
          key={diagnosing.id}
          task={diagnosing}
          onClose={() => setDiagnosing(null)}
          onSaved={refresh}
        />
      ) : null}

      {intending ? (
        <IntentionForm
          key={intending.id}
          taskId={intending.id}
          taskTitle={intending.title}
          existing={intending.intention}
          onClose={() => setIntending(null)}
          onSaved={refresh}
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
            refresh();
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
