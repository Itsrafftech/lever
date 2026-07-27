import type { FocusSession, Goal, Intention, Task } from "@prisma/client";

import type {
  FocusSessionDTO,
  GoalDTO,
  IntentionDTO,
  TaskDTO,
} from "@/types/api";

type GoalWithTasks = Goal & {
  tasks?: Pick<Task, "status">[];
};

export function serializeGoal(goal: GoalWithTasks): GoalDTO {
  const tasks = goal.tasks ?? [];
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    category: goal.category,
    progress: goal.progress,
    isPinned: goal.isPinned,
    isArchived: goal.isArchived,
    targetDate: goal.targetDate?.toISOString() ?? null,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
    activeTaskCount: tasks.filter(
      (task) => task.status === "TODO" || task.status === "IN_PROGRESS",
    ).length,
    totalTaskCount: tasks.length,
  };
}

export function serializeIntention(intention: Intention): IntentionDTO {
  return {
    id: intention.id,
    taskId: intention.taskId,
    ifClause: intention.ifClause,
    thenClause: intention.thenClause,
    atTime: intention.atTime,
    daysOfWeek: intention.daysOfWeek,
    isActive: intention.isActive,
    lastActivatedAt: intention.lastActivatedAt?.toISOString() ?? null,
    createdAt: intention.createdAt.toISOString(),
  };
}

export type TaskWithRelations = Task & {
  goal?: Pick<Goal, "id" | "title" | "category"> | null;
  intention?: Intention | null;
  _count?: { focusSessions: number };
};

export function serializeTask(task: TaskWithRelations): TaskDTO {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate?.toISOString() ?? null,
    scheduledFor: task.scheduledFor?.toISOString() ?? null,
    sortOrder: task.sortOrder,

    expectancy: task.expectancy,
    value: task.value,
    impulsiveness: task.impulsiveness,
    delay: task.delay,
    motivationScore: task.motivationScore,

    estimatedMinutes: task.estimatedMinutes,
    actualMinutes: task.actualMinutes,
    calendarEventId: task.calendarEventId,

    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    startedAt: task.startedAt?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    skippedAt: task.skippedAt?.toISOString() ?? null,
    skippedReason: task.skippedReason,

    goal: task.goal
      ? { id: task.goal.id, title: task.goal.title, category: task.goal.category }
      : null,
    intention: task.intention ? serializeIntention(task.intention) : null,
    focusSessionCount: task._count?.focusSessions ?? 0,
  };
}

type SessionWithTask = FocusSession & {
  task?: Pick<Task, "id" | "title" | "status"> | null;
};

export function serializeSession(session: SessionWithTask): FocusSessionDTO {
  return {
    id: session.id,
    type: session.type,
    durationMins: session.durationMins,
    status: session.status,
    plannedStart: session.plannedStart.toISOString(),
    actualStart: session.actualStart?.toISOString() ?? null,
    completedAt: session.completedAt?.toISOString() ?? null,
    abandonedAt: session.abandonedAt?.toISOString() ?? null,
    timeToStartSecs: session.timeToStartSecs,
    intentionText: session.intentionText,
    notes: session.notes,
    rating: session.rating,
    calendarEventId: session.calendarEventId,
    createdAt: session.createdAt.toISOString(),
    task: session.task
      ? { id: session.task.id, title: session.task.title, status: session.task.status }
      : null,
  };
}

export const SESSION_INCLUDE = {
  task: { select: { id: true, title: true, status: true } },
} as const;

/** Relation shape every task endpoint selects, so DTOs are always complete. */
export const TASK_INCLUDE = {
  goal: { select: { id: true, title: true, category: true } },
  intention: true,
  _count: { select: { focusSessions: true } },
} as const;
