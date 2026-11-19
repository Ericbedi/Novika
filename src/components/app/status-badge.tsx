"use client";

import { OrderStatus, ORDER_STATUS_LABELS } from "@/server/data/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
}

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string; border: string; dot: string }> = {
  pending: {
    bg: "bg-blue-50 dark:bg-blue-950/50",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800/60",
    dot: "bg-blue-500",
  },
  unreachable: {
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-800 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/60",
    dot: "bg-amber-500",
  },
  scheduled: {
    bg: "bg-purple-50 dark:bg-purple-950/50",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800/60",
    dot: "bg-purple-500",
  },
  postponed: {
    bg: "bg-yellow-50 dark:bg-yellow-950/50",
    text: "text-yellow-800 dark:text-yellow-300",
    border: "border-yellow-300 dark:border-yellow-700/60",
    dot: "bg-yellow-500",
  },
  delivered: {
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/60",
    dot: "bg-emerald-500",
  },
  confirmed: {
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-800 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/60",
    dot: "bg-emerald-500",
  },
  prepared: {
    bg: "bg-teal-50 dark:bg-teal-950/50",
    text: "text-teal-800 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-800/60",
    dot: "bg-teal-500",
  },
  rejected: {
    bg: "bg-rose-50 dark:bg-rose-950/50",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800/60",
    dot: "bg-rose-500",
  },
  rejected_invalid_number: {
    bg: "bg-neutral-100 dark:bg-neutral-900",
    text: "text-neutral-700 dark:text-neutral-300",
    border: "border-neutral-300 dark:border-neutral-700",
    dot: "bg-neutral-500",
  },
  lost_unreachable: {
    bg: "bg-neutral-100 dark:bg-neutral-900",
    text: "text-neutral-700 dark:text-neutral-300",
    border: "border-neutral-300 dark:border-neutral-700",
    dot: "bg-neutral-500",
  },
  cancelled: {
    bg: "bg-rose-50 dark:bg-rose-950/50",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800/60",
    dot: "bg-rose-500",
  },
};

export function StatusBadge({ status, className, size = "md", showDot = true }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const label = ORDER_STATUS_LABELS[status] || status;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
    lg: "px-3 py-1.5 text-sm font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-colors",
        style.bg,
        style.text,
        style.border,
        sizeClasses[size],
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            style.dot
          )}
        />
      )}
      {label}
    </span>
  );
}
