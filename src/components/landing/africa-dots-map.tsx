"use client";

import React, { useState } from "react";
import { Pause, Play, CheckCircle2, ShieldCheck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveCountry {
  code: string;
  name: string;
  flag: string;
  city: string;
  currency: string;
  deliveryRate: string;
  leadTime: string;
  cx: number;
  cy: number;
}

const ACTIVE_COUNTRIES: ActiveCountry[] = [
  { code: "SN", name: "Sénégal", flag: "🇸🇳", city: "Dakar", currency: "FCFA (XOF)", deliveryRate: "79%", leadTime: "24h - 48h", cx: 120, cy: 190 },
  { code: "ML", name: "Mali", flag: "🇲🇱", city: "Bamako", currency: "FCFA (XOF)", deliveryRate: "72%", leadTime: "24h - 48h", cx: 170, cy: 195 },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", city: "Ouagadougou", currency: "FCFA (XOF)", deliveryRate: "76%", leadTime: "24h - 48h", cx: 215, cy: 220 },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", city: "Abidjan", currency: "FCFA (XOF)", deliveryRate: "81%", leadTime: "Même jour / 24h", cx: 190, cy: 260 },
  { code: "TG", name: "Togo", flag: "🇹🇬", city: "Lomé", currency: "FCFA (XOF)", deliveryRate: "85%", leadTime: "Même jour (3h)", cx: 245, cy: 255 },
  { code: "BJ", name: "Bénin", flag: "🇧🇯", city: "Cotonou", currency: "FCFA (XOF)", deliveryRate: "78%", leadTime: "24h", cx: 265, cy: 250 },
  { code: "NE", name: "Niger", flag: "🇳🇪", city: "Niamey", currency: "FCFA (XOF)", deliveryRate: "68%", leadTime: "48h", cx: 275, cy: 180 },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", city: "Douala & Yaoundé", currency: "FCFA (XAF)", deliveryRate: "71%", leadTime: "24h - 72h", cx: 330, cy: 285 },
];

export function AfricaDotsMap() {
  const [selectedCountry, setSelectedCountry] = useState<ActiveCountry>(ACTIVE_COUNTRIES[4]); // Togo par défaut
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div className="bg-white rounded-3xl border border-black/[0.08] shadow-sm p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C2410C] block mb-1">
            Réseau Logistique COD
          </span>
          <h3 className="text-lg sm:text-xl font-black text-[#111111] tracking-tight">
            Couverture active en Afrique de l'Ouest & Centrale
          </h3>
          <p className="text-xs text-[#666660] mt-0.5">
            Paiement à la livraison pris en charge dans 8 pays avec devises locales FCFA (UEMOA & CEMAC).
          </p>
        </div>

        <button
          type="button"
          id="pause-map-animation-btn"
          onClick={() => setIsPaused(!isPaused)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-black/[0.08] text-xs font-bold text-[#111111] hover:bg-black/[0.04] transition-all cursor-pointer self-start sm:self-auto"
        >
          {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          <span>{isPaused ? "Reprendre l'animation" : "Pause animation"}</span>
        </button>
      </div>

      {/* Sélecteur de pays sous forme de puces cliquables */}
      <div className="flex flex-wrap gap-1.5">
        {ACTIVE_COUNTRIES.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => setSelectedCountry(c)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
              selectedCountry.code === c.code
                ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                : "bg-black/[0.04] text-[#666660] hover:bg-black/[0.08] hover:text-[#111111]"
            )}
          >
            <span>{c.flag}</span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      {/* Rendu Carte SVG & Carte descriptive du pays sélectionné */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Carte SVG stylisée avec points et pulsations */}
        <div className="md:col-span-7 bg-[#0F172A] rounded-2xl p-6 relative overflow-hidden flex items-center justify-center min-h-[300px]">
          <svg viewBox="0 0 500 450" className="w-full h-auto max-h-[300px]">
            {/* Contour schématique léger de l'Afrique */}
            <path
              d="M 120 120 Q 220 100, 360 120 Q 420 180, 410 240 Q 380 320, 300 420 Q 240 440, 200 370 Q 180 300, 110 240 Q 80 180, 120 120 Z"
              fill="none"
              stroke="#334155"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />

            {/* Trame de points légers pour le continent */}
            {[
              [140, 150], [180, 140], [220, 140], [260, 140], [300, 150],
              [130, 180], [160, 170], [200, 170], [240, 170], [280, 180], [320, 190],
              [110, 210], [150, 210], [190, 210], [230, 210], [270, 220], [310, 230],
              [130, 250], [170, 250], [210, 250], [250, 260], [290, 260], [330, 270],
              [200, 290], [240, 300], [280, 300], [320, 310],
              [220, 340], [260, 340], [280, 350],
              [240, 380], [260, 390],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="2" fill="#475569" opacity="0.6" />
            ))}

            {/* Villes / Pays actifs avec pulsation verte */}
            {ACTIVE_COUNTRIES.map((c) => {
              const isSelected = selectedCountry.code === c.code;
              return (
                <g key={c.code} className="cursor-pointer" onClick={() => setSelectedCountry(c)}>
                  {!isPaused && (
                    <circle
                      cx={c.cx}
                      cy={c.cy}
                      r={isSelected ? "12" : "8"}
                      fill="#22C55E"
                      opacity="0.3"
                      className="animate-ping"
                    />
                  )}
                  <circle
                    cx={c.cx}
                    cy={c.cy}
                    r={isSelected ? "6" : "4"}
                    fill={isSelected ? "#F97316" : "#22C55E"}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                  <text
                    x={c.cx + 8}
                    y={c.cy + 3}
                    fill="#FFFFFF"
                    fontSize="9"
                    fontFamily="sans-serif"
                    fontWeight="bold"
                    opacity={isSelected ? "1" : "0.75"}
                  >
                    {c.code}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Fiche d'information du pays actif */}
        <div className="md:col-span-5 p-5 rounded-2xl bg-[#FAF8F5] border border-black/[0.08] space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{selectedCountry.flag}</span>
            <div>
              <h4 className="font-black text-base text-[#111111]">
                {selectedCountry.name}
              </h4>
              <span className="text-xs text-[#888880]">
                Hub principal : <strong className="text-[#111111]">{selectedCountry.city}</strong>
              </span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-black/[0.06]">
              <span className="text-[#888880]">Devise acceptée :</span>
              <span className="font-bold text-[#111111]">{selectedCountry.currency}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-black/[0.06]">
              <span className="text-[#888880]">Taux moyen de livraison :</span>
              <span className="font-bold text-[#16A34A]">{selectedCountry.deliveryRate}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-black/[0.06]">
              <span className="text-[#888880]">Délai moyen d'expédition :</span>
              <span className="font-bold text-[#111111]">{selectedCountry.leadTime}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-black/[0.06]">
              <span className="text-[#888880]">Zones desservies :</span>
              <span className="font-bold text-[#111111]">Capitale & Grandes Villes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
