import { fail, ok, parseBody, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serializeIntention } from "@/lib/serializers";
import { currentUserId } from "@/lib/session";
import { createIntentionSchema } from "@/lib/validations/intention";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const intentions = await prisma.intention.findMany({
    where: { userId },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          goal: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  // Activation rate: how many scheduled weekdays have actually seen a session
  // start since the intention was created.
  const sessionCounts = await prisma.focusSession.groupBy({
    by: ["taskId"],
    where: {
      userId,
      taskId: { in: intentions.map((item) => item.taskId) },
      actualStart: { not: null },
    },
    _count: { _all: true },
  });

  const startedByTask = new Map(
    sessionCounts.map((row) => [row.taskId, row._count._all]),
  );

  return ok({
    intentions: intentions.map((intention) => ({
      ...serializeIntention(intention),
      task: {
        id: intention.task.id,
        title: intention.task.title,
        status: intention.task.status,
        goalTitle: intention.task.goal?.title ?? null,
      },
      activation: activationStats(
        intention.createdAt,
        intention.daysOfWeek,
        startedByTask.get(intention.taskId) ?? 0,
      ),
    })),
  });
}

function activationStats(
  createdAt: Date,
  daysOfWeek: number[],
  startedSessions: number,
) {
  const daysElapsed = Math.max(
    1,
    Math.ceil((Date.now() - createdAt.getTime()) / 86_400_000),
  );

  // With no weekday selection the intention is treated as daily.
  const perWeek = daysOfWeek.length === 0 ? 7 : daysOfWeek.length;
  const opportunities = Math.max(1, Math.round((daysElapsed / 7) * perWeek));
  const rate = Math.min(100, Math.round((startedSessions / opportunities) * 100));

  return { opportunities, startedSessions, rate };
}

export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const parsed = await parseBody(request, createIntentionSchema);
  if (!parsed.success) return parsed.response;

  const task = await prisma.task.findFirst({
    where: { id: parsed.data.taskId, userId },
    select: { id: true, intention: { select: { id: true } } },
  });
  if (!task) {
    return fail(
      "Tugas yang dipilih tidak ditemukan di akun ini.",
      "TASK_NOT_FOUND",
      404,
    );
  }

  // One intention per task (schema-enforced) — update instead of failing.
  const intention = task.intention
    ? await prisma.intention.update({
        where: { taskId: parsed.data.taskId },
        data: {
          ifClause: parsed.data.ifClause,
          thenClause: parsed.data.thenClause,
          atTime: parsed.data.atTime ?? null,
          daysOfWeek: parsed.data.daysOfWeek,
          isActive: true,
        },
      })
    : await prisma.intention.create({
        data: {
          userId,
          taskId: parsed.data.taskId,
          ifClause: parsed.data.ifClause,
          thenClause: parsed.data.thenClause,
          atTime: parsed.data.atTime ?? null,
          daysOfWeek: parsed.data.daysOfWeek,
        },
      });

  return ok({ intention: serializeIntention(intention) }, task.intention ? 200 : 201);
}
