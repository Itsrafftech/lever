"use client";

import useSWR from "swr";

import { fetcher, mutateJson } from "@/lib/fetcher";
import type { TaskDTO, TaskListResponse } from "@/types/api";
import type {
  CreateTaskInput,
  DiagnoseTaskInput,
  UpdateTaskInput,
} from "@/lib/validations/task";
import type { Intervention } from "@/lib/steel-formula";

export type TaskView = "today" | "all" | "overdue" | "done";

export interface TaskFilters {
  goalIds?: string[];
  priorities?: string[];
  hasScore?: "true" | "false";
  dueFrom?: string;
  dueTo?: string;
}

export function taskKey(view: TaskView, filters: TaskFilters = {}): string {
  const params = new URLSearchParams({ view });
  if (filters.goalIds?.length) params.set("goalId", filters.goalIds.join(","));
  if (filters.priorities?.length)
    params.set("priority", filters.priorities.join(","));
  if (filters.hasScore) params.set("hasScore", filters.hasScore);
  if (filters.dueFrom) params.set("dueFrom", filters.dueFrom);
  if (filters.dueTo) params.set("dueTo", filters.dueTo);
  return `/api/tasks?${params.toString()}`;
}

export function useTasks(view: TaskView, filters: TaskFilters = {}) {
  const key = taskKey(view, filters);

  const { data, error, isLoading, mutate } = useSWR<TaskListResponse>(
    key,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true },
  );

  return {
    tasks: data?.tasks ?? [],
    total: data?.total ?? 0,
    counts: data?.counts ?? { today: 0, all: 0, overdue: 0, done: 0 },
    isLoading,
    error,
    mutate,
    key,
  };
}

export async function createTask(input: CreateTaskInput): Promise<TaskDTO> {
  const result = await mutateJson<{ task: TaskDTO }>("/api/tasks", "POST", input);
  return result.task;
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
): Promise<TaskDTO> {
  const result = await mutateJson<{ task: TaskDTO }>(
    `/api/tasks/${id}`,
    "PATCH",
    input,
  );
  return result.task;
}

export async function completeTask(id: string): Promise<TaskDTO> {
  const result = await mutateJson<{ task: TaskDTO }>(
    `/api/tasks/${id}/complete`,
    "POST",
  );
  return result.task;
}

export async function skipTask(
  id: string,
  reason: string,
  note?: string,
): Promise<TaskDTO> {
  const result = await mutateJson<{ task: TaskDTO }>(
    `/api/tasks/${id}/skip`,
    "POST",
    { reason, ...(note ? { note } : {}) },
  );
  return result.task;
}

export async function deleteTask(id: string): Promise<void> {
  await mutateJson<{ id: string }>(`/api/tasks/${id}`, "DELETE");
}

export async function diagnoseTask(
  id: string,
  input: DiagnoseTaskInput,
): Promise<{
  task: TaskDTO;
  diagnosis: {
    score: number;
    rawRatio: number;
    risk: "low" | "medium" | "high";
    interventions: Intervention[];
  };
}> {
  return mutateJson(`/api/tasks/${id}/diagnose`, "POST", input);
}

export async function reorderTasks(ids: string[]): Promise<void> {
  await mutateJson<{ ordered: number }>("/api/tasks/reorder", "POST", { ids });
}
