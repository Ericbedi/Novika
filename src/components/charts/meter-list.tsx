import React from "react";
import { cn } from "@/lib/utils";

export interface MeterRow {
  key: string;
  label: string;
  value: number;
  display?: React.ReactNode;
  hint?: string;
  color?: string;
}

export function MeterList({
  rows,
  className,
}: {
  rows: MeterRow[];
  className?: string;
}) {
  const maxValue = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className={cn("space-y-3.5", className)}>
      {rows.map((row) => {
        const percentage = Math.round((row.value / maxValue) * 100);
        return (
          <div key={row.key} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-700 dark:text-zinc-300 truncate max-w-[200px]">
                {row.label}
              </span>
              <span className="text-slate-900 font-semibold dark:text-zinc-100 tabular-nums">
                {row.display ?? row.value}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
              <div
                style={{ width: `${percentage}%` }}
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  row.color || "bg-emerald-600 dark:bg-emerald-500"
                )}
              />
            </div>
            {row.hint && (
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">{row.hint}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
