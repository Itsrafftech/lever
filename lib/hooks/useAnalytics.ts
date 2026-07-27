"use client";

import useSWR from "swr";

import { fetcher } from "@/lib/fetcher";

export interface DayPoint {
  date: string;
  completionRate: number | null;
  tasksPlanned: number;
  tasksCompleted: number;
  avgTimeToStartSecs: number | null;
  focusMinutes: number;
  scheduleAdherence: number | null;
  sessionsStarted: number;
  sessionsOnTime: number;
}

export interface HourPoint {
  hour: number;
  procrastination: number;
  skips: number;
  lateStarts: number;
  completed: number;
}

export interface SkipReasonPoint {
  code: string;
  label: string;
  count: number;
}

export interface ScoreBucket {
  bucket: string;
  from: number;
  to: number;
  count: number;
}

export interface ThirtyDayResponse {
  windowDays: number;
  from: string | null;
  to: string | null;
  days: DayPoint[];
  hours: HourPoint[];
  skipReasons: SkipReasonPoint[];
  scoreDistribution: ScoreBucket[];
  scoredTaskCount: number;
  unscoredTaskCount: number;
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

export interface Insight {
  id: string;
  title: string;
  detail: string;
  tone: "positive" | "neutral" | "warning";
  delta?: number | null;
  lowerIsBetter?: boolean;
}

export interface InsightsResponse {
  worstHour: { hour: number; events: number } | null;
  bestWeekday: { weekday: number; label: string; completed: number } | null;
  comparisons: MetricComparison[];
  insights: Insight[];
  unscoredTaskCount: number;
  openTaskCount: number;
}

export function useThirtyDays() {
  const { data, error, isLoading } = useSWR<ThirtyDayResponse>(
    "/api/analytics/30days",
    fetcher,
    { revalidateOnFocus: false },
  );
  return { data, error, isLoading };
}

export function useInsights() {
  const { data, error, isLoading } = useSWR<InsightsResponse>(
    "/api/analytics/insights",
    fetcher,
    { revalidateOnFocus: false },
  );
  return { data, error, isLoading };
}

export interface CheckinRow {
  id: string;
  date: string;
  tasksPlanned: number;
  tasksCompleted: number;
  focusMinutes: number;
  avgTimeToStartSecs: number | null;
  energyLevel: number | null;
  focusQuality: number | null;
  note: string | null;
}

export function useCheckins() {
  const { data, error, isLoading } = useSWR<{ checkins: CheckinRow[] }>(
    "/api/checkins?limit=120",
    fetcher,
    { revalidateOnFocus: false },
  );
  return { checkins: data?.checkins ?? [], error, isLoading };
}
