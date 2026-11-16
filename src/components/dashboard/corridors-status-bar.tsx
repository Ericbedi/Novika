"use client";

import React from "react";
import { Zap, Radio, Globe2 } from "lucide-react";
import { CountryFlagSvg } from "@/components/app/bits";
import { cn } from "@/lib/utils";

export interface CorridorHub {
  code: string;
  city: string;
  country: string;
  status: string;
  rate: string;
  time: string;
}

const HUBS: CorridorHub[] = [
  { code: "TG", city: "Lomé", country: "Togo", status: "Actif", rate: "98% closing", time: "10:42 UTC" },
  { code: "CI", city: "Abidjan", country: "Côte d'Ivoire", status: "Actif", rate: "Tournées", time: "10:42 UTC" },
  { code: "SN", city: "Dakar", country: "Sénégal", status: "Actif", rate: "Expéditions", time: "10:42 UTC" },
  { code: "BJ", city: "Cotonou", country: "Bénin", status: "Actif", rate: "14 livraisons", time: "11:42 UTC+1" },
];

export function CorridorsStatusBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-black/[0.08] bg-[#FAF8F5] p-3 px-4 shadow-[0_2px_10px_rgba(17,17,17,0.02)] flex flex-wrap items-center justify-between gap-3",
        className
      )}
    >
      {/* Côté Gauche : Indicateur de statut réseau */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-bold text-[#111111]">
          Corridors COD Afrique de l'Ouest :
        </span>
      </div>

      {/* Centre : Les 4 Hubs en pilules interactives */}
      <div className="flex flex-wrap items-center gap-2">
        {HUBS.map((hub) => (
          <div
            key={hub.city}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-black/[0.06] bg-white text-xs font-medium text-[#111111] hover:border-black/20 hover:shadow-2xs transition-all cursor-default"
          >
            <CountryFlagSvg code={hub.code} className="h-3.5 w-4.5" />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#111111]">{hub.code} · {hub.city}</span>
              <span className="text-[11px] text-[#666660]">({hub.rate})</span>
            </div>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          </div>
        ))}
      </div>

      {/* Côté Droit : Sécurisation & satellite */}
      <div className="hidden xl:flex items-center gap-2 text-xs text-[#666660] font-medium shrink-0">
        <Zap className="h-3.5 w-3.5 text-emerald-600" />
        <span>Encaissement espèces 100% sécurisé</span>
        <span>·</span>
        <span className="text-[11px] text-[#888880]">UTC Live</span>
      </div>
    </div>
  );
}
