import type { Prisma } from "@prisma/client";

import { fail, ok, parseBody, parseQuery, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { SESSION_INCLUDE, serializeSession } from "@/lib/serializers";
import { currentUserId } from "@/lib/session";
import { pushSessionToCalendar } from "@/lib/session-calendar";
import { createSessionSchema, listSessionsSchema } from "@/lib/validations/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const query = parseQuery(request, listSessionsSchema);
  if (!query.success) return query.response;

  const { from, to, taskId, status, limit } = query.data;

  const where: Prisma.FocusSessionWhereInput = { userId };
  if (taskId) where.taskId = taskId;
  if (status) {
    const values = status.split(",").filter(Boolean);
    if (values.length > 0) where.status = { in: values as never };
  }
  if (from || to) {
    where.plannedStart = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const [sessions, active] = await Promise.all([
    prisma.focusSession.findMany({
      where,
      include: SESSION_INCLUDE,
      orderBy: { plannedStart: "desc" },
      take: limit ?? 50,
    }),
    // Only one session can be running at a time; the UI resumes it on load.
    prisma.focusSession.findFirst({
      where: { userId, status: "ACTIVE", actualStart: { not: null } },
      include: SESSION_INCLUDE,
      orderBy: { actualStart: "desc" },
    }),
  ]);

  return ok({
    sessions: sessions.map(serializeSession),
    active: active ? serializeSession(active) : null,
  });
}

export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const parsed = await parseBody(request, createSessionSchema);
  if (!parsed.success) return parsed.response;

  const { taskId, plannedStart, intentionText, ...rest } = parsed.data;

  if (taskId) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
      select: { id: true },
    });
    if (!task) {
      return fail(
        "Tugas yang dipilih tidak ditemukan di akun ini.",
        "TASK_NOT_FOUND",
        422,
      );
    }
  }

  const running = await prisma.focusSession.findFirst({
    where: { userId, status: "ACTIVE", actualStart: { not: null } },
    select: { id: true },
  });
  if (running) {
    return fail(
      "Masih ada sesi fokus yang berjalan. Selesaikan atau tinggalkan sesi itu sebelum memulai yang baru.",
      "SESSION_ALREADY_RUNNING",
      409,
    );
  }

  const session = await prisma.focusSession.create({
    data: {
      ...rest,
      userId,
      taskId: taskId ?? null,
      plannedStart: new Date(plannedStart),
      intentionText: intentionText ?? null,
    },
    include: SESSION_INCLUDE,
  });

  // Best-effort: a calendar outage must not stop the session from starting.
  const calendarEventId = await pushSessionToCalendar(userId, session.id);

  return ok(
    {
      session: serializeSession({ ...session, calendarEventId }),
      calendarSynced: Boolean(calendarEventId),
    },
    201,
  );
}
