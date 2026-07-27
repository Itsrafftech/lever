import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CalendarSetup } from "@/components/calendar/CalendarSetup";
import { AccountSection } from "@/components/settings/AccountSection";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Pengaturan",
  description:
    "Hubungkan Google Calendar, pilih kalender tujuan, atur zona waktu, ubah password, atau hapus akun beserta seluruh datanya.",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, timezone: true, passwordHash: true },
  });
  if (!user) redirect("/auth/signin");

  return (
    <div className="mx-auto max-w-[680px] space-y-5">
      <CalendarSetup timezone={user.timezone} />
      <AccountSection
        email={user.email}
        timezone={user.timezone}
        hasPassword={Boolean(user.passwordHash)}
      />
    </div>
  );
}
