import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { IntentionsView } from "@/components/intentions/IntentionsView";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Niat Jika-Maka",
  description:
    "Implementation intentions yang menghubungkan situasi konkret dengan tindakan konkret, lengkap dengan tingkat aktivasinya.",
};

export default async function IntentionsPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/signin");

  return <IntentionsView timezone={user.timezone} />;
}
