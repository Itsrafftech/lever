"use client";

import useSWR from "swr";

import { fetcher, mutateJson } from "@/lib/fetcher";
import type { IntentionDTO, TaskStatus } from "@/types/api";
import type { UpdateIntentionInput } from "@/lib/validations/intention";

export interface IntentionWithTask extends IntentionDTO {
  task: {
    id: string;
    title: string;
    status: TaskStatus;
    goalTitle: string | null;
  };
  activation: {
    opportunities: number;
    startedSessions: number;
    rate: number;
  };
}

export const INTENTIONS_KEY = "/api/intentions";

export function useIntentions() {
  const { data, error, isLoading, mutate } = useSWR<{
    intentions: IntentionWithTask[];
  }>(INTENTIONS_KEY, fetcher, { revalidateOnFocus: false });

  return {
    intentions: data?.intentions ?? [],
    isLoading,
    error,
    mutate,
  };
}

export async function updateIntention(
  id: string,
  input: UpdateIntentionInput,
): Promise<IntentionDTO> {
  const result = await mutateJson<{ intention: IntentionDTO }>(
    `${INTENTIONS_KEY}/${id}`,
    "PATCH",
    input,
  );
  return result.intention;
}

export async function deleteIntention(id: string): Promise<void> {
  await mutateJson<{ id: string }>(`${INTENTIONS_KEY}/${id}`, "DELETE");
}
