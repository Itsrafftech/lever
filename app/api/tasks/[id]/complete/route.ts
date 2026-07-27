import { notFound, ok, unauthorized } from "@/lib/api";
import { syncDailyCheckinSafely } from "@/lib/daily-metrics";
import { prisma } from "@/lib/prisma";
import { TASK_INCLUDE, serializeTask } from "@/lib/serializers";
import { currentUser } from "@/lib/session";

export const runtime = "nodejs";

interface RouteContext {
  params: { id: string };
}

export async function POST(_request: Request, { params }: RouteContext) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const userId = user.id;

  const existing = await prisma.task.findFirst({
    where: { id: params.id, userId },
    select: { id: true, status: true },
  });
  if (!existing) return notFound("Tugas");

  // Toggling: completing an already-done task sends it back to TODO.
  const completing = existing.status !== "DONE";
  const now = new Date();

  const task = await prisma.task.update({
    where: { id: params.id },
    data: completing
      ? {
          status: "DONE",
          completedAt: now,
          skippedAt: null,
          skippedReason: null,
        }
      : { status: "TODO", completedAt: null },
    include: TASK_INCLUDE,
  });

  await syncDailyCheckinSafely(userId, user.timezone);

  return ok({ task: serializeTask(task) });
}
