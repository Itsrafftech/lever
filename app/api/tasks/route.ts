import type { Prisma } from "@prisma/client";

import { fail, ok, parseBody, parseQuery, unauthorized } from "@/lib/api";
import { syncDailyCheckinSafely } from "@/lib/daily-metrics";
import { addDays, startOfDayInTimezone } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { TASK_INCLUDE, serializeTask } from "@/lib/serializers";
import { currentUser } from "@/lib/session";
import { createTaskSchema, listTasksSchema } from "@/lib/validations/task";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TaskWhere = Prisma.TaskWhereInput;

/**
 * "Today" means due today, scheduled today, or already in progress — anything
 * the user has committed to for the current day in *their* timezone.
 */
function todayWhere(dayStart: Date): TaskWhere {
  const dayEnd = addDays(dayStart, 1);
  return {
    status: { in: ["TODO", "IN_PROGRESS"] },
    OR: [
      { dueDate: { gte: dayStart, lt: dayEnd } },
      { scheduledFor: { gte: dayStart, lt: dayEnd } },
      { status: "IN_PROGRESS" },
    ],
  };
}

function overdueWhere(dayStart: Date): TaskWhere {
  return {
    status: { in: ["TODO", "IN_PROGRESS"] },
    dueDate: { lt: dayStart },
  };
}

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const query = parseQuery(request, listTasksSchema);
  if (!query.success) return query.response;

  const { q, view, status, goalId, priority, hasScore, dueFrom, dueTo, limit, offset } =
    query.data;

  const dayStart = startOfDayInTimezone(new Date(), user.timezone);

  const filters: TaskWhere = { userId: user.id };

  if (view === "today") Object.assign(filters, todayWhere(dayStart));
  else if (view === "overdue") Object.assign(filters, overdueWhere(dayStart));
  else if (view === "done") filters.status = { in: ["DONE", "SKIPPED"] };
  else if (view === "all") filters.status = { in: ["TODO", "IN_PROGRESS"] };

  if (q) {
    filters.title = { contains: q, mode: "insensitive" };
  }
  if (status) {
    const values = status.split(",").filter(Boolean);
    if (values.length > 0) filters.status = { in: values as never };
  }
  if (priority) {
    const values = priority.split(",").filter(Boolean);
    if (values.length > 0) filters.priority = { in: values as never };
  }
  if (goalId) {
    const values = goalId.split(",").filter(Boolean);
    if (values.includes("none")) {
      const rest = values.filter((value) => value !== "none");
      filters.OR = [
        { goalId: null },
        ...(rest.length > 0 ? [{ goalId: { in: rest } }] : []),
      ];
    } else if (values.length > 0) {
      filters.goalId = { in: values };
    }
  }
  if (hasScore === "true") filters.motivationScore = { not: null };
  if (hasScore === "false") filters.motivationScore = null;
  if (dueFrom || dueTo) {
    filters.dueDate = {
      ...(dueFrom ? { gte: new Date(dueFrom) } : {}),
      ...(dueTo ? { lte: new Date(dueTo) } : {}),
    };
  }

  const [tasks, total, todayCount, allCount, overdueCount, doneCount] =
    await Promise.all([
      prisma.task.findMany({
        where: filters,
        include: TASK_INCLUDE,
        orderBy:
          view === "done"
            ? [{ completedAt: "desc" }, { updatedAt: "desc" }]
            : view === "overdue"
              ? [{ dueDate: "asc" }, { priority: "desc" }]
              : [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: limit ?? 100,
        skip: offset ?? 0,
      }),
      prisma.task.count({ where: filters }),
      prisma.task.count({ where: { userId: user.id, ...todayWhere(dayStart) } }),
      prisma.task.count({
        where: { userId: user.id, status: { in: ["TODO", "IN_PROGRESS"] } },
      }),
      prisma.task.count({ where: { userId: user.id, ...overdueWhere(dayStart) } }),
      prisma.task.count({
        where: { userId: user.id, status: { in: ["DONE", "SKIPPED"] } },
      }),
    ]);

  return ok({
    tasks: tasks.map(serializeTask),
    total,
    counts: {
      today: todayCount,
      all: allCount,
      overdue: overdueCount,
      done: doneCount,
    },
  });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const parsed = await parseBody(request, createTaskSchema);
  if (!parsed.success) return parsed.response;

  const { goalId, dueDate, scheduledFor, ...rest } = parsed.data;

  if (goalId) {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: user.id },
      select: { id: true },
    });
    if (!goal) {
      return fail(
        "Tujuan yang dipilih tidak ditemukan di akun ini.",
        "GOAL_NOT_FOUND",
        422,
        { goalId: "Tujuan tidak valid." },
      );
    }
  }

  // New tasks go to the top of the manual order.
  const lowest = await prisma.task.aggregate({
    where: { userId: user.id },
    _min: { sortOrder: true },
  });

  const task = await prisma.task.create({
    data: {
      ...rest,
      userId: user.id,
      goalId: goalId ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      sortOrder: (lowest._min.sortOrder ?? 0) - 1,
    },
    include: TASK_INCLUDE,
  });

  // A new task with today's date changes the day's denominator, so the stored
  // metrics have to move with it.
  if (dueDate || scheduledFor) {
    await syncDailyCheckinSafely(user.id, user.timezone);
  }

  return ok({ task: serializeTask(task) }, 201);
}
