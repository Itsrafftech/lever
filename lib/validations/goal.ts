import { z } from "zod";

export const GOAL_CATEGORIES = [
  "PERSONAL",
  "WORK",
  "HEALTH",
  "LEARNING",
  "FINANCIAL",
  "RELATIONSHIP",
] as const;

export const MAX_GOALS = 5;
export const MAX_GOAL_TITLE = 120;

const optionalDate = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD."))
  .nullable()
  .optional();

export const createGoalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, "Judul tujuan minimal 4 karakter — tulis satu kalimat utuh.")
    .max(
      MAX_GOAL_TITLE,
      `Judul tujuan maksimal ${MAX_GOAL_TITLE} karakter. Ringkas jadi satu kalimat.`,
    ),
  description: z
    .string()
    .trim()
    .max(600, "Deskripsi maksimal 600 karakter.")
    .nullable()
    .optional(),
  category: z.enum(GOAL_CATEGORIES).default("PERSONAL"),
  targetDate: optionalDate,
  isPinned: z.boolean().optional(),
});

export const updateGoalSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(4, "Judul tujuan minimal 4 karakter — tulis satu kalimat utuh.")
      .max(
        MAX_GOAL_TITLE,
        `Judul tujuan maksimal ${MAX_GOAL_TITLE} karakter. Ringkas jadi satu kalimat.`,
      )
      .optional(),
    description: z
      .string()
      .trim()
      .max(600, "Deskripsi maksimal 600 karakter.")
      .nullable()
      .optional(),
    category: z.enum(GOAL_CATEGORIES).optional(),
    progress: z
      .number()
      .int("Progres harus bilangan bulat.")
      .min(0, "Progres minimal 0%.")
      .max(100, "Progres maksimal 100%.")
      .optional(),
    targetDate: optionalDate,
    isPinned: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  })
  .refine((values) => Object.keys(values).length > 0, {
    message: "Tidak ada perubahan yang dikirim.",
  });

export const listGoalsSchema = z.object({
  includeArchived: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

export const GOAL_CATEGORY_OPTIONS = [
  { value: "PERSONAL", label: "Pribadi" },
  { value: "WORK", label: "Pekerjaan" },
  { value: "HEALTH", label: "Kesehatan" },
  { value: "LEARNING", label: "Pembelajaran" },
  { value: "FINANCIAL", label: "Keuangan" },
  { value: "RELATIONSHIP", label: "Relasi" },
] as const;
