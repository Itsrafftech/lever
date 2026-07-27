"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { FocusMode } from "@/components/sessions/FocusMode";
import { PostSession } from "@/components/sessions/PostSession";
import { SessionCard } from "@/components/sessions/SessionCard";
import { SessionSetup } from "@/components/sessions/SessionSetup";
import { useSessions } from "@/lib/hooks/useSessions";
import type { FocusSessionDTO } from "@/types/api";

type Stage = "setup" | "running" | "reflect";

export function FocusView({
  timezone,
  initialChecklist,
}: {
  timezone: string;
  initialChecklist: string[];
}) {
  const searchParams = useSearchParams();
  const initialTaskId = searchParams.get("taskId") ?? undefined;

  const { sessions, active, isLoading, mutate } = useSessions("limit=12");

  const [session, setSession] = useState<FocusSessionDTO | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [setupKey, setSetupKey] = useState(0);

  // A session left running in another tab (or before a refresh) resumes here.
  const running = session ?? active;
  const effectiveStage: Stage =
    stage ?? (active && !session ? "running" : "setup");

  if (isLoading && !active) {
    return (
      <div className="mx-auto max-w-[560px] space-y-4">
        <Skeleton className="h-32 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
      </div>
    );
  }

  if (effectiveStage === "running" && running) {
    return (
      <FocusMode
        session={running}
        onFinish={(current) => {
          setSession(current);
          setStage("reflect");
        }}
        onAbandoned={() => {
          setSession(null);
          setStage("setup");
          setSetupKey((key) => key + 1);
          void mutate();
        }}
      />
    );
  }

  if (effectiveStage === "reflect" && running) {
    return (
      <PostSession
        session={running}
        onCancel={() => setStage("running")}
        onDone={() => {
          setSession(null);
          setStage("setup");
          setSetupKey((key) => key + 1);
          void mutate();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SessionSetup
        key={setupKey}
        initialTaskId={initialTaskId}
        initialChecklist={initialChecklist}
        onStarted={(started) => {
          setSession(started);
          setStage("running");
          void mutate();
        }}
      />

      <section className="mx-auto max-w-[560px]">
        <h2 className="mb-2 text-[1.125rem] font-semibold">Riwayat sesi</h2>
        <div className="lever-card overflow-hidden">
          {sessions.length === 0 ? (
            <EmptyState message="Belum ada sesi fokus. Sesi pertama biasanya yang paling sulit dimulai — itu wajar." />
          ) : (
            <ul>
              {sessions.map((item) => (
                <SessionCard key={item.id} session={item} timezone={timezone} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
