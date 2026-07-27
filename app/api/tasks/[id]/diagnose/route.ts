import { notFound, ok, parseBody, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { TASK_INCLUDE, serializeTask } from "@/lib/serializers";
import { currentUserId } from "@/lib/session";
import { calculateMotivation } from "@/lib/steel-formula";
import { diagnoseTaskSchema } from "@/lib/validations/task";

export const runtime = "nodejs";

interface RouteContext {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteContext) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const parsed = await parseBody(request, diagnoseTaskSchema);
  if (!parsed.success) return parsed.response;

  const existing = await prisma.task.findFirst({
    where: { id: params.id, userId },
    select: { id: true },
  });
  if (!existing) return notFound("Tugas");

  // The score is recomputed server-side; the client never supplies it.
  const result = calculateMotivation(parsed.data);

  const task = await prisma.task.update({
    where: { id: params.id },
    data: {
      expectancy: parsed.data.expectancy,
      value: parsed.data.value,
      impulsiveness: parsed.data.impulsiveness,
      delay: parsed.data.delay,
      motivationScore: result.score,
    },
    include: TASK_INCLUDE,
  });

  return ok({
    task: serializeTask(task),
    diagnosis: {
      score: result.score,
      rawRatio: result.rawRatio,
      risk: result.risk,
      interventions: result.interventions,
    },
  });
}
