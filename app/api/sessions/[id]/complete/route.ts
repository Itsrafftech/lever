import { fail, notFound, ok, parseBody, unauthorized } from "@/lib/api";
import { syncDailyCheckinSafely } from "@/lib/daily-metrics";
import { prisma } from "@/lib/prisma";
import { SESSION_INCLUDE, serializeSession } from "@/lib/serializers";
import { currentUser } from "@/lib/session";
import { closeSessionOnCalendar } from "@/lib/session-calendar";
import { completeSessionSchema } from "@/lib/validations/session";

export const runtime = "nodejs";

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const userId = user.id;

  const parsed = await parseBody(request, completeSessionSchema);
  if (!parsed.success) return parsed.response;

  const existing = await prisma.focusSession.findFirst({
    where: { id: params.id, userId },
    select: { id: true, status: true, actualStart: true, taskId: true },
  });
  if (!existing) return notFound("Sesi fokus");

  if (!existing.actualStart) {
    return fail(
      "Sesi ini belum pernah dimulai, jadi tidak bisa diselesaikan.",
      "SESSION_NOT_STARTED",
      409,
    );
  }
  if (existing.status !== "ACTIVE") {
    return fail(
      "Sesi ini sudah ditutup sebelumnya.",
      "SESSION_ALREADY_CLOSED",
      409,
    );
  }

  const now = new Date();
  // Actual elapsed time, not the planned duration — a session ended early
  // should not inflate the focus-minute totals.
  const elapsedMinutes = Math.max(
    1,
    Math.round((now.getTime() - existing.actualStart.getTime()) / 60000),
  );

  const session = await prisma.$transaction(async (tx) => {
    if (existing.taskId) {
      const task = await tx.task.findUnique({
        where: { id: existing.taskId },
        select: { actualMinutes: true },
      });

      await tx.task.update({
        where: { id: existing.taskId },
        data: {
          actualMinutes: (task?.actualMinutes ?? 0) + elapsedMinutes,
          ...(parsed.data.completeTask
            ? { status: "DONE", completedAt: now }
            : {}),
        },
      });
    }

    return tx.focusSession.update({
      where: { id: params.id },
      data: {
        status: "COMPLETED",
        completedAt: now,
        rating: parsed.data.rating ?? null,
        notes: parsed.data.notes ?? null,
      },
      include: SESSION_INCLUDE,
    });
  });

  // Shrink the calendar block to the time actually spent.
  await closeSessionOnCalendar(userId, params.id, "completed", now);

  // Roll the day's metrics forward against the session's own day, so a session
  // finished just after local midnight lands on the day it started.
  await syncDailyCheckinSafely(userId, user.timezone, existing.actualStart);

  return ok({ session: serializeSession(session), elapsedMinutes });
}
