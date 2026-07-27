"use client";

import Link from "next/link";
import { Copy, Pencil, Power, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatShortDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { DAY_LABELS } from "@/lib/validations/intention";
import type { IntentionWithTask } from "@/lib/hooks/useIntentions";

export interface IntentionCardProps {
  intention: IntentionWithTask;
  timezone: string;
  onEdit: (intention: IntentionWithTask) => void;
  onDuplicate: (intention: IntentionWithTask) => void;
  onToggleActive: (intention: IntentionWithTask) => void;
  onDelete: (intention: IntentionWithTask) => void;
}

export function IntentionCard({
  intention,
  timezone,
  onEdit,
  onDuplicate,
  onToggleActive,
  onDelete,
}: IntentionCardProps) {
  const days =
    intention.daysOfWeek.length === 0
      ? "Setiap hari"
      : DAY_LABELS.filter((day) => intention.daysOfWeek.includes(day.value))
          .map((day) => day.label)
          .join(", ");

  return (
    <article
      className={cn(
        "lever-card p-4",
        !intention.isActive && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={intention.isActive ? "accent" : "neutral"}>
            {intention.isActive ? "Aktif" : "Nonaktif"}
          </Badge>
          <Badge tone="neutral">{days}</Badge>
          {intention.atTime ? (
            <Badge tone="neutral">
              <span className="font-mono">{intention.atTime}</span>
            </Badge>
          ) : null}
        </div>

        <ContextMenu
          ariaLabel={`Aksi untuk niat pada ${intention.task.title}`}
          items={[
            {
              label: "Ubah niat",
              icon: <Pencil className="h-4 w-4" aria-hidden />,
              onSelect: () => onEdit(intention),
            },
            {
              label: "Duplikat ke tugas lain",
              icon: <Copy className="h-4 w-4" aria-hidden />,
              onSelect: () => onDuplicate(intention),
            },
            {
              label: intention.isActive ? "Nonaktifkan" : "Aktifkan",
              icon: <Power className="h-4 w-4" aria-hidden />,
              onSelect: () => onToggleActive(intention),
            },
            {
              label: "Hapus",
              icon: <Trash2 className="h-4 w-4" aria-hidden />,
              tone: "danger",
              separated: true,
              onSelect: () => onDelete(intention),
            },
          ]}
        />
      </div>

      <p className="mt-3 text-[0.9375rem] leading-relaxed text-[var(--text-primary)]">
        <span className="font-medium text-[var(--accent-hover)]">Jika</span>{" "}
        {intention.ifClause}
        {intention.atTime ? (
          <>
            {" "}
            pada <span className="font-mono">{intention.atTime}</span>
          </>
        ) : null}
        {", "}
        <span className="font-medium text-[var(--accent-hover)]">maka</span>{" "}
        {intention.thenClause}
      </p>

      <Link
        href="/tasks"
        className="mt-3 inline-block truncate text-[0.8125rem] text-[var(--text-secondary)] underline-offset-4 hover:text-[var(--text-primary)] hover:underline"
      >
        {intention.task.title}
      </Link>

      <div className="mt-3 border-t border-[var(--border)] pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[0.8125rem] text-[var(--text-secondary)]">
            Tingkat aktivasi
          </span>
          <span className="font-mono text-[0.8125rem] text-[var(--text-primary)]">
            {intention.activation.rate}%
          </span>
        </div>
        <ProgressBar className="mt-1.5" value={intention.activation.rate} size="sm" />
        <p className="mt-1.5 text-[0.75rem] text-[var(--text-muted)]">
          {intention.activation.startedSessions} sesi dimulai dari{" "}
          {intention.activation.opportunities} kesempatan
          {intention.lastActivatedAt
            ? ` · terakhir ${formatShortDate(new Date(intention.lastActivatedAt), timezone)}`
            : " · belum pernah diaktifkan"}
        </p>
      </div>
    </article>
  );
}
