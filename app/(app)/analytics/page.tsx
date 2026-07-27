import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Analitik",
  description:
    "Tren 30 hari: tingkat penyelesaian, time-to-start, menit fokus, jam rawan menunda, alasan melewati tugas, dan distribusi skor Steel.",
};

export default async function AnalyticsPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/signin");

  return <AnalyticsView />;
}
