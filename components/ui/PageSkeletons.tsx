import { Skeleton } from "@/components/ui/Skeleton";

/** Rows that mirror the collapsed TaskItem layout. */
export function TaskListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="lever-card overflow-hidden">
      <div className="border-b border-[var(--border)] px-3 py-2.5">
        <Skeleton className="h-4 w-32" />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5 last:border-b-0"
        >
          <Skeleton className="h-[18px] w-[18px] rounded-[5px]" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-5 w-7" />
        </div>
      ))}
    </div>
  );
}

export function StatTilesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="lever-card p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-[104px] w-full rounded-[var(--radius-lg)]" />
      <StatTilesSkeleton />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="min-w-0 space-y-4 lg:col-span-3">
          <TaskListSkeleton rows={3} />
        </div>
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <div className="lever-card p-4">
            <Skeleton className="h-5 w-32" />
            <div className="mt-3 space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="lever-card p-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-3 h-[180px] w-full" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="lever-card space-y-3 p-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-1.5 w-full" />
        </div>
      ))}
    </div>
  );
}

export function ChartGridSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-4 w-64" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="lever-card p-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-1.5 h-4 w-56" />
            <Skeleton className="mt-4 h-[220px] w-full" />
          </div>
        ))}
      </div>
      <div className="lever-card p-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-4 h-[180px] w-full" />
      </div>
    </div>
  );
}

export function FocusSetupSkeleton() {
  return (
    <div className="mx-auto max-w-[560px] space-y-5">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="lever-card p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
          <Skeleton className="mt-4 h-9 w-full" />
        </div>
      ))}
      <Skeleton className="h-11 w-full rounded-[var(--radius)]" />
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-[680px] space-y-5">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="lever-card p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-72" />
          <Skeleton className="mt-4 h-9 w-full" />
          <Skeleton className="mt-3 h-9 w-full" />
        </div>
      ))}
    </div>
  );
}
