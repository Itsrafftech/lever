import { z } from "zod";

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE", "SKIPPED"] as const;
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const SKIP_REASONS = [
  { value: "EXTERNAL", label: "Gangguan eksternal (meeting, darurat)" },
  { value: "TOO_BIG", label: "Tugas terlalu besar (perlu dipecah)" },
  { value: "PRIORITY_CHANGED", label: "Prioritas berubah" },
  { value: "UNMOTIVATED", label: "Tidak termotivasi" },
  { value: "OTHER", label: "Lainnya" },
] as const;

export const SKIP_REASON_VALUES = SKIP_REASONS.map((reason) => reason.value);

const nullableIsoDate = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD."))
  .nullable()
  .optional();

const steelScore = z
  .number()
  .int("Skor harus bilangan bulat.")
  .min(1, "Skor minimal 1.")
  .max(10, "Skor maksimal 10.");

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Judul tugas minimal 2 karakter.")
    .max(200, "Judul tugas maksimal 200 karakter."),
  description: z
    .string()
    .trim()
    .max(2000, "Deskripsi maksimal 2000 karakter.")
    .nullable()
    .optional(),
  goalId: z.string().cuid("ID tujuan tidak valid.").nullable().optional(),
  priority: z.enum(PRIORITIES).default("MEDIUM"),
  dueDate: nullableIsoDate,
  scheduledFor: nullableIsoDate,
  estimatedMinutes: z
    .number()
    .int("Estimasi harus bilangan bulat menit.")
    .min(5, "Estimasi minimal 5 menit.")
    .max(600, "Estimasi maksimal 600 menit. Pecah tugas ini jadi lebih kecil.")
    .nullable()
    .optional(),
});

export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Judul tugas minimal 2 karakter.")
      .max(200, "Judul tugas maksimal 200 karakter.")
      .optional(),
    description: z
      .string()
      .trim()
      .max(2000, "Deskripsi maksimal 2000 karakter.")
      .nullable()
      .optional(),
    goalId: z.string().cuid("ID tujuan tidak valid.").nullable().optional(),
    status: z.enum(TASK_STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    dueDate: nullableIsoDate,
    scheduledFor: nullableIsoDate,
    estimatedMinutes: z
      .number()
      .int()
      .min(5, "Estimasi minimal 5 menit.")
      .max(600, "Estimasi maksimal 600 menit.")
      .nullable()
      .optional(),
    actualMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  })
  .refine((values) => Object.keys(values).length > 0, {
    message: "Tidak ada perubahan yang dikirim.",
  });

export const diagnoseTaskSchema = z.object({
  expectancy: steelScore,
  value: steelScore,
  impulsiveness: steelScore,
  delay: steelScore,
});

export const skipTaskSchema = z.object({
  reason: z.enum(
    SKIP_REASON_VALUES as unknown as [string, ...string[]],
    { message: "Pilih salah satu alasan yang tersedia." },
  ),
  note: z.string().trim().max(300, "Catatan maksimal 300 karakter.").optional(),
});

export const reorderTasksSchema = z.object({
  ids: z
    .array(z.string().cuid("ID tugas tidak valid."))
    .min(1, "Daftar urutan tidak boleh kosong.")
    .max(300, "Terlalu banyak tugas dalam satu permintaan."),
});

export const listTasksSchema = z.object({
  /** Free-text search over the title, used by the command palette. */
  q: z.string().trim().max(120).optional(),
  status: z.string().optional(),
  goalId: z.string().optional(),
  view: z.enum(["today", "all", "overdue", "done"]).optional(),
  hasScore: z.enum(["true", "false"]).optional(),
  priority: z.string().optional(),
  dueFrom: z.string().optional(),
  dueTo: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type DiagnoseTaskInput = z.infer<typeof diagnoseTaskSchema>;

export const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Rendah" },
  { value: "MEDIUM", label: "Sedang" },
  { value: "HIGH", label: "Tinggi" },
  { value: "URGENT", label: "Mendesak" },
] as const;
