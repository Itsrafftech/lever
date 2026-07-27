"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { NotebookPen } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  CheckinModal,
  type CheckinTodayData,
} from "@/components/checkin/CheckinModal";
import { fetcher } from "@/lib/fetcher";

const DISMISS_KEY = "lever:checkin-dismissed";

interface CheckinResponse {
  today: CheckinTodayData;
}

/** Hour of day in the user's own timezone, not the browser's. */
function hourInTimezone(timezone: string): number {
  const value = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(new Date());
  return Number(value);
}

export function CheckinTrigger({ timezone }: { timezone: string }) {
  const { data, mutate } = useSWR<CheckinResponse>("/api/checkins", fetcher, {
    revalidateOnFocus: false,
  });

  const [open, setOpen] = useState(false);
  const [autoChecked, setAutoChecked] = useState(false);

  const today = data?.today;

  useEffect(() => {
    if (!today || autoChecked) return;
    setAutoChecked(true);

    if (today.submitted) return;
    if (hourInTimezone(timezone) < 18) return;
    // Dismissal is per-day so the prompt returns tomorrow evening.
    if (window.localStorage.getItem(DISMISS_KEY) === today.date) return;

    setOpen(true);
  }, [today, autoChecked, timezone]);

  if (!today) return null;

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        icon={<NotebookPen className="h-4 w-4" aria-hidden />}
        onClick={() => setOpen(true)}
      >
        {today.submitted ? "Ubah refleksi" : "Refleksi harian"}
      </Button>

      {open ? (
        <CheckinModal
          today={today}
          timezone={timezone}
          onClose={() => {
            window.localStorage.setItem(DISMISS_KEY, today.date);
            setOpen(false);
          }}
          onSaved={() => {
            setOpen(false);
            void mutate();
          }}
        />
      ) : null}
    </>
  );
}
