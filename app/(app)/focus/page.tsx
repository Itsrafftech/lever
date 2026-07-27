import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { FocusView } from "@/components/sessions/FocusView";
import { Skeleton } from "@/components/ui/Skeleton";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Fokus",
  description:
    "Siapkan sesi Pomodoro atau deep work: pilih tugas, durasi, niat jika-maka, dan checklist lingkungan sebelum timer berjalan.",
};

export default async function FocusPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true, focusChecklist: true },
  });
  if (!user) redirect("/auth/signin");

  let checklist: string[] = [];
  if (user.focusChecklist) {
    try {
      const parsed: unknown = JSON.parse(user.focusChecklist);
      if (Array.isArray(parsed)) {
        checklist = parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      checklist = [];
    }
  }

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[560px] space-y-4">
          <Skeleton className="h-32 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
        </div>
      }
    >
      <FocusView timezone={user.timezone} initialChecklist={checklist} />
    </Suspense>
  );
}
