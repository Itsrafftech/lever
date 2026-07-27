import { fail, ok, parseBody, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/session";
import { reorderTasksSchema } from "@/lib/validations/task";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const parsed = await parseBody(request, reorderTasksSchema);
  if (!parsed.success) return parsed.response;

  const { ids } = parsed.data;

  // Reject the whole batch unless every id belongs to this user, so a crafted
  // payload can never reorder someone else's list.
  const owned = await prisma.task.count({
    where: { id: { in: ids }, userId },
  });
  if (owned !== ids.length) {
    return fail(
      "Sebagian tugas dalam urutan baru tidak ditemukan di akun ini.",
      "TASK_NOT_FOUND",
      404,
    );
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.task.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );

  return ok({ ordered: ids.length });
}
