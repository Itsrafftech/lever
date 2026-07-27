import { z } from "zod";

export const SESSION_TYPES = ["POMODORO", "DEEP_WORK", "QUICK"] as const;

export const DURATION_PRESETS = [
  { minutes: 10, label: "10 menit", type: "QUICK" as const, hint: "Pemanasan" },
  { minutes: 25, label: "25 menit", type: "POMODORO" as const, hint: "Pomodoro" },
  { minutes: 45, label: "45 menit", type: "DEEP_WORK" as const, hint: "Deep work" },
  { minutes: 60, label: "60 menit", type: "DEEP_WORK" as const, hint: "Deep work" },
];

export const ENVIRONMENT_CHECKLIST = [
  { id: "phone", label: "HP di luar jangkauan atau mode senyap" },
  { id: "tabs", label: "Tab browser tidak relevan sudah ditutup" },
  { id: "drink", label: "Minuman sudah siap" },
  { id: "first-step", label: "Tahu persis apa yang akan dikerjakan pertama" },
];

export const createSessionSchema = z.object({
  taskId: z.string().cuid("ID tugas tidak valid.").nullable().optional(),
  type: z.enum(SESSION_TYPES).default("POMODORO"),
  durationMins: z
    .number()
    .int("Durasi harus bilangan bulat menit.")
    .min(5, "Durasi minimal 5 menit.")
    .max(180, "Durasi maksimal 180 menit. Pecah menjadi beberapa sesi."),
  plannedStart: z.string().datetime({ offset: true }),
  intentionText: z
    .string()
    .trim()
    .max(500, "Teks niat maksimal 500 karakter.")
    .nullable()
    .optional(),
});

export const completeSessionSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Nilai minimal 1 bintang.")
    .max(5, "Nilai maksimal 5 bintang.")
    .nullable()
    .optional(),
  notes: z
    .string()
    .trim()
    .max(1000, "Catatan maksimal 1000 karakter.")
    .nullable()
    .optional(),
  completeTask: z.boolean().optional(),
});

export const abandonSessionSchema = z.object({
  notes: z
    .string()
    .trim()
    .max(1000, "Catatan maksimal 1000 karakter.")
    .nullable()
    .optional(),
});

export const listSessionsSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  taskId: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type CompleteSessionInput = z.infer<typeof completeSessionSchema>;
