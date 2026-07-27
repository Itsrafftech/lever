"use client";

import useSWR from "swr";

import { fetcher, mutateJson } from "@/lib/fetcher";
import type { FocusSessionDTO, SessionListResponse } from "@/types/api";
import type {
  CompleteSessionInput,
  CreateSessionInput,
} from "@/lib/validations/session";

export const SESSIONS_KEY = "/api/sessions";

export function useSessions(query = "") {
  const key = query ? `${SESSIONS_KEY}?${query}` : SESSIONS_KEY;

  const { data, error, isLoading, mutate } = useSWR<SessionListResponse>(
    key,
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    sessions: data?.sessions ?? [],
    active: data?.active ?? null,
    isLoading,
    error,
    mutate,
  };
}

export async function createSession(
  input: CreateSessionInput,
): Promise<FocusSessionDTO> {
  const result = await mutateJson<{ session: FocusSessionDTO }>(
    SESSIONS_KEY,
    "POST",
    input,
  );
  return result.session;
}

export async function startSession(id: string): Promise<FocusSessionDTO> {
  const result = await mutateJson<{ session: FocusSessionDTO }>(
    `${SESSIONS_KEY}/${id}/start`,
    "PATCH",
  );
  return result.session;
}

export async function completeSession(
  id: string,
  input: CompleteSessionInput,
): Promise<{ session: FocusSessionDTO; elapsedMinutes: number }> {
  return mutateJson(`${SESSIONS_KEY}/${id}/complete`, "PATCH", input);
}

export async function abandonSession(
  id: string,
  notes?: string,
): Promise<{ session: FocusSessionDTO; elapsedMinutes: number }> {
  return mutateJson(`${SESSIONS_KEY}/${id}/abandon`, "PATCH", {
    notes: notes ?? null,
  });
}
