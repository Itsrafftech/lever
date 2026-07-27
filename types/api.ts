/**
 * DTOs as they appear on the wire: Prisma `DateTime` is serialized to an ISO
 * string by `NextResponse.json`, so client code must never expect `Date`.
 */

export type GoalCategory =
  | "PERSONAL"
  | "WORK"
  | "HEALTH"
  | "LEARNING"
  | "FINANCIAL"
  | "RELATIONSHIP";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "SKIPPED";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type SessionType = "POMODORO" | "DEEP_WORK" | "QUICK";
export type SessionStatus = "ACTIVE" | "COMPLETED" | "ABANDONED";

export interface GoalDTO {
  id: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  progress: number;
  isPinned: boolean;
  isArchived: boolean;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
  /** Tasks not yet done or skipped. */
  activeTaskCount: number;
  totalTaskCount: number;
}

export interface GoalListResponse {
  goals: GoalDTO[];
  limit: number;
  remaining: number;
}

export interface TaskGoalRef {
  id: string;
  title: string;
  category: GoalCategory;
}

export interface IntentionDTO {
  id: string;
  taskId: string;
  ifClause: string;
  thenClause: string;
  atTime: string | null;
  daysOfWeek: number[];
  isActive: boolean;
  lastActivatedAt: string | null;
  createdAt: string;
}

export interface TaskDTO {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  scheduledFor: string | null;
  sortOrder: number;

  expectancy: number | null;
  value: number | null;
  impulsiveness: number | null;
  delay: number | null;
  motivationScore: number | null;

  estimatedMinutes: number | null;
  actualMinutes: number | null;
  calendarEventId: string | null;

  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  skippedAt: string | null;
  skippedReason: string | null;

  goal: TaskGoalRef | null;
  intention: IntentionDTO | null;
  focusSessionCount: number;
}

export interface SessionTaskRef {
  id: string;
  title: string;
  status: TaskStatus;
}

export interface FocusSessionDTO {
  id: string;
  type: SessionType;
  durationMins: number;
  status: SessionStatus;
  plannedStart: string;
  actualStart: string | null;
  completedAt: string | null;
  abandonedAt: string | null;
  timeToStartSecs: number | null;
  intentionText: string | null;
  notes: string | null;
  rating: number | null;
  calendarEventId: string | null;
  createdAt: string;
  task: SessionTaskRef | null;
}

export interface SessionListResponse {
  sessions: FocusSessionDTO[];
  active: FocusSessionDTO | null;
}

export interface TaskListResponse {
  tasks: TaskDTO[];
  total: number;
  counts: {
    today: number;
    all: number;
    overdue: number;
    done: number;
  };
}
