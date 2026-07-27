import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

import { fail, ok, parseBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import { signUpSchema } from "@/lib/validations/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = await parseBody(request, signUpSchema);
  if (!parsed.success) return parsed.response;

  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  if (existing) {
    return fail(
      existing.passwordHash
        ? "Email ini sudah terdaftar. Gunakan halaman masuk atau reset password."
        : "Email ini sudah terhubung ke akun Google. Masuk dengan tombol Google.",
      "EMAIL_TAKEN",
      409,
      { email: "Email sudah digunakan." },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  try {
    const user = await prisma.user.create({
      data: { email, name: parsed.data.name, passwordHash },
      select: { id: true, email: true, name: true },
    });

    const mail = await sendWelcomeEmail(user.email, user.name ?? "");

    return ok({ user, welcomeEmailSent: mail.sent }, 201);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return fail(
        "Email ini baru saja didaftarkan. Coba masuk dengan email dan password tersebut.",
        "EMAIL_TAKEN",
        409,
        { email: "Email sudah digunakan." },
      );
    }

    return fail(
      "Akun gagal dibuat karena database tidak bisa diakses. Periksa koneksi DATABASE_URL lalu coba lagi.",
      "DATABASE_ERROR",
      503,
    );
  }
}
