"use client";

import React, { useState, useEffect } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartDayData } from "@/server/data/types";
import { formatCompact, formatFcfa } from "@/lib/money";
import { cn } from "@/lib/utils";

interface MainPerformanceChartProps {
  data: ChartDayData[];
  className?: string;
}

type TabType = "sales" | "volume" | "all";

export function MainPerformanceChart({ data, className }: MainPerformanceChartProps) {
  const [activeTab, setActiveTab] = useState<TabType>("sales");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-black/[0.1] bg-[#FAF8F5] p-3.5 shadow-xl text-xs">
          <p className="font-bold text-[#111111] mb-2 border-b border-black/[0.06] pb-1.5">
            {label}
          </p>
          <div className="space-y-1.5">
            {payload.map((item: any) => {
              const isMoney = item.dataKey.includes("Sales");
              return (
                <div key={item.dataKey} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[#666660]">{item.name} :</span>
                  </div>
                  <span className="font-bold tabular-nums text-[#111111]">
                    {isMoney ? formatFcfa(item.value) : item.value.toLocaleString("fr-FR")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-[0_2px_12px_rgba(17,17,17,0.03)] min-w-0",
        className
      )}
    >
      {/* En-tête avec onglets */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-black/[0.06] pb-4">
        <div>
          <h3 className="text-base font-bold text-[#111111]">
            Performance Ventes & Visiteurs
          </h3>
          <p className="text-xs text-[#666660]">
            Évolution quotidienne des flux de vente et du trafic en FCFA
          </p>
        </div>

        {/* Onglets */}
        <div className="flex rounded-xl bg-[#F3EFE6] border border-black/[0.06] p-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("sales")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
              activeTab === "sales"
                ? "bg-[#111111] text-[#FAF8F5] font-extrabold shadow-2xs"
                : "text-[#666660] hover:text-[#111111]"
            )}
          >
            Ventes & Livrées (FCFA)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("volume")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
              activeTab === "volume"
                ? "bg-[#111111] text-[#FAF8F5] font-extrabold shadow-2xs"
                : "text-[#666660] hover:text-[#111111]"
            )}
          >
            Commandes & Visiteurs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
              activeTab === "all"
                ? "bg-[#111111] text-[#FAF8F5] font-extrabold shadow-2xs"
                : "text-[#666660] hover:text-[#111111]"
            )}
          >
            Vue combinée
          </button>
        </div>
      </div>

      {/* Zone du graphique */}
      <div className="mt-5 h-[320px] w-full min-w-0">
        {isMounted ? (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                {/* Dégradé pour les Ventes Livrées Encaissées */}
                <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#111111" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#111111" stopOpacity={0.0} />
                </linearGradient>

                {/* Dégradé pour les Ventes Brutes */}
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                </linearGradient>

                {/* Dégradé pour les Commandes */}
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>

                {/* Dégradé pour les Visiteurs */}
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DEC9" opacity={0.7} />

              <XAxis
                dataKey="dayLabel"
                axisLine={{ stroke: "#E5DEC9" }}
                tickLine={false}
                tick={{ fill: "#666660", fontSize: 11, fontWeight: 500 }}
                dy={6}
              />

              <YAxis
                axisLine={{ stroke: "#E5DEC9" }}
                tickLine={false}
                tick={{ fill: "#666660", fontSize: 11 }}
                tickFormatter={(val) =>
                  activeTab === "sales" ? formatCompact(val) : val.toLocaleString("fr-FR")
                }
              />

              <Tooltip content={<CustomTooltip />} />

              {(activeTab === "sales" || activeTab === "all") && (
                <>
                  <Area
                    type="monotone"
                    dataKey="totalSales"
                    name="Ventes brutes"
                    stroke="#16A34A"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="deliveredSales"
                    name="CA Livré Encaissé (espèces)"
                    stroke="#111111"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorDelivered)"
                    isAnimationActive={false}
                  />
                </>
              )}

              {(activeTab === "volume" || activeTab === "all") && (
                <>
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    name="Visiteurs"
                    stroke="#94A3B8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVisitors)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    name="Commandes reçues"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorOrders)"
                    isAnimationActive={false}
                  />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full bg-[#F3EFE6]/50 rounded-xl animate-pulse" />
        )}
      </div>

      {/* Légende du bas */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-6 pt-3 border-t border-black/[0.06] text-xs">
        {(activeTab === "sales" || activeTab === "all") && (
          <>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#111111]" />
              <span className="font-bold text-[#111111]">
                CA Livré Encaissé (espèces)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#16A34A]" />
              <span className="font-medium text-[#666660]">
                Ventes Brutes
              </span>
            </div>
          </>
        )}
        {(activeTab === "volume" || activeTab === "all") && (
          <>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#2563EB]" />
              <span className="font-bold text-[#111111]">
                Commandes reçues
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#94A3B8]" />
              <span className="font-medium text-[#666660]">
                Visiteurs
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
