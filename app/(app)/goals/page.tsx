import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GoalsView } from "@/components/goals/GoalsView";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Tujuan",
  description:
    "Sampai lima tujuan aktif dengan satu North Star yang disematkan. Tugas yang terhubung ke tujuan bermakna lebih jarang ditunda.",
};

export default async function GoalsPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/signin");

  return <GoalsView timezone={user.timezone} />;
}
