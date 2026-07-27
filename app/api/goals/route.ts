import { fail, ok, parseBody, parseQuery, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serializeGoal } from "@/lib/serializers";
import { currentUserId } from "@/lib/session";
import {
  MAX_GOALS,
  createGoalSchema,
  listGoalsSchema,
} from "@/lib/validations/goal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const query = parseQuery(request, listGoalsSchema);
  if (!query.success) return query.response;

  const goals = await prisma.goal.findMany({
    where: {
      userId,
      ...(query.data.includeArchived ? {} : { isArchived: false }),
    },
    include: { tasks: { select: { status: true } } },
    orderBy: [{ isPinned: "desc" }, { isArchived: "asc" }, { createdAt: "desc" }],
  });

  const activeCount = goals.filter((goal) => !goal.isArchived).length;

  return ok({
    goals: goals.map(serializeGoal),
    limit: MAX_GOALS,
    remaining: Math.max(0, MAX_GOALS - activeCount),
  });
}

export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const parsed = await parseBody(request, createGoalSchema);
  if (!parsed.success) return parsed.response;

  const activeCount = await prisma.goal.count({
    where: { userId, isArchived: false },
  });

  if (activeCount >= MAX_GOALS) {
    return fail(
      `Batas ${MAX_GOALS} tujuan aktif sudah tercapai. Arsipkan salah satu tujuan sebelum menambah yang baru.`,
      "GOAL_LIMIT_REACHED",
      409,
    );
  }

  const { isPinned, targetDate, ...rest } = parsed.data;
  // First goal is pinned automatically — the dashboard banner needs a target.
  const shouldPin = isPinned ?? activeCount === 0;

  const goal = await prisma.$transaction(async (tx) => {
    if (shouldPin) {
      await tx.goal.updateMany({
        where: { userId, isPinned: true },
        data: { isPinned: false },
      });
    }

    return tx.goal.create({
      data: {
        ...rest,
        userId,
        isPinned: shouldPin,
        targetDate: targetDate ? new Date(targetDate) : null,
      },
      include: { tasks: { select: { status: true } } },
    });
  });

  return ok({ goal: serializeGoal(goal) }, 201);
}
