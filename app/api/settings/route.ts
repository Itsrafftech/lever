import { notFound, ok, parseBody, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/session";
import { updateSettingsSchema } from "@/lib/validations/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SELECT = {
  id: true,
  email: true,
  name: true,
  image: true,
  timezone: true,
  googleCalendarId: true,
  syncSessionsToCalendar: true,
  importCalendarEvents: true,
  calendarLastSyncedAt: true,
  focusChecklist: true,
  onboardedAt: true,
  googleRefreshToken: true,
} as const;

type UserRow = {
  focusChecklist: string | null;
  googleRefreshToken: string | null;
  calendarLastSyncedAt: Date | null;
  onboardedAt: Date | null;
} & Record<string, unknown>;

function serialize(user: UserRow) {
  const { googleRefreshToken, focusChecklist, ...rest } = user;
  let checklist: string[] = [];
  if (focusChecklist) {
    try {
      const parsed: unknown = JSON.parse(focusChecklist);
      if (Array.isArray(parsed)) {
        checklist = parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      checklist = [];
    }
  }

  return {
    ...rest,
    focusChecklist: checklist,
    // Never leak the token itself — only whether a connection exists.
    calendarConnected: Boolean(googleRefreshToken),
    calendarLastSyncedAt: user.calendarLastSyncedAt?.toISOString() ?? null,
    onboardedAt: user.onboardedAt?.toISOString() ?? null,
  };
}

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: SELECT,
  });
  if (!user) return notFound("Akun");

  return ok({ settings: serialize(user as UserRow) });
}

export async function PATCH(request: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const parsed = await parseBody(request, updateSettingsSchema);
  if (!parsed.success) return parsed.response;

  const { focusChecklist, markOnboarded, ...rest } = parsed.data;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...rest,
      ...(focusChecklist ? { focusChecklist: JSON.stringify(focusChecklist) } : {}),
      ...(markOnboarded ? { onboardedAt: new Date() } : {}),
    },
    select: SELECT,
  });

  return ok({ settings: serialize(user as UserRow) });
}
