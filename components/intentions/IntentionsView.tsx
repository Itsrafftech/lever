"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { IntentionCard } from "@/components/intentions/IntentionCard";
import { IntentionForm } from "@/components/intentions/IntentionForm";
import { describeError } from "@/lib/fetcher";
import {
  deleteIntention,
  updateIntention,
  useIntentions,
  type IntentionWithTask,
} from "@/lib/hooks/useIntentions";
import { useTasks } from "@/lib/hooks/useTasks";
import { toast } from "@/lib/store/toast";
import type { IntentionDTO } from "@/types/api";

interface FormTarget {
  taskId: string;
  taskTitle: string;
  existing: IntentionDTO | null;
}

export function IntentionsView({ timezone }: { timezone: string }) {
  const { intentions, isLoading, error, mutate } = useIntentions();
  const { tasks } = useTasks("all");

  const [target, setTarget] = useState<FormTarget | null>(null);
  const [picking, setPicking] = useState(false);
  const [pickedTaskId, setPickedTaskId] = useState("");
  const [duplicating, setDuplicating] = useState<IntentionWithTask | null>(null);

  const taskOptions = tasks.map((task) => ({
    value: task.id,
    label: task.title.length > 56 ? `${task.title.slice(0, 56)}…` : task.title,
    description: task.intention ? "Sudah punya niat — akan diganti" : undefined,
  }));

  async function applyUpdate(
    intention: IntentionWithTask,
    patch: Partial<IntentionWithTask>,
    run: () => Promise<unknown>,
    failureTitle: string,
  ) {
    await mutate(
      async (current) => {
        await run();
        return current;
      },
      {
        optimisticData: (current) =>
          current
            ? {
                intentions: current.intentions.map((item) =>
                  item.id === intention.id ? { ...item, ...patch } : item,
                ),
              }
            : current!,
        rollbackOnError: true,
        revalidate: true,
      },
    ).catch((cause) => toast.error(failureTitle, describeError(cause)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-[62ch] text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
          Implementation intentions meningkatkan follow-through rata-rata 40–50%
          dibanding niat biasa. — Gollwitzer, 1999
        </p>

        <Button
          size="sm"
          icon={<Plus className="h-4 w-4" aria-hidden />}
          disabled={tasks.length === 0}
          title={
            tasks.length === 0
              ? "Buat tugas terlebih dahulu — niat selalu terikat ke satu tugas."
              : undefined
          }
          onClick={() => {
            setPickedTaskId("");
            setPicking(true);
          }}
        >
          Niat baru
        </Button>
      </div>

      {error ? (
        <div className="lever-card p-4">
          <p className="text-[0.875rem] text-[var(--danger)]">
            {describeError(error)}
          </p>
          <Button
            className="mt-3"
            size="sm"
            variant="ghost"
            onClick={() => mutate()}
          >
            Coba lagi
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1].map((index) => (
            <div key={index} className="lever-card space-y-3 p-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-1 w-full" />
            </div>
          ))}
        </div>
      ) : intentions.length === 0 ? (
        <div className="lever-card">
          <EmptyState
            message={
              tasks.length > 0
                ? "Belum ada niat jika-maka. Hubungkan satu situasi konkret dengan satu tindakan konkret."
                : "Niat selalu terikat ke satu tugas, dan belum ada tugas aktif. Buat tugas dulu, lalu kembali ke sini."
            }
            action={
              tasks.length > 0 ? (
                <Button size="sm" onClick={() => setPicking(true)}>
                  Buat niat pertama
                </Button>
              ) : (
                <Link
                  href="/tasks"
                  className="inline-flex h-8 items-center rounded-[var(--radius)] bg-[var(--accent)] px-3 text-[0.8125rem] font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
                >
                  Buat tugas
                </Link>
              )
            }
          />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {intentions.map((intention) => (
            <IntentionCard
              key={intention.id}
              intention={intention}
              timezone={timezone}
              onEdit={(item) =>
                setTarget({
                  taskId: item.taskId,
                  taskTitle: item.task.title,
                  existing: item,
                })
              }
              onDuplicate={(item) => {
                setDuplicating(item);
                setPickedTaskId("");
              }}
              onToggleActive={(item) =>
                applyUpdate(
                  item,
                  { isActive: !item.isActive },
                  () => updateIntention(item.id, { isActive: !item.isActive }),
                  "Status niat gagal diubah",
                )
              }
              onDelete={async (item) => {
                await mutate(
                  async (current) => {
                    await deleteIntention(item.id);
                    return current;
                  },
                  {
                    optimisticData: (current) =>
                      current
                        ? {
                            intentions: current.intentions.filter(
                              (row) => row.id !== item.id,
                            ),
                          }
                        : current!,
                    rollbackOnError: true,
                    revalidate: true,
                  },
                ).catch((cause) =>
                  toast.error("Niat gagal dihapus", describeError(cause)),
                );
              }}
            />
          ))}
        </div>
      )}

      {picking || duplicating ? (
        <Modal
          open
          size="sm"
          title={duplicating ? "Duplikat niat" : "Pilih tugas"}
          description={
            duplicating
              ? "Salin kalimat jika-maka ini ke tugas lain."
              : "Setiap niat terikat ke satu tugas."
          }
          onClose={() => {
            setPicking(false);
            setDuplicating(null);
          }}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setPicking(false);
                  setDuplicating(null);
                }}
              >
                Batal
              </Button>
              <Button
                disabled={!pickedTaskId}
                onClick={() => {
                  const task = tasks.find((item) => item.id === pickedTaskId);
                  if (!task) return;
                  setTarget({
                    taskId: task.id,
                    taskTitle: task.title,
                    existing: duplicating
                      ? {
                          ...duplicating,
                          id: "",
                          taskId: task.id,
                        }
                      : task.intention,
                  });
                  setPicking(false);
                  setDuplicating(null);
                }}
              >
                Lanjut
              </Button>
            </>
          }
        >
          <Select
            label="Tugas"
            value={pickedTaskId}
            onChange={setPickedTaskId}
            placeholder="Pilih tugas…"
            options={taskOptions}
          />
        </Modal>
      ) : null}

      {target ? (
        <IntentionForm
          key={target.taskId}
          taskId={target.taskId}
          taskTitle={target.taskTitle}
          existing={target.existing}
          onClose={() => setTarget(null)}
          onSaved={() => mutate()}
        />
      ) : null}
    </div>
  );
}
