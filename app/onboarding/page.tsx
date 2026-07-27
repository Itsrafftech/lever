import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Mulai",
  description:
    "Tiga langkah singkat: tentukan North Star, pilih zona waktu, lalu hubungkan kalender kalau mau.",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      timezone: true,
      onboardedAt: true,
      googleRefreshToken: true,
      _count: { select: { goals: true } },
    },
  });

  if (!user) redirect("/auth/signin");
  if (user.onboardedAt) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] px-4 py-10">
      <div className="w-full max-w-[480px]">
        <div className="mb-6 flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] font-mono text-[0.9375rem] font-medium text-white"
          >
            L
          </span>
          <span className="text-[1.125rem] font-semibold tracking-tight">
            LEVER
          </span>
        </div>

        <OnboardingWizard
          initialTimezone={user.timezone}
          hasGoal={user._count.goals > 0}
          calendarConnected={Boolean(user.googleRefreshToken)}
        />
      </div>
    </div>
  );
}
