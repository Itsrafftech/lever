import { notFound, ok, parseBody, unauthorized } from "@/lib/api";
import { syncDailyCheckinSafely } from "@/lib/daily-metrics";
import { prisma } from "@/lib/prisma";
import { TASK_INCLUDE, serializeTask } from "@/lib/serializers";
import { currentUser } from "@/lib/session";
import { skipTaskSchema } from "@/lib/validations/task";

export const runtime = "nodejs";

interface RouteContext {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const userId = user.id;

  const parsed = await parseBody(request, skipTaskSchema);
  if (!parsed.success) return parsed.response;

  const existing = await prisma.task.findFirst({
    where: { id: params.id, userId },
    select: { id: true },
  });
  if (!existing) return notFound("Tugas");

  // Reason is stored as `CODE` or `CODE: free text` so analytics can group on
  // the code while keeping whatever the user typed.
  const reason = parsed.data.note
    ? `${parsed.data.reason}: ${parsed.data.note}`
    : parsed.data.reason;

  const task = await prisma.task.update({
    where: { id: params.id },
    data: {
      status: "SKIPPED",
      skippedAt: new Date(),
      skippedReason: reason,
      completedAt: null,
    },
    include: TASK_INCLUDE,
  });

  await syncDailyCheckinSafely(userId, user.timezone);

  return ok({ task: serializeTask(task) });
}
