import { fail, notFound, ok, parseBody, unauthorized } from "@/lib/api";
import { syncDailyCheckinSafely } from "@/lib/daily-metrics";
import { prisma } from "@/lib/prisma";
import { TASK_INCLUDE, serializeTask } from "@/lib/serializers";
import { currentUser, currentUserId } from "@/lib/session";
import { updateTaskSchema } from "@/lib/validations/task";

export const runtime = "nodejs";

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const task = await prisma.task.findFirst({
    where: { id: params.id, userId },
    include: TASK_INCLUDE,
  });
  if (!task) return notFound("Tugas");

  return ok({ task: serializeTask(task) });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const userId = user.id;

  const parsed = await parseBody(request, updateTaskSchema);
  if (!parsed.success) return parsed.response;

  const existing = await prisma.task.findFirst({
    where: { id: params.id, userId },
    select: { id: true, status: true },
  });
  if (!existing) return notFound("Tugas");

  const { goalId, dueDate, scheduledFor, status, ...rest } = parsed.data;

  if (goalId) {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
      select: { id: true },
    });
    if (!goal) {
      return fail(
        "Tujuan yang dipilih tidak ditemukan di akun ini.",
        "GOAL_NOT_FOUND",
        422,
        { goalId: "Tujuan tidak valid." },
      );
    }
  }

  const now = new Date();

  const task = await prisma.task.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(goalId === undefined ? {} : { goalId }),
      ...(dueDate === undefined
        ? {}
        : { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(scheduledFor === undefined
        ? {}
        : { scheduledFor: scheduledFor ? new Date(scheduledFor) : null }),
      ...(status === undefined
        ? {}
        : {
            status,
            // Status transitions own their timestamps so analytics stay honest.
            startedAt:
              status === "IN_PROGRESS" && existing.status !== "IN_PROGRESS"
                ? now
                : undefined,
            completedAt: status === "DONE" ? now : status === "TODO" ? null : undefined,
            skippedAt: status === "SKIPPED" ? now : status === "TODO" ? null : undefined,
            ...(status === "TODO" ? { skippedReason: null } : {}),
          }),
    },
    include: TASK_INCLUDE,
  });

  // A status change here moves the same counters that /complete and /skip do.
  if (status !== undefined || dueDate !== undefined || scheduledFor !== undefined) {
    await syncDailyCheckinSafely(userId, user.timezone);
  }

  return ok({ task: serializeTask(task) });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const existing = await prisma.task.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return notFound("Tugas");

  // Focus sessions keep their history; the FK is SetNull on the task side.
  await prisma.task.delete({ where: { id: params.id } });

  await syncDailyCheckinSafely(user.id, user.timezone);

  return ok({ id: params.id });
}
