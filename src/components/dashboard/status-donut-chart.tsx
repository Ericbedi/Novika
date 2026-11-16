"use client";

import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { StatusDistributionItem } from "@/server/data/types";
import { cn } from "@/lib/utils";

interface StatusDonutChartProps {
  items: StatusDistributionItem[];
  totalOrders: number;
  className?: string;
}

export function StatusDonutChart({
  items,
  totalOrders,
  className,
}: StatusDonutChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as StatusDistributionItem;
      return (
        <div className="rounded-xl border border-black/[0.1] bg-[#FAF8F5] p-3 shadow-xl text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-bold text-[#111111]">
              {data.label}
            </span>
          </div>
          <p className="text-[#666660] font-medium">
            <span className="font-bold text-[#111111]">
              {data.count}
            </span>{" "}
            commandes ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-[0_2px_12px_rgba(17,17,17,0.03)] flex flex-col justify-between",
        className
      )}
    >
      <div className="border-b border-black/[0.06] pb-3">
        <h3 className="text-base font-bold text-[#111111]">
          Répartition des statuts
        </h3>
        <p className="text-xs text-[#666660]">
          État d'avancement des {totalOrders} commandes de la période
        </p>
      </div>

      {/* Donut Chart avec compteur central */}
      <div className="relative my-4 h-[220px] w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={items}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={92}
              paddingAngle={3}
              dataKey="count"
              isAnimationActive={false}
            >
              {items.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={entry.color}
                  stroke="#FAF8F5"
                  strokeWidth={2}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Chiffre au centre du Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black text-[#111111] tabular-nums">
            {totalOrders}
          </span>
          <span className="text-[10px] font-bold text-[#666660] uppercase tracking-widest">
            Commandes
          </span>
        </div>
      </div>

      {/* Liste des statuts avec pourcentages */}
      <div className="space-y-1.5 pt-2 border-t border-black/[0.06]">
        {items.map((item) => (
          <div
            key={item.status}
            className="flex items-center justify-between text-xs py-1 hover:bg-black/[0.03] px-2 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate font-medium text-[#333333]">
                {item.label}
              </span>
            </div>
            <div className="flex items-center gap-2 tabular-nums shrink-0">
              <span className="font-bold text-[#111111]">
                {item.count}
              </span>
              <span className="text-[#666660] font-semibold text-[11px] w-12 text-right">
                ({item.percentage}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
