import { ok, unauthorized } from "@/lib/api";
import {
  ADHERENCE_GRACE_SECS,
  LATE_START_SECS,
  localHour,
  localWeekday,
  mean,
  percentDelta,
} from "@/lib/analytics";
import { addDays, startOfDayInTimezone } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WEEKDAY_NAMES = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

export type InsightTone = "positive" | "neutral" | "warning";

export interface Insight {
  id: string;
  title: string;
  detail: string;
  tone: InsightTone;
  /** Present when the insight compares two periods. */
  delta?: number | null;
  /** Lower values being better flips how a delta should be read. */
  lowerIsBetter?: boolean;
}

export interface MetricComparison {
  key: string;
  label: string;
  current: number | null;
  previous: number | null;
  delta: number | null;
  unit: "percent" | "minutes" | "seconds" | "count";
  lowerIsBetter: boolean;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();

  const todayStart = startOfDayInTimezone(new Date(), user.timezone);
  const thisWeekStart = addDays(todayStart, -6);
  const lastWeekStart = addDays(todayStart, -13);
  const windowStart = addDays(todayStart, -29);
  const windowEnd = addDays(todayStart, 1);

  const [closedTasks, sessions, unscored, totalOpen] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId: user.id,
        OR: [
          { completedAt: { gte: windowStart, lt: windowEnd } },
          { skippedAt: { gte: windowStart, lt: windowEnd } },
        ],
      },
      select: { status: true, completedAt: true, skippedAt: true },
    }),
    prisma.focusSession.findMany({
      where: { userId: user.id, actualStart: { gte: windowStart, lt: windowEnd } },
      select: {
        actualStart: true,
        completedAt: true,
        abandonedAt: true,
        timeToStartSecs: true,
      },
    }),
    prisma.task.count({
      where: {
        userId: user.id,
        motivationScore: null,
        status: { in: ["TODO", "IN_PROGRESS"] },
      },
    }),
    prisma.task.count({
      where: { userId: user.id, status: { in: ["TODO", "IN_PROGRESS"] } },
    }),
  ]);

  /* ---- Worst procrastination hour ------------------------------------- */

  const hourScore = new Array<number>(24).fill(0);
  for (const task of closedTasks) {
    if (task.status === "SKIPPED" && task.skippedAt) {
      hourScore[localHour(task.skippedAt, user.timezone)] += 1;
    }
  }
  for (const session of sessions) {
    if (
      session.actualStart &&
      session.timeToStartSecs !== null &&
      session.timeToStartSecs > LATE_START_SECS
    ) {
      hourScore[localHour(session.actualStart, user.timezone)] += 1;
    }
  }

  const worstHourValue = Math.max(...hourScore);
  const worstHour = worstHourValue > 0 ? hourScore.indexOf(worstHourValue) : null;

  /* ---- Best completion day of week ------------------------------------ */

  const byWeekday = new Array<number>(7).fill(0);
  for (const task of closedTasks) {
    if (task.status === "DONE" && task.completedAt) {
      byWeekday[localWeekday(task.completedAt, user.timezone)] += 1;
    }
  }
  const bestDayValue = Math.max(...byWeekday);
  const bestWeekday = bestDayValue > 0 ? byWeekday.indexOf(bestDayValue) : null;

  /* ---- This week vs last week ----------------------------------------- */

  const thisWeek = summarize(closedTasks, sessions, thisWeekStart, windowEnd);
  const lastWeek = summarize(closedTasks, sessions, lastWeekStart, thisWeekStart);

  const comparisons: MetricComparison[] = [
    {
      key: "tasksCompleted",
      label: "Tugas selesai",
      current: thisWeek.tasksCompleted,
      previous: lastWeek.tasksCompleted,
      delta: percentDelta(thisWeek.tasksCompleted, lastWeek.tasksCompleted),
      unit: "count",
      lowerIsBetter: false,
    },
    {
      key: "focusMinutes",
      label: "Menit fokus",
      current: thisWeek.focusMinutes,
      previous: lastWeek.focusMinutes,
      delta: percentDelta(thisWeek.focusMinutes, lastWeek.focusMinutes),
      unit: "minutes",
      lowerIsBetter: false,
    },
    {
      key: "avgTimeToStart",
      label: "Time-to-start rata-rata",
      current: thisWeek.avgTimeToStart,
      previous: lastWeek.avgTimeToStart,
      delta: percentDelta(thisWeek.avgTimeToStart, lastWeek.avgTimeToStart),
      unit: "seconds",
      lowerIsBetter: true,
    },
    {
      key: "adherence",
      label: "Kepatuhan jadwal",
      current: thisWeek.adherence,
      previous: lastWeek.adherence,
      delta: percentDelta(thisWeek.adherence, lastWeek.adherence),
      unit: "percent",
      lowerIsBetter: false,
    },
    {
      key: "skipped",
      label: "Tugas dilewati",
      current: thisWeek.tasksSkipped,
      previous: lastWeek.tasksSkipped,
      delta: percentDelta(thisWeek.tasksSkipped, lastWeek.tasksSkipped),
      unit: "count",
      lowerIsBetter: true,
    },
  ];

  /* ---- Narrative insights --------------------------------------------- */

  const insights: Insight[] = [];

  if (worstHour !== null) {
    insights.push({
      id: "worst-hour",
      title: `Jam ${String(worstHour).padStart(2, "0")}.00 paling rawan menunda`,
      detail: `${worstHourValue} kejadian menunda (tugas dilewati atau sesi mulai lebih dari 30 menit terlambat) terjadi di jam ini selama 30 hari terakhir. Jadwalkan tugas yang paling mudah di jam tersebut, bukan yang paling berat.`,
      tone: "warning",
    });
  } else {
    insights.push({
      id: "worst-hour",
      title: "Belum ada pola jam rawan",
      detail:
        "Belum ada tugas yang dilewati atau sesi yang mulai jauh terlambat dalam 30 hari terakhir. Pola akan muncul setelah lebih banyak sesi tercatat.",
      tone: "positive",
    });
  }

  if (bestWeekday !== null) {
    insights.push({
      id: "best-day",
      title: `${WEEKDAY_NAMES[bestWeekday]} adalah hari terbaikmu`,
      detail: `${bestDayValue} tugas selesai pada hari ${WEEKDAY_NAMES[bestWeekday]} dalam 30 hari terakhir — lebih banyak dari hari lain. Letakkan tugas dengan Expectancy rendah di hari ini.`,
      tone: "positive",
    });
  }

  const startDelta = comparisons.find((item) => item.key === "avgTimeToStart");
  if (startDelta?.delta !== null && startDelta?.delta !== undefined) {
    const improving = startDelta.delta < 0;
    insights.push({
      id: "time-to-start-trend",
      title: improving
        ? `Time-to-start turun ${Math.abs(startDelta.delta)}% minggu ini`
        : `Time-to-start naik ${startDelta.delta}% minggu ini`,
      detail: improving
        ? "Jeda antara rencana dan mulai mengecil. Ini metrik anti-prokrastinasi yang paling langsung — apa pun yang kamu ubah minggu ini, pertahankan."
        : "Jeda antara niat dan tindakan melebar. Coba perpendek langkah pertama: satu tugas 10 menit yang sangat jelas, bukan blok 60 menit.",
      tone: improving ? "positive" : "warning",
      delta: startDelta.delta,
      lowerIsBetter: true,
    });
  }

  if (unscored > 0) {
    const share = totalOpen > 0 ? Math.round((unscored / totalOpen) * 100) : 0;
    insights.push({
      id: "unscored-tasks",
      title: `${unscored} tugas aktif belum didiagnosa`,
      detail: `${share}% tugas aktif belum punya skor Steel. Tugas yang tidak didiagnosa tidak punya intervensi yang ditargetkan — dan itu yang paling sering berakhir ditunda.`,
      tone: share >= 50 ? "warning" : "neutral",
    });
  }

  return ok({
    worstHour:
      worstHour === null ? null : { hour: worstHour, events: worstHourValue },
    bestWeekday:
      bestWeekday === null
        ? null
        : {
            weekday: bestWeekday,
            label: WEEKDAY_NAMES[bestWeekday],
            completed: bestDayValue,
          },
    comparisons,
    insights,
    unscoredTaskCount: unscored,
    openTaskCount: totalOpen,
  });
}

interface WeekSummary {
  tasksCompleted: number;
  tasksSkipped: number;
  focusMinutes: number;
  avgTimeToStart: number | null;
  adherence: number | null;
}

function summarize(
  tasks: {
    status: string;
    completedAt: Date | null;
    skippedAt: Date | null;
  }[],
  sessions: {
    actualStart: Date | null;
    completedAt: Date | null;
    abandonedAt: Date | null;
    timeToStartSecs: number | null;
  }[],
  from: Date,
  to: Date,
): WeekSummary {
  const inRange = (date: Date | null) =>
    date !== null && date >= from && date < to;

  let tasksCompleted = 0;
  let tasksSkipped = 0;
  for (const task of tasks) {
    if (task.status === "DONE" && inRange(task.completedAt)) tasksCompleted += 1;
    if (task.status === "SKIPPED" && inRange(task.skippedAt)) tasksSkipped += 1;
  }

  let focusMinutes = 0;
  let onTime = 0;
  let started = 0;
  const delays: number[] = [];

  for (const session of sessions) {
    if (!inRange(session.actualStart) || !session.actualStart) continue;
    started += 1;

    const end = session.completedAt ?? session.abandonedAt;
    if (end) {
      focusMinutes += Math.max(
        0,
        Math.round((end.getTime() - session.actualStart.getTime()) / 60000),
      );
    }
    if (session.timeToStartSecs !== null) {
      delays.push(session.timeToStartSecs);
      if (session.timeToStartSecs <= ADHERENCE_GRACE_SECS) onTime += 1;
    }
  }

  const average = mean(delays);

  return {
    tasksCompleted,
    tasksSkipped,
    focusMinutes,
    avgTimeToStart: average === null ? null : Math.round(average),
    adherence: started > 0 ? Math.round((onTime / started) * 100) : null,
  };
}
