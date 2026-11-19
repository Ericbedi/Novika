"use client";

import React from "react";
import { Check, X, AlertTriangle, ShieldCheck } from "lucide-react";
import { ThemeColorPalette, BorderRadiusOption } from "@/lib/theme-engine/types";
import { ComparisonTableSettings, validateComparisonParity } from "@/lib/theme-engine/schemas";
import { cn } from "@/lib/utils";

interface ComparisonTableSectionProps {
  settings: ComparisonTableSettings;
  palette: ThemeColorPalette;
  cardRadius?: BorderRadiusOption;
  isEditMode?: boolean;
}

export function ComparisonTableSection({
  settings,
  palette,
  cardRadius = "md",
  isEditMode = false,
}: ComparisonTableSectionProps) {
  const {
    title = "Pourquoi nous choisir ?",
    subtitle,
    ourLabel = "Notre boutique",
    competitorLabel = "Autres vendeurs",
    rows = [],
  } = settings;

  const validRows = rows.filter((r) => r && r.criterion?.trim());
  if (validRows.length === 0) return null;

  // Vérification de la parité commerciale (Prompt 12)
  const parityCheck = validateComparisonParity(validRows);

  const radiusClass =
    cardRadius === "none"
      ? "rounded-none"
      : cardRadius === "sm"
      ? "rounded-xl"
      : cardRadius === "lg"
      ? "rounded-3xl"
      : cardRadius === "full"
      ? "rounded-[32px]"
      : "rounded-2xl";

  const renderCellContent = (val: boolean | string, isOurSide: boolean) => {
    if (typeof val === "boolean") {
      return val ? (
        <div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center mx-auto",
            isOurSide ? "bg-emerald-100 text-emerald-700" : "bg-black/[0.06] text-black/60"
          )}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      ) : (
        <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <X className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      );
    }
    return (
      <span className={cn("text-xs font-bold", isOurSide ? "text-[#111111]" : "opacity-60")}>
        {val}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2 px-4">
        {title && (
          <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-xs sm:text-sm font-medium opacity-80 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Avertissement déontologique réservé à l'admin en mode édition si zéro critère d'équité */}
      {isEditMode && !parityCheck.hasParity && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-black">Avertissement de transparence commerciale :</span>
            <p className="text-[11px] leading-relaxed opacity-90">{parityCheck.warning}</p>
          </div>
        </div>
      )}

      {/* Tableau comparatif stylisé */}
      <div
        className={cn("overflow-hidden border shadow-xs", radiusClass)}
        style={{
          backgroundColor: palette.cardBackground || palette.background,
          borderColor: palette.borderColor || "transparent",
        }}
      >
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-black/[0.08] text-xs font-black">
              <th className="p-3.5 sm:p-5 w-1/2">Critères</th>
              <th
                className="p-3.5 sm:p-5 w-1/4 text-center font-black"
                style={{ backgroundColor: `${palette.button}12`, color: palette.button }}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{ourLabel}</span>
                </div>
              </th>
              <th className="p-3.5 sm:p-5 w-1/4 text-center opacity-60 font-semibold">
                {competitorLabel}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.06] text-xs">
            {validRows.map((row) => (
              <tr key={row.id} className="hover:bg-black/[0.015] transition-colors">
                <td className="p-3.5 sm:p-5 font-bold">
                  {row.criterion}
                </td>
                <td
                  className="p-3.5 sm:p-5 text-center font-black"
                  style={{ backgroundColor: `${palette.button}06` }}
                >
                  {renderCellContent(row.ourShopValue, true)}
                </td>
                <td className="p-3.5 sm:p-5 text-center">
                  {renderCellContent(row.competitorValue, false)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
