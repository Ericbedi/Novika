import React from "react";
import { LucideIcon } from "lucide-react";
import { StatCard } from "./stat-card";

export interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  delta?: {
    value: number;
    upIsGood?: boolean;
    label?: string;
  };
  icon?: LucideIcon;
  trend?: number[];
  isLoading?: boolean;
  className?: string;
}

export function KpiCard({
  label,
  value,
  hint,
  delta,
  icon,
  trend,
  isLoading,
  className,
}: KpiCardProps) {
  return (
    <StatCard
      label={label}
      value={value}
      hint={hint}
      delta={delta}
      icon={icon}
      sparkline={trend}
      isLoading={isLoading}
      className={className}
    />
  );
}
