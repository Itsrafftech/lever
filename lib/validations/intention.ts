import { z } from "zod";

export const DAY_LABELS = [
  { value: 0, label: "Min", full: "Minggu" },
  { value: 1, label: "Sen", full: "Senin" },
  { value: 2, label: "Sel", full: "Selasa" },
  { value: 3, label: "Rab", full: "Rabu" },
  { value: 4, label: "Kam", full: "Kamis" },
  { value: 5, label: "Jum", full: "Jumat" },
  { value: 6, label: "Sab", full: "Sabtu" },
] as const;

const clause = (field: string, min: number) =>
  z
    .string()
    .trim()
    .min(min, `Bagian "${field}" minimal ${min} karakter — tulis sespesifik mungkin.`)
    .max(240, `Bagian "${field}" maksimal 240 karakter.`);

export const createIntentionSchema = z.object({
  taskId: z.string().cuid("ID tugas tidak valid."),
  ifClause: clause("Jika", 4),
  thenClause: clause("Maka", 4),
  atTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Waktu harus dalam format HH:MM.")
    .nullable()
    .optional(),
  daysOfWeek: z
    .array(z.number().int().min(0).max(6))
    .max(7, "Maksimal tujuh hari.")
    .optional()
    .default([]),
});

export const updateIntentionSchema = z
  .object({
    ifClause: clause("Jika", 4).optional(),
    thenClause: clause("Maka", 4).optional(),
    atTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Waktu harus dalam format HH:MM.")
      .nullable()
      .optional(),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((values) => Object.keys(values).length > 0, {
    message: "Tidak ada perubahan yang dikirim.",
  });

export type CreateIntentionInput = z.infer<typeof createIntentionSchema>;
export type UpdateIntentionInput = z.infer<typeof updateIntentionSchema>;
