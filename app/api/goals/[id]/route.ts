import { fail, notFound, ok, parseBody, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serializeGoal } from "@/lib/serializers";
import { currentUserId } from "@/lib/session";
import { MAX_GOALS, updateGoalSchema } from "@/lib/validations/goal";

export const runtime = "nodejs";

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const parsed = await parseBody(request, updateGoalSchema);
  if (!parsed.success) return parsed.response;

  const existing = await prisma.goal.findFirst({
    where: { id: params.id, userId },
    select: { id: true, isArchived: true },
  });
  if (!existing) return notFound("Tujuan");

  const { isPinned, isArchived, targetDate, ...rest } = parsed.data;

  // Un-archiving has to respect the same cap that creation does.
  if (isArchived === false && existing.isArchived) {
    const activeCount = await prisma.goal.count({
      where: { userId, isArchived: false },
    });
    if (activeCount >= MAX_GOALS) {
      return fail(
        `Tidak bisa mengaktifkan kembali: sudah ada ${MAX_GOALS} tujuan aktif. Arsipkan salah satunya dulu.`,
        "GOAL_LIMIT_REACHED",
        409,
      );
    }
  }

  if (isPinned === true && isArchived === true) {
    return fail(
      "Tujuan yang diarsipkan tidak bisa disematkan. Pilih salah satu.",
      "INVALID_STATE",
      422,
    );
  }

  const goal = await prisma.$transaction(async (tx) => {
    if (isPinned === true) {
      await tx.goal.updateMany({
        where: { userId, isPinned: true, NOT: { id: params.id } },
        data: { isPinned: false },
      });
    }

    return tx.goal.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(isPinned === undefined ? {} : { isPinned }),
        // Archiving always clears the pin so the banner never points at it.
        ...(isArchived === undefined
          ? {}
          : { isArchived, ...(isArchived ? { isPinned: false } : {}) }),
        ...(targetDate === undefined
          ? {}
          : { targetDate: targetDate ? new Date(targetDate) : null }),
      },
      include: { tasks: { select: { status: true } } },
    });
  });

  return ok({ goal: serializeGoal(goal) });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const existing = await prisma.goal.findFirst({
    where: { id: params.id, userId },
    select: { id: true },
  });
  if (!existing) return notFound("Tujuan");

  // Soft delete: history stays intact, and linked tasks keep their reference.
  const goal = await prisma.goal.update({
    where: { id: params.id },
    data: { isArchived: true, isPinned: false },
    include: { tasks: { select: { status: true } } },
  });

  return ok({ goal: serializeGoal(goal) });
}
