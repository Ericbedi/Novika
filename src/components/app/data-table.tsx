"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  className?: string;
  render: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  renderMobileCard?: (item: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyTitle = "Aucune donnée",
  emptyDescription = "Aucun élément n'a été trouvé pour le moment.",
  onRowClick,
  renderMobileCard,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-xl bg-[#E5DEC9]" />
        <Skeleton className="h-14 w-full rounded-xl bg-[#E5DEC9]" />
        <Skeleton className="h-14 w-full rounded-xl bg-[#E5DEC9]" />
        <Skeleton className="h-14 w-full rounded-xl bg-[#E5DEC9]" />
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* VUE DESKTOP */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/[0.06] bg-[#F3EFE6]/70 text-xs font-bold uppercase tracking-wider text-[#666660]">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className={cn("px-4 py-3.5", col.className)}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {data.map((item) => {
                const key = keyExtractor(item);
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                      "transition-colors hover:bg-[#F3EFE6]/40",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={cn("px-4 py-3.5 text-[#111111]", col.className)}>
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* VUE MOBILE */}
      <div className="flex flex-col gap-3 md:hidden">
        {data.map((item) => {
          const key = keyExtractor(item);
          if (renderMobileCard) {
            return (
              <div key={key} onClick={() => onRowClick?.(item)}>
                {renderMobileCard(item)}
              </div>
            );
          }

          return (
            <div
              key={key}
              onClick={() => onRowClick?.(item)}
              className={cn(
                "rounded-2xl border border-black/[0.08] bg-[#FAF8F5] p-4 shadow-sm space-y-2",
                onRowClick && "cursor-pointer active:scale-[0.99] transition-transform"
              )}
            >
              {columns.map((col) => (
                <div key={col.key} className="flex items-center justify-between text-xs py-1">
                  <span className="font-medium text-[#666660]">
                    {col.header}
                  </span>
                  <div>{col.render(item)}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
