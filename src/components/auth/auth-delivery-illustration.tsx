"use client";

import React from "react";

export function AuthDeliveryIllustration() {
  return (
    <div className="relative flex flex-col items-center justify-center pt-2 pb-1">
      {/* Halo lumineux d'ambiance terracotta/ambre */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-tr from-amber-100/60 via-orange-100/50 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Illustration SVG détaillée E-commerce & Livraison Afrique */}
      <div className="relative w-40 h-36 flex items-center justify-center">
        <svg
          viewBox="0 0 200 170"
          className="w-full h-full drop-shadow-[0_12px_24px_rgba(194,65,12,0.15)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ombre portée au sol */}
          <ellipse cx="100" cy="155" rx="65" ry="10" fill="#E8DEC8" fillOpacity="0.6" />

          {/* Trajectoire en pointillés de livraison */}
          <path
            d="M 28 85 Q 55 45 88 75 T 165 60"
            stroke="#EA580C"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeOpacity="0.45"
            strokeLinecap="round"
          />

          {/* Marqueur GPS de départ */}
          <circle cx="28" cy="85" r="4.5" fill="#C2410C" />
          <circle cx="28" cy="85" r="2" fill="white" />

          {/* Marqueur GPS d'arrivée */}
          <circle cx="165" cy="60" r="4.5" fill="#10B981" />
          <circle cx="165" cy="60" r="2" fill="white" />

          {/* Colis e-commerce arrière gauche */}
          <g transform="translate(42, 68) rotate(-8)">
            <rect x="0" y="0" width="42" height="42" rx="6" fill="#F59E0B" />
            <path d="M 0 14 L 42 14" stroke="#D97706" strokeWidth="2" />
            <path d="M 21 0 L 21 42" stroke="#D97706" strokeWidth="2" />
            {/* Étiquette d'expédition */}
            <rect x="6" y="20" width="12" height="8" rx="2" fill="white" fillOpacity="0.9" />
          </g>

          {/* Sac kraft e-commerce central (comme sur le mockup BiteBox) */}
          <g id="shopping-bag" transform="translate(68, 48)">
            {/* Anses du sac */}
            <path
              d="M 18 20 C 18 4, 46 4, 46 20"
              stroke="#A16207"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            {/* Corps du sac kraft */}
            <path
              d="M 6 22 L 12 95 C 13 99, 16 102, 20 102 L 44 102 C 48 102, 51 99, 52 95 L 58 22 Z"
              fill="#D97706"
            />
            {/* Pli et ombre du sac */}
            <path
              d="M 12 22 L 16 98 L 48 98 L 52 22 Z"
              fill="#B45309"
              fillOpacity="0.25"
            />
            {/* Rabat supérieur */}
            <rect x="4" y="20" width="56" height="7" rx="3" fill="#CA8A04" />

            {/* Logo Nomika sur le sac kraft */}
            <rect x="18" y="44" width="28" height="28" rx="7" fill="white" fillOpacity="0.95" />
            {/* Monogramme N Terracotta */}
            <path
              d="M 24 64 L 24 52 L 32 64 L 40 52 L 40 64"
              stroke="#C2410C"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Colis blanc avant droit avec ruban Terracotta */}
          <g transform="translate(112, 85) rotate(10)">
            <rect x="0" y="0" width="38" height="38" rx="7" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
            <path d="M 0 19 L 38 19" stroke="#C2410C" strokeWidth="3" />
            <path d="M 19 0 L 19 38" stroke="#C2410C" strokeWidth="3" />
            {/* Nœud ruban */}
            <circle cx="19" cy="19" r="4" fill="#9A3412" />
          </g>

          {/* Badge flottant "COD / Paiement sécurisé" */}
          <g transform="translate(132, 38)">
            <circle cx="16" cy="16" r="15" fill="#111111" />
            <circle cx="16" cy="16" r="12" fill="#C2410C" />
            {/* Checkmark blanc */}
            <path
              d="M 11 16 L 14.5 19.5 L 21 13"
              stroke="white"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Étincelle / Étoile dorée */}
          <path
            d="M 38 42 Q 42 42 42 38 Q 42 42 46 42 Q 42 42 42 46 Q 42 42 38 42 Z"
            fill="#F59E0B"
          />
        </svg>
      </div>

      {/* Titre & Sous-titre sous l'illustration (exactement comme le mockup) */}
      <div className="text-center mt-1 space-y-0.5">
        <h3 className="text-sm font-black text-[#111111] tracking-tight">
          Paiement à la livraison garanti
        </h3>
        <p className="text-[11px] text-[#888880] font-medium max-w-[260px] mx-auto leading-tight">
          Vos commandes et encaissements suivis en temps réel
        </p>
      </div>

      {/* Points indicateurs de carrousel (1 pilule active Terracotta + 2 points inactifs) */}
      <div className="flex items-center gap-1.5 mt-2.5">
        <span className="w-5 h-1.5 rounded-full bg-[#C2410C] transition-all" />
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
      </div>
    </div>
  );
}
