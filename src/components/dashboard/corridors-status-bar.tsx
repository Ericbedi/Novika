"use client";

import React, { useEffect, useState } from "react";
import { Zap, Globe2 } from "lucide-react";
import { CountryFlagSvg } from "@/components/app/bits";
import { cn } from "@/lib/utils";

interface CorridorApi {
  code: string;
  ordersToday: number;
  deliveredToday: number;
}

const HUB_INFO: Record<string, { city: string; tz: string }> = {
  TG: { city: "Lomé", tz: "Africa/Lome" },
  CI: { city: "Abidjan", tz: "Africa/Abidjan" },
  SN: { city: "Dakar", tz: "Africa/Dakar" },
  BJ: { city: "Cotonou", tz: "Africa/Porto-Novo" },
  BF: { city: "Ouagadougou", tz: "Africa/Ouagadougou" },
  ML: { city: "Bamako", tz: "Africa/Bamako" },
  NE: { city: "Niamey", tz: "Africa/Niamey" },
  GN: { city: "Conakry", tz: "Africa/Conakry" },
  CM: { city: "Douala", tz: "Africa/Douala" },
  GA: { city: "Libreville", tz: "Africa/Libreville" },
  CD: { city: "Kinshasa", tz: "Africa/Kinshasa" },
  GH: { city: "Accra", tz: "Africa/Accra" },
  NG: { city: "Lagos", tz: "Africa/Lagos" },
  MA: { city: "Casablanca", tz: "Africa/Casablanca" },
};

function localTime(tz: string, now: Date) {
  try {
    return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(now);
  } catch {
    return "";
  }
}

export function CorridorsStatusBar({ className, storeSlug }: { className?: string; storeSlug?: string }) {
  const [corridors, setCorridors] = useState<CorridorApi[]>([]);
  const [now, setNow] = useState<Date>(() => new Date());

  // Horloge réelle (mise à jour chaque minute)
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Données réelles, actualisées toutes les 30 secondes
  useEffect(() => {
    if (!storeSlug) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/corridors?store=${encodeURIComponent(storeSlug)}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.corridors)) setCorridors(data.corridors);
      } catch {
        /* réseau indisponible : on garde l'état précédent */
      }
    };
    load();
    const t = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [storeSlug]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-black/[0.08] bg-[#FAF8F5] p-3 px-4 shadow-[0_2px_10px_rgba(17,17,17,0.02)] flex flex-wrap items-center justify-between gap-3",
        className
      )}
    >
      <div className="flex items-center gap-2.5 shrink-0">
        <span
          className={cn(
            "flex h-2.5 w-2.5 rounded-full",
            corridors.length > 0 ? "bg-emerald-500 animate-pulse" : "bg-black/20"
          )}
        />
        <span className="text-xs font-bold text-[#111111]">Corridors COD :</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {corridors.length === 0 && (
          <span className="flex items-center gap-1.5 text-xs text-[#666660]">
            <Globe2 className="h-3.5 w-3.5" />
            Aucun corridor actif pour le moment
          </span>
        )}
        {corridors.map((c) => {
          const info = HUB_INFO[c.code] || { city: c.code, tz: "UTC" };
          const label =
            c.ordersToday > 0
              ? `${c.ordersToday} commande${c.ordersToday > 1 ? "s" : ""} · ${c.deliveredToday} livrée${c.deliveredToday > 1 ? "s" : ""}`
              : "0 commande aujourd'hui";
          return (
            <div
              key={c.code}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-black/[0.06] bg-white text-xs font-medium text-[#111111]"
            >
              <CountryFlagSvg code={c.code} className="h-3.5 w-4.5" />
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#111111]">
                  {c.code} · {info.city}
                </span>
                <span className="text-[11px] text-[#666660]">({label})</span>
                <span className="text-[11px] text-[#888880]">{localTime(info.tz, now)}</span>
              </div>
              <span
                className={cn("h-1.5 w-1.5 rounded-full shrink-0", c.ordersToday > 0 ? "bg-emerald-500" : "bg-black/20")}
              />
            </div>
          );
        })}
      </div>

      <div className="hidden xl:flex items-center gap-2 text-xs text-[#666660] font-medium shrink-0">
        <Zap className="h-3.5 w-3.5 text-emerald-600" />
        <span>Actualisé toutes les 30 s</span>
      </div>
    </div>
  );
}
