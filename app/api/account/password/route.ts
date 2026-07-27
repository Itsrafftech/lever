import bcrypt from "bcryptjs";
import { z } from "zod";

import { fail, ok, parseBody, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/session";
import { passwordSchema } from "@/lib/validations/auth";

export const runtime = "nodejs";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi."),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Konfirmasi password tidak sama dengan password baru.",
    path: ["confirmPassword"],
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    message: "Password baru harus berbeda dari password saat ini.",
    path: ["newPassword"],
  });

export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const parsed = await parseBody(request, changePasswordSchema);
  if (!parsed.success) return parsed.response;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return fail(
      "Akun ini masuk lewat Google, jadi tidak punya password untuk diubah.",
      "OAUTH_ACCOUNT",
      409,
    );
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return fail(
      "Password saat ini salah.",
      "INVALID_PASSWORD",
      422,
      { currentPassword: "Password saat ini salah." },
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) },
  });

  return ok({ changed: true });
}
