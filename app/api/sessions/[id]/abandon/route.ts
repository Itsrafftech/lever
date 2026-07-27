import { fail, notFound, ok, parseBody, unauthorized } from "@/lib/api";
import { syncDailyCheckinSafely } from "@/lib/daily-metrics";
import { prisma } from "@/lib/prisma";
import { SESSION_INCLUDE, serializeSession } from "@/lib/serializers";
import { currentUser } from "@/lib/session";
import { closeSessionOnCalendar } from "@/lib/session-calendar";
import { abandonSessionSchema } from "@/lib/validations/session";

export const runtime = "nodejs";

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const userId = user.id;

  const parsed = await parseBody(request, abandonSessionSchema);
  if (!parsed.success) return parsed.response;

  const existing = await prisma.focusSession.findFirst({
    where: { id: params.id, userId },
    select: { id: true, status: true, actualStart: true, taskId: true },
  });
  if (!existing) return notFound("Sesi fokus");

  if (existing.status !== "ACTIVE") {
    return fail("Sesi ini sudah ditutup sebelumnya.", "SESSION_ALREADY_CLOSED", 409);
  }

  const now = new Date();

  // Partial focus still counts — abandoning after 20 minutes is not zero work.
  const elapsedMinutes = existing.actualStart
    ? Math.max(0, Math.round((now.getTime() - existing.actualStart.getTime()) / 60000))
    : 0;

  const session = await prisma.$transaction(async (tx) => {
    if (existing.taskId && elapsedMinutes > 0) {
      const task = await tx.task.findUnique({
        where: { id: existing.taskId },
        select: { actualMinutes: true },
      });
      await tx.task.update({
        where: { id: existing.taskId },
        data: { actualMinutes: (task?.actualMinutes ?? 0) + elapsedMinutes },
      });
    }

    return tx.focusSession.update({
      where: { id: params.id },
      data: {
        status: "ABANDONED",
        abandonedAt: now,
        notes: parsed.data.notes ?? null,
      },
      include: SESSION_INCLUDE,
    });
  });

  // The event stays on the calendar — it records real elapsed time — but the
  // title and description now say the session was abandoned.
  await closeSessionOnCalendar(userId, params.id, "abandoned", now);

  await syncDailyCheckinSafely(
    userId,
    user.timezone,
    existing.actualStart ?? undefined,
  );

  return ok({ session: serializeSession(session), elapsedMinutes });
}
