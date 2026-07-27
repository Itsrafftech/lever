import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email wajib diisi.")
  .email("Format email tidak valid. Contoh: nama@domain.com");

export const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter.")
  .max(72, "Password maksimal 72 karakter.")
  .regex(/[a-z]/, "Password harus mengandung minimal satu huruf kecil.")
  .regex(/[A-Z0-9]/, "Password harus mengandung minimal satu huruf besar atau angka.");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password wajib diisi."),
});

export const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nama minimal 2 karakter.")
      .max(80, "Nama maksimal 80 karakter."),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Konfirmasi password tidak sama dengan password.",
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number; // 0-4
  label: string;
  hints: string[];
}

/**
 * Deterministic strength meter used by the signup form. Kept in the shared
 * validations module so client and server describe passwords the same way.
 */
export function evaluatePassword(password: string): PasswordStrengthResult {
  const hints: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else hints.push("Minimal 8 karakter");

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  else hints.push("Campur huruf besar dan kecil");

  if (/[0-9]/.test(password)) score += 1;
  else hints.push("Tambahkan minimal satu angka");

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else hints.push("Tambahkan simbol (!, @, #)");

  if (password.length >= 14 && score === 4) score = 4;
  if (password.length < 8) score = Math.min(score, 1);

  const map: Record<number, { strength: PasswordStrength; label: string }> = {
    0: { strength: "weak", label: "Lemah" },
    1: { strength: "weak", label: "Lemah" },
    2: { strength: "fair", label: "Cukup" },
    3: { strength: "good", label: "Bagus" },
    4: { strength: "strong", label: "Kuat" },
  };

  const resolved = map[score] ?? map[0];
  return { ...resolved, score, hints };
}
