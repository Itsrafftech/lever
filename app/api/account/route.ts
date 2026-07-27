import { z } from "zod";

import { fail, ok, parseBody, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/session";

export const runtime = "nodejs";

/** Typed confirmation, so a stray DELETE can never wipe an account. */
const deleteAccountSchema = z.object({
  confirm: z.literal("hapus", {
    message: 'Ketik "hapus" untuk mengonfirmasi penghapusan akun.',
  }),
});

export async function DELETE(request: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const parsed = await parseBody(request, deleteAccountSchema);
  if (!parsed.success) return parsed.response;

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!existing) return fail("Akun tidak ditemukan.", "NOT_FOUND", 404);

  // Every related model cascades from User, so one delete clears goals, tasks,
  // sessions, intentions, check-ins, accounts, and sessions.
  await prisma.user.delete({ where: { id: userId } });

  return ok({ deleted: true });
}
