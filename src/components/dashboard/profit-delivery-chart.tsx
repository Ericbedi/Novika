"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartDayData } from "@/server/data/types";
import { formatCompact, formatNumber } from "@/lib/money";
import { cn } from "@/lib/utils";

interface ProfitDeliveryChartProps {
  data: ChartDayData[];
  className?: string;
}

interface MetricConfig {
  key: keyof ChartDayData;
  name: string;
  defaultColor: string;
  axis: "money" | "count";
  defaultChecked: boolean;
}

const DEFAULT_METRICS: MetricConfig[] = [
  { key: "adSpend", name: "Budget pub", defaultColor: "#E28743", axis: "money", defaultChecked: true },
  { key: "orders", name: "Commandes reçues", defaultColor: "#2563EB", axis: "count", defaultChecked: false },
  { key: "deliveredCount", name: "Livraisons", defaultColor: "#16A34A", axis: "count", defaultChecked: true },
  { key: "deliveredSales", name: "CA encaissé", defaultColor: "#0284C7", axis: "money", defaultChecked: true },
  { key: "productCost", name: "Coût des produits", defaultColor: "#9333EA", axis: "money", defaultChecked: false },
  { key: "shippingCost", name: "Frais de livraison", defaultColor: "#DC2626", axis: "money", defaultChecked: false },
  { key: "netProfit", name: "Bénéfice du jour", defaultColor: "#0D9488", axis: "money", defaultChecked: true },
  { key: "realCpa", name: "Coût par achat réel", defaultColor: "#9A3412", axis: "money", defaultChecked: true },
];

export function ProfitDeliveryChart({ data, className }: ProfitDeliveryChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // État des courbes sélectionnées (cochées)
  const [selectedKeys, setSelectedKeys] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    DEFAULT_METRICS.forEach((m) => {
      initial[m.key] = m.defaultChecked;
    });
    return initial;
  });

  // État des couleurs personnalisables pour chaque métrique
  const [colors, setColors] = useState<Record<string, string>>(() => {
    const initialColors: Record<string, string> = {};
    DEFAULT_METRICS.forEach((m) => {
      initialColors[m.key] = m.defaultColor;
    });
    return initialColors;
  });

  const toggleMetric = (key: string) => {
    setSelectedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectAll = () => {
    const all: Record<string, boolean> = {};
    DEFAULT_METRICS.forEach((m) => (all[m.key] = true));
    setSelectedKeys(all);
  };

  const deselectAll = () => {
    const none: Record<string, boolean> = {};
    DEFAULT_METRICS.forEach((m) => (none[m.key] = false));
    setSelectedKeys(none);
  };

  const handleColorChange = (key: string, newColor: string) => {
    setColors((prev) => ({
      ...prev,
      [key]: newColor,
    }));
  };

  // Tooltip fidèle à la capture d'écran de l'utilisateur
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-2xl border border-black/10 bg-[#FAF8F5] p-3.5 shadow-xl text-xs max-w-xs">
          <p className="font-bold text-[#111111] mb-2 border-b border-black/5 pb-1">
            {label}
          </p>
          <div className="space-y-1.5">
            {payload.map((item: any) => {
              const metric = DEFAULT_METRICS.find((m) => m.key === item.dataKey);
              const isMoney = metric?.axis === "money";
              const currentColor = colors[item.dataKey] || item.color;
              return (
                <div key={item.dataKey} className="flex items-center justify-between gap-3">
                  <span
                    className="font-semibold truncate"
                    style={{ color: currentColor }}
                  >
                    {item.name} :
                  </span>
                  <span
                    className="font-bold tabular-nums shrink-0"
                    style={{ color: currentColor }}
                  >
                    {isMoney ? `${formatNumber(item.value)} XOF` : item.value}
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
        "rounded-2xl border border-black/10 bg-[#FAF8F5] p-6 shadow-[0_2px_12px_rgba(17,17,17,0.04)] min-w-0",
        className
      )}
    >
      {/* 1. Titre et sous-titre fidèles à la capture */}
      <div className="border-b border-black/5 pb-4">
        <h3 className="text-lg font-bold text-[#111111]">
          Budget, coûts, bénéfice & livraisons
        </h3>
        <p className="mt-1 text-xs text-[#666660] leading-relaxed max-w-4xl">
          Coche les données à comparer, choisis leurs couleurs (clique la pastille). Argent à gauche (en XOF), nombres à droite. Coût par achat réel = pub ÷ livraisons ; bénéfice du jour = encaissé − coût produits − frais − pub − dépenses.
        </p>
      </div>

      {/* 2. Boutons / Filtres à pastille cliquable et sélection */}
      <div className="mt-4 flex flex-wrap items-center gap-2 pb-2">
        {DEFAULT_METRICS.map((metric) => {
          const isChecked = !!selectedKeys[metric.key];
          const currentColor = colors[metric.key] || metric.defaultColor;

          return (
            <div
              key={metric.key}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold select-none transition-all",
                isChecked
                  ? "bg-white border-black/15 text-[#111111] shadow-2xs"
                  : "bg-[#F3EFE6]/60 border-black/8 text-[#666660] opacity-60 hover:opacity-100"
              )}
            >
              {/* Pastille de couleur cliquable pour changer la couleur de la courbe */}
              <div className="relative flex items-center justify-center">
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => handleColorChange(metric.key as string, e.target.value)}
                  title={`Changer la couleur de ${metric.name}`}
                  className="absolute inset-0 opacity-0 cursor-pointer w-4 h-4"
                />
                <span
                  style={{ backgroundColor: currentColor }}
                  className="h-3.5 w-3.5 rounded-full shrink-0 border border-black/10 transition-transform hover:scale-125 cursor-pointer shadow-xs"
                />
              </div>

              {/* Texte cliquable pour cocher / décocher */}
              <button
                type="button"
                onClick={() => toggleMetric(metric.key as string)}
                className="text-left font-medium hover:text-[#111111] cursor-pointer"
              >
                {metric.name}
              </button>
            </div>
          );
        })}

        {/* Boutons d'action globale */}
        <div className="flex items-center gap-2 pl-1">
          <button
            type="button"
            onClick={selectAll}
            className="px-3.5 py-1.5 rounded-full border border-black/10 bg-white text-xs font-semibold text-[#111111] hover:bg-[#F3EFE6] transition-colors cursor-pointer shadow-2xs"
          >
            Tout afficher
          </button>
          <button
            type="button"
            onClick={deselectAll}
            className="px-3.5 py-1.5 rounded-full border border-black/10 bg-white text-xs font-semibold text-[#666660] hover:text-[#111111] hover:bg-[#F3EFE6] transition-colors cursor-pointer shadow-2xs"
          >
            Tout masquer
          </button>
        </div>
      </div>

      {/* 3. Zone du graphique Recharts */}
      <div className="mt-4 h-[360px] w-full min-w-0">
        {isMounted ? (
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={data} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DEC9" opacity={0.7} />

              <XAxis
                dataKey="dayLabel"
                axisLine={{ stroke: "#E5DEC9" }}
                tickLine={false}
                tick={{ fill: "#666660", fontSize: 11, fontWeight: 500 }}
                dy={6}
              />

              {/* Axe Gauche : Argent à gauche (en XOF) */}
              <YAxis
                yAxisId="money"
                axisLine={{ stroke: "#E5DEC9" }}
                tickLine={false}
                tick={{ fill: "#666660", fontSize: 11 }}
                tickFormatter={(val) => formatCompact(val)}
              />

              {/* Axe Droit : Nombres à droite */}
              <YAxis
                yAxisId="count"
                orientation="right"
                axisLine={{ stroke: "#E5DEC9" }}
                tickLine={false}
                tick={{ fill: "#666660", fontSize: 11 }}
                tickFormatter={(val) => val.toString()}
              />

              <Tooltip content={<CustomTooltip />} />

              {DEFAULT_METRICS.map((metric) => {
                if (!selectedKeys[metric.key]) return null;
                const lineColor = colors[metric.key] || metric.defaultColor;

                return (
                  <Line
                    key={metric.key}
                    yAxisId={metric.axis}
                    type="monotone"
                    dataKey={metric.key}
                    name={metric.name}
                    stroke={lineColor}
                    strokeWidth={metric.key === "netProfit" || metric.key === "deliveredSales" ? 2.8 : 2}
                    dot={{ r: 3, fill: lineColor, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: "#FAF8F5" }}
                    isAnimationActive={false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full bg-[#F3EFE6]/50 rounded-xl animate-pulse" />
        )}
      </div>
    </div>
  );
}
