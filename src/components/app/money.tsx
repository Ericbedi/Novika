import React from "react";
import { formatNumber, formatCompact } from "@/lib/money";
import { cn } from "@/lib/utils";

interface MoneyProps {
  value: number;
  compact?: boolean;
  signed?: boolean;
  className?: string;
  currencyClass?: string;
  currency?: string;
}

export function Money({
  value,
  compact = false,
  signed = false,
  className,
  currencyClass,
  currency = "FCFA",
}: MoneyProps) {
  if (compact) {
    return (
      <span className={cn("font-semibold tabular-nums tracking-tight", className)}>
        {formatCompact(value)} {currency}
      </span>
    );
  }

  const formattedNum = formatNumber(value);
  const sign = signed && value > 0 ? "+" : "";

  return (
    <span
      className={cn(
        "font-semibold tabular-nums tracking-tight inline-flex items-baseline gap-1",
        className
      )}
    >
      <span>
        {sign}
        {formattedNum}
      </span>
      <span
        className={cn(
          "text-[0.75em] font-medium text-slate-500 dark:text-zinc-400 select-none",
          currencyClass
        )}
      >
        {currency}
      </span>
    </span>
  );
}
