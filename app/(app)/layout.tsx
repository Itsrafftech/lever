import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { currentUser } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  // Every authenticated surface is gated on finishing the 3-step wizard.
  if (!user.onboardedAt) {
    redirect("/onboarding");
  }

  return (
    <AppShell
      user={{ name: user.name, email: user.email, image: user.image }}
    >
      {children}
    </AppShell>
  );
}
