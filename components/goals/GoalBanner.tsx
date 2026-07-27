"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import type { GoalDTO } from "@/types/api";

export interface GoalBannerProps {
  goal?: GoalDTO;
  isLoading?: boolean;
}

export function GoalBanner({ goal, isLoading }: GoalBannerProps) {
  if (isLoading) {
    return (
      <section className="rounded-[var(--radius-lg)] border border-[var(--accent-border)] bg-[var(--accent-subtle)] p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-6 w-3/4" />
        <Skeleton className="mt-4 h-1.5 w-full" />
      </section>
    );
  }

  if (!goal) {
    return (
      <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-subtle)] p-5">
        <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-[var(--text-muted)]">
          North Star
        </p>
        <p className="mt-2 max-w-[52ch] text-[0.875rem] text-[var(--text-secondary)]">
          Belum ada tujuan yang disematkan. Tugas tanpa tujuan yang jelas punya
          nilai Value yang rendah — dan itu yang membuatnya mudah ditunda.
        </p>
        <Link
          href="/goals"
          className="mt-3 inline-flex h-8 items-center rounded-[var(--radius)] bg-[var(--accent)] px-3 text-[0.8125rem] font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
        >
          Tentukan North Star
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--accent-border)] bg-[var(--accent-subtle)] p-5">
      <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-[var(--accent-hover)]">
        North Star
      </p>

      <h2 className="mt-2 max-w-[60ch] text-[1.25rem] font-semibold leading-snug text-[var(--text-primary)]">
        {goal.title}
      </h2>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <ProgressBar value={goal.progress} className="max-w-[320px]" />
          <span className="shrink-0 font-mono text-[0.875rem] text-[var(--text-primary)]">
            {goal.progress}%
          </span>
        </div>

        <div className="flex items-center gap-4 text-[0.8125rem] text-[var(--text-secondary)]">
          <span>
            {goal.activeTaskCount > 0
              ? `${goal.activeTaskCount} tugas aktif`
              : "Belum ada tugas aktif"}
          </span>
          <Link
            href={`/goals?goal=${goal.id}`}
            className="inline-flex items-center gap-1 font-medium text-[var(--accent-hover)] underline-offset-4 hover:underline"
          >
            Lihat detail
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
