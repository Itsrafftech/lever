import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TasksView } from "@/components/tasks/TasksView";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Tugas",
  description:
    "Kelola tugas hari ini, tugas terlambat, dan riwayat selesai. Diagnosa setiap tugas dengan formula Steel untuk menemukan tuas yang macet.",
};

export default async function TasksPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/signin");

  return <TasksView timezone={user.timezone} />;
}
