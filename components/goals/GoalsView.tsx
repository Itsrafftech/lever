"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { GoalBanner } from "@/components/goals/GoalBanner";
import { GoalCard } from "@/components/goals/GoalCard";
import { GoalForm } from "@/components/goals/GoalForm";
import { describeError } from "@/lib/fetcher";
import { archiveGoal, updateGoal, useGoals } from "@/lib/hooks/useGoals";
import { toast } from "@/lib/store/toast";
import type { GoalDTO } from "@/types/api";

type View = "active" | "archived";

export function GoalsView({ timezone }: { timezone: string }) {
  const [view, setView] = useState<View>("active");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GoalDTO | undefined>();

  const { goals, remaining, limit, pinnedGoal, isLoading, error, mutate } =
    useGoals(true);

  const activeGoals = goals.filter((goal) => !goal.isArchived);
  const archivedGoals = goals.filter((goal) => goal.isArchived);
  const visible = view === "active" ? activeGoals : archivedGoals;
  const atLimit = remaining <= 0;

  /** Applies a server call with an optimistic local patch and rollback. */
  async function applyPatch(
    goal: GoalDTO,
    patch: Partial<GoalDTO>,
    run: () => Promise<GoalDTO>,
    failureTitle: string,
  ) {
    await mutate(
      async (current) => {
        const saved = await run();
        const next = (current?.goals ?? []).map((item) =>
          item.id === saved.id
            ? saved
            : // Pinning is exclusive: clear the flag everywhere else.
              patch.isPinned && item.isPinned
              ? { ...item, isPinned: false }
              : item,
        );
        const activeCount = next.filter((item) => !item.isArchived).length;
        return {
          goals: next,
          limit: current?.limit ?? limit,
          remaining: Math.max(0, (current?.limit ?? limit) - activeCount),
        };
      },
      {
        optimisticData: (current) => {
          const next = (current?.goals ?? []).map((item) =>
            item.id === goal.id
              ? { ...item, ...patch }
              : patch.isPinned && item.isPinned
                ? { ...item, isPinned: false }
                : item,
          );
          const activeCount = next.filter((item) => !item.isArchived).length;
          return {
            goals: next,
            limit: current?.limit ?? limit,
            remaining: Math.max(0, (current?.limit ?? limit) - activeCount),
          };
        },
        rollbackOnError: true,
        revalidate: false,
      },
    ).catch((cause) => {
      toast.error(failureTitle, describeError(cause));
    });
  }

  return (
    <div className="space-y-5">
      <GoalBanner goal={pinnedGoal} isLoading={isLoading} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          variant="segmented"
          ariaLabel="Tampilan tujuan"
          value={view}
          onChange={setView}
          items={[
            { value: "active", label: "Aktif", count: activeGoals.length },
            { value: "archived", label: "Arsip", count: archivedGoals.length },
          ]}
        />

        <div className="flex items-center gap-3">
          <span className="text-[0.8125rem] text-[var(--text-muted)]">
            {activeGoals.length}/{limit} tujuan aktif
          </span>
          <Button
            size="sm"
            disabled={atLimit}
            icon={<Plus className="h-4 w-4" aria-hidden />}
            title={
              atLimit
                ? `Batas ${limit} tujuan aktif tercapai. Arsipkan salah satu dulu.`
                : undefined
            }
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            Tujuan baru
          </Button>
        </div>
      </div>

      {error ? (
        <div className="lever-card p-4">
          <p className="text-[0.875rem] text-[var(--danger)]">
            {describeError(error)}
          </p>
          <Button className="mt-3" size="sm" variant="ghost" onClick={() => mutate()}>
            Coba lagi
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1].map((index) => (
            <div key={index} className="lever-card space-y-3 p-4">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-1.5 w-full" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="lever-card">
          <EmptyState
            message={
              view === "active"
                ? "Belum ada tujuan. Mulai dengan satu kalimat yang menjelaskan apa yang ingin kamu capai."
                : "Arsip masih kosong. Tujuan yang diarsipkan tetap tersimpan lengkap dengan riwayat tugasnya."
            }
            action={
              view === "active" ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditing(undefined);
                    setFormOpen(true);
                  }}
                >
                  Buat tujuan pertama
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              timezone={timezone}
              onEdit={(target) => {
                setEditing(target);
                setFormOpen(true);
              }}
              onProgressChange={(target, progress) =>
                applyPatch(
                  target,
                  { progress },
                  () => updateGoal(target.id, { progress }),
                  "Progres gagal disimpan",
                )
              }
              onTogglePin={(target) =>
                applyPatch(
                  target,
                  { isPinned: !target.isPinned },
                  () => updateGoal(target.id, { isPinned: !target.isPinned }),
                  "Status North Star gagal diubah",
                )
              }
              onToggleArchive={(target) =>
                applyPatch(
                  target,
                  {
                    isArchived: !target.isArchived,
                    ...(target.isArchived ? {} : { isPinned: false }),
                  },
                  () =>
                    target.isArchived
                      ? updateGoal(target.id, { isArchived: false })
                      : archiveGoal(target.id),
                  target.isArchived
                    ? "Tujuan gagal diaktifkan kembali"
                    : "Tujuan gagal diarsipkan",
                )
              }
            />
          ))}
        </div>
      )}

      {formOpen ? (
        <GoalForm
          key={editing?.id ?? "new"}
          open={formOpen}
          goal={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(undefined);
          }}
          onSaved={() => mutate()}
        />
      ) : null}
    </div>
  );
}
