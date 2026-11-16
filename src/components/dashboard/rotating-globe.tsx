"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Globe,
  Percent,
  Radio,
  ShoppingBag,
  Truck,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { StatCard } from "@/components/app/stat-card";
import { Money } from "@/components/app/money";
import { PeriodType } from "@/mock-data/dashboard";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { PeriodPreset } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface KpiMetric {
  value: number;
  delta: number;
  isUpGood?: boolean;
}

export interface RotatingGlobeProps {
  className?: string;
  storeName?: string;
  period: PeriodType;
  onPeriodChange: (p: PeriodType) => void;
  periodLabels: Record<PeriodType, string>;
  kpis: {
    visitors: KpiMetric;
    totalSales: KpiMetric;
    deliveredSales: KpiMetric;
    ordersCount: KpiMetric;
    conversionRate: KpiMetric;
  };
}

export function RotatingGlobe({
  className,
  storeName = "Lomé Glow",
  period,
  onPeriodChange,
  periodLabels,
  kpis,
}: RotatingGlobeProps) {
  const [rotation, setRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const animRef = useRef<number | null>(null);

  // Rotation continue et fluide à 60 FPS en temps réel
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Vitesse de rotation : 3.5 degrés par seconde (légèrement ralentie au survol)
      const speed = isHovered ? 1.5 : 4.5;
      setRotation((prev) => (prev + speed * delta) % 360);

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isHovered]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-black/[0.08] bg-[#FAF8F5] p-6 lg:p-7 shadow-[0_2px_16px_rgba(17,17,17,0.03)] transition-all duration-300",
        className
      )}
    >
      {/* Halo subtil en fond */}
      <div className="absolute top-0 right-1/4 -z-0 h-72 w-72 rounded-full bg-[#E5DEC9]/40 blur-[90px] pointer-events-none" />

      {/* Rangée supérieure : En-tête télémétrique + Sélecteur de date à gauche & Globe 3D tournant à droite */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Colonne Gauche : Titre, Sélecteur de calendrier et Télémétrie */}
        <div className="lg:col-span-8 space-y-3">
          {/* Ligne 1 : Badge live et Sélecteur de calendrier déplacé ici */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-[#F3EFE6] px-3 py-1 text-xs font-bold text-[#111111]">
              <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-600" />
              <span>Réseau COD Afrique de l'Ouest · En direct</span>
            </div>

            {/* Sélecteur de date universel 2 colonnes & pill button en temps réel */}
            <DateRangePicker
              preset={period as PeriodPreset}
              onChange={(p) => onPeriodChange(p as PeriodType)}
              align="right"
            />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#111111]">
              Commandes & Livraisons en Temps Réel
            </h2>
            <p className="text-sm text-[#666660] max-w-xl leading-relaxed">
              Votre vitrine <span className="font-semibold text-[#111111]">{storeName}</span> est connectée
              en direct aux corridors logistiques majeurs en paiement à la livraison (COD).
            </p>
          </div>

          {/* Statut télémétrique */}
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#666660]">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#111111]">
              <Zap className="h-3.5 w-3.5 text-emerald-600" />
              Rotation satellite 60 FPS
            </span>
            <span>·</span>
            <span className="font-medium text-[#666660]">
              Encaissement espèces 100% sécurisé
            </span>
          </div>
        </div>

        {/* Colonne Droite : Le Globe 3D qui tourne en temps réel */}
        <div className="lg:col-span-4 flex items-center justify-center relative">
          <div className="relative h-52 w-52 sm:h-60 sm:w-60 flex items-center justify-center">
            {/* Anneau orbital externe */}
            <div className="absolute inset-0 rounded-full border border-black/[0.08] pointer-events-none" />
            <div className="absolute inset-3 rounded-full border border-dashed border-black/[0.1] pointer-events-none" />

            {/* Globe réel avec rotation 3D continue */}
            <div
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: "center center",
              }}
              className="relative h-44 w-44 sm:h-52 sm:w-52 transition-transform duration-75 will-change-transform filter drop-shadow-[0_12px_24px_rgba(17,17,17,0.12)]"
            >
              <Image
                src="/globe-africa.png"
                alt="Globe 3D Afrique de l'Ouest"
                fill
                priority
                className="object-contain select-none pointer-events-none"
              />
            </div>

            {/* Badge flottant */}
            <div className="absolute -bottom-2 px-3.5 py-1 rounded-full border border-black/[0.1] bg-[#111111] text-[#FAF8F5] shadow-lg text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Afrique · Hub COD
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rangée inférieure : LES 5 CARTES DE STATISTIQUES RECTANGULAIRES, BIEN ARRONDIS, SANS FLÈCHES */}
      <div className="relative z-10 mt-6 pt-5 border-t border-black/[0.06]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard
            label="Visiteurs"
            value={kpis.visitors.value.toLocaleString("fr-FR")}
            hint="vs période précédente"
            delta={{
              value: kpis.visitors.delta,
              upIsGood: kpis.visitors.isUpGood,
            }}
            icon={Users}
            sparkline={[820, 940, 1120, 1050, 1280, 1340, 1450]}
          />

          <StatCard
            label="Ventes totales"
            value={<Money value={kpis.totalSales.value} />}
            hint="Commandes passées"
            delta={{
              value: kpis.totalSales.delta,
              upIsGood: kpis.totalSales.isUpGood,
            }}
            icon={ShoppingBag}
            sparkline={[340, 420, 480, 520, 610, 535, 680]}
          />

          <StatCard
            label="Ventes livrées"
            value={<Money value={kpis.deliveredSales.value} />}
            hint="CA réel encaissé en espèces"
            delta={{
              value: kpis.deliveredSales.delta,
              upIsGood: kpis.deliveredSales.isUpGood,
            }}
            icon={Wallet}
            sparkline={[220, 280, 310, 350, 395, 330, 440]}
          />

          <StatCard
            label="Commandes reçues"
            value={kpis.ordersCount.value.toLocaleString("fr-FR")}
            hint="Tous canaux confondus"
            delta={{
              value: kpis.ordersCount.delta,
              upIsGood: kpis.ordersCount.isUpGood,
            }}
            icon={Truck}
            sparkline={[22, 27, 31, 35, 39, 34, 44]}
          />

          <StatCard
            label="Taux de conversion"
            value={`${kpis.conversionRate.value}%`}
            hint="Visites → Commandes"
            delta={{
              value: kpis.conversionRate.delta,
              upIsGood: kpis.conversionRate.isUpGood,
            }}
            icon={Percent}
            sparkline={[2.6, 2.7, 2.8, 2.9, 3.1, 2.9, 3.2]}
          />
        </div>
      </div>
    </div>
  );
}
