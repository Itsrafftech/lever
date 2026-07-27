import { z } from "zod";

const scale = z
  .number()
  .int("Nilai harus bilangan bulat.")
  .min(1, "Nilai minimal 1.")
  .max(10, "Nilai maksimal 10.");

export const upsertCheckinSchema = z.object({
  /** Day key in the user's timezone (YYYY-MM-DD). Defaults to today. */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD.")
    .optional(),
  energyLevel: scale.nullable().optional(),
  focusQuality: scale.nullable().optional(),
  note: z.string().trim().max(1000, "Catatan maksimal 1000 karakter.").nullable().optional(),
});

export const listCheckinsSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(120).optional(),
});

export type UpsertCheckinInput = z.infer<typeof upsertCheckinSchema>;
