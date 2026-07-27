import { z } from "zod";

import { TIMEZONE_VALUES } from "@/lib/timezones";

export const updateSettingsSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nama minimal 2 karakter.")
      .max(80, "Nama maksimal 80 karakter.")
      .optional(),
    timezone: z
      .string()
      .refine((value) => TIMEZONE_VALUES.includes(value), {
        message: "Zona waktu tidak dikenali. Pilih dari daftar yang tersedia.",
      })
      .optional(),
    googleCalendarId: z.string().min(1).nullable().optional(),
    syncSessionsToCalendar: z.boolean().optional(),
    importCalendarEvents: z.boolean().optional(),
    focusChecklist: z.array(z.string()).max(20).optional(),
    markOnboarded: z.boolean().optional(),
  })
  .refine((values) => Object.keys(values).length > 0, {
    message: "Tidak ada perubahan yang dikirim.",
  });

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
