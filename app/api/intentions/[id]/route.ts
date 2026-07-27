import { notFound, ok, parseBody, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serializeIntention } from "@/lib/serializers";
import { currentUserId } from "@/lib/session";
import { updateIntentionSchema } from "@/lib/validations/intention";

export const runtime = "nodejs";

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const parsed = await parseBody(request, updateIntentionSchema);
  if (!parsed.success) return parsed.response;

  const existing = await prisma.intention.findFirst({
    where: { id: params.id, userId },
    select: { id: true },
  });
  if (!existing) return notFound("Niat jika-maka");

  const intention = await prisma.intention.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return ok({ intention: serializeIntention(intention) });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const existing = await prisma.intention.findFirst({
    where: { id: params.id, userId },
    select: { id: true },
  });
  if (!existing) return notFound("Niat jika-maka");

  await prisma.intention.delete({ where: { id: params.id } });

  return ok({ id: params.id });
}
