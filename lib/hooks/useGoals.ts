"use client";

import useSWR from "swr";

import { fetcher, mutateJson } from "@/lib/fetcher";
import type { GoalDTO, GoalListResponse } from "@/types/api";
import type { CreateGoalInput, UpdateGoalInput } from "@/lib/validations/goal";

export const GOALS_KEY = "/api/goals";

export function useGoals(includeArchived = false) {
  const key = includeArchived ? `${GOALS_KEY}?includeArchived=true` : GOALS_KEY;

  const { data, error, isLoading, mutate } = useSWR<GoalListResponse>(
    key,
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    goals: data?.goals ?? [],
    limit: data?.limit ?? 5,
    remaining: data?.remaining ?? 0,
    pinnedGoal: data?.goals.find((goal) => goal.isPinned && !goal.isArchived),
    isLoading,
    error,
    mutate,
  };
}

export async function createGoal(input: CreateGoalInput): Promise<GoalDTO> {
  const result = await mutateJson<{ goal: GoalDTO }>(GOALS_KEY, "POST", input);
  return result.goal;
}

export async function updateGoal(
  id: string,
  input: UpdateGoalInput,
): Promise<GoalDTO> {
  const result = await mutateJson<{ goal: GoalDTO }>(
    `${GOALS_KEY}/${id}`,
    "PATCH",
    input,
  );
  return result.goal;
}

export async function archiveGoal(id: string): Promise<GoalDTO> {
  const result = await mutateJson<{ goal: GoalDTO }>(
    `${GOALS_KEY}/${id}`,
    "DELETE",
  );
  return result.goal;
}
