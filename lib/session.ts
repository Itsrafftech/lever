import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  timezone: string;
  onboardedAt: Date | null;
}

/** Returns the signed-in user's id, or null. Use inside API routes. */
export async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * Loads the user row for the current session. Returns null when the session
 * exists but the row is gone (deleted account with a still-valid JWT).
 */
export async function currentUser(): Promise<SessionUser | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      timezone: true,
      onboardedAt: true,
    },
  });
}
