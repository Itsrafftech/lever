import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardView } from "@/components/dashboard/DashboardView";
import { formatLongDate } from "@/lib/date";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Ringkasan hari ini: North Star, tugas yang jatuh tempo, jadwal sesi fokus, dan tren penyelesaian tujuh hari terakhir.",
};

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/signin");

  const firstName = user.name?.trim().split(/\s+/)[0] ?? "kamu";

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {formatLongDate(new Date(), user.timezone)}
        </p>
        <h2 className="mt-0.5 text-[1.5rem] font-semibold">Halo, {firstName}</h2>
      </div>

      <DashboardView timezone={user.timezone} />
    </div>
  );
}
