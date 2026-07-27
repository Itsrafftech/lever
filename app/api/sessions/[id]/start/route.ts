import { fail, notFound, ok, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { SESSION_INCLUDE, serializeSession } from "@/lib/serializers";
import { currentUserId } from "@/lib/session";

export const runtime = "nodejs";

interface RouteContext {
  params: { id: string };
}

export async function PATCH(_request: Request, { params }: RouteContext) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const existing = await prisma.focusSession.findFirst({
    where: { id: params.id, userId },
    select: { id: true, plannedStart: true, actualStart: true, taskId: true },
  });
  if (!existing) return notFound("Sesi fokus");

  if (existing.actualStart) {
    return fail(
      "Sesi ini sudah dimulai. Muat ulang halaman untuk melanjutkan timer.",
      "SESSION_ALREADY_STARTED",
      409,
    );
  }

  const now = new Date();
  // The headline anti-procrastination metric: the gap between when the user
  // said they would start and when they actually did.
  const timeToStartSecs = Math.max(
    0,
    Math.round((now.getTime() - existing.plannedStart.getTime()) / 1000),
  );

  const session = await prisma.$transaction(async (tx) => {
    if (existing.taskId) {
      await tx.task.updateMany({
        where: { id: existing.taskId, status: "TODO" },
        data: { status: "IN_PROGRESS", startedAt: now },
      });
      await tx.intention.updateMany({
        where: { taskId: existing.taskId },
        data: { lastActivatedAt: now },
      });
    }

    return tx.focusSession.update({
      where: { id: params.id },
      data: { actualStart: now, timeToStartSecs, status: "ACTIVE" },
      include: SESSION_INCLUDE,
    });
  });

  return ok({ session: serializeSession(session) });
}
