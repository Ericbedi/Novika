"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import createGlobe from "cobe";
import {
  Radio,
  ExternalLink,
  Users,
  ShoppingBag,
  Wallet,
  Truck,
  Percent,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { StatCard, StatCardsGrid } from "@/components/app/stat-card";
import { Money } from "@/components/app/money";
import { PeriodType } from "@/mock-data/dashboard";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { PeriodPreset } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface CountryVisitor {
  code: string;
  name: string;
  flag: string;
  visitors: number;
  percent: number;
  lat: number;
  lng: number;
}

interface OrderPulse {
  id: string;
  country: string;
  flag: string;
  amount: number;
  currency: string;
  time: string;
  lat: number;
  lng: number;
}

interface KpiMetric {
  value: number;
  delta: number;
  isUpGood?: boolean;
}

export interface LiveGlobeCardProps {
  className?: string;
  storeSlug: string;
  storeName?: string;
  currency?: string;
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

const DEFAULT_COUNTRIES: CountryVisitor[] = [];

export function LiveGlobeCard({
  className,
  storeSlug,
  storeName = "",
  currency = "FCFA",
  period,
  onPeriodChange,
  kpis,
}: LiveGlobeCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countries, setCountries] = useState<CountryVisitor[]>(DEFAULT_COUNTRIES);
  const [activeVisitors, setActiveVisitors] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [todaySales, setTodaySales] = useState(0);
  const [recentPulses, setRecentPulses] = useState<OrderPulse[]>([]);
  const [activeCountryTooltip, setActiveCountryTooltip] = useState<CountryVisitor | null>(null);

  const [webGlSupported, setWebGlSupported] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);

  // Vérifier la télémétrie en direct via polling léger toutes les 10 secondes
  useEffect(() => {
    let isSubscribed = true;

    async function fetchLiveMetrics() {
      try {
        const res = await fetch(`/api/live/metrics?shopSlug=${storeSlug}`);
        if (res.ok && isSubscribed) {
          const data = await res.json();
          if (typeof data.activeVisitors === "number") setActiveVisitors(data.activeVisitors);
          if (data.countries) setCountries(data.countries);
          if (typeof data.todayOrdersCount === "number") setTodayOrders(data.todayOrdersCount);
          if (typeof data.todaySalesAmount === "number") setTodaySales(data.todaySalesAmount);
          if (data.recentOrderPulses) setRecentPulses(data.recentOrderPulses);
        }
      } catch (err) {
        // En cas d'erreur réseau, garder les valeurs mock en mémoire
      }
    }

    fetchLiveMetrics();
    const interval = setInterval(fetchLiveMetrics, 10000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [storeSlug]);

  // Initialisation du Globe 3D interactif avec cobe
  useEffect(() => {
    if (!canvasRef.current) return;

    // Détection de la réduction des animations
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setWebGlSupported(false);
      return;
    }

    let phi = 0;
    let width = 0;
    const currentCanvas = canvasRef.current;

    const onResize = () => {
      if (currentCanvas) {
        width = currentCanvas.offsetWidth;
      }
    };
    window.addEventListener("resize", onResize);
    onResize();

    let globe: ReturnType<typeof createGlobe> | null = null;
    let animationFrameId: number;

    try {
      // Configuration des marqueurs proportionnels aux visiteurs
      const markers = countries.map((c) => ({
        location: [c.lat, c.lng] as [number, number],
        size: Math.max(0.05, Math.min(0.12, c.visitors * 0.02)),
      }));

      globe = createGlobe(currentCanvas, {
        devicePixelRatio: 2,
        width: width * 2,
        height: width * 2,
        phi: 0,
        theta: 0.15, // centré sur l'Afrique de l'Ouest
        dark: 0,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: 6,
        baseColor: [0.94, 0.92, 0.88], // Lin doux
        markerColor: [0.76, 0.25, 0.05], // #C2410C
        glowColor: [0.9, 0.88, 0.84],
        markers,
      });

      const animate = () => {
        if (!isHovered && pointerInteracting.current === null) {
          phi += 0.004; // rotation lente et continue
        }
        if (globe) {
          globe.update({
            phi: phi + pointerInteractionMovement.current,
            width: width * 2,
            height: width * 2,
          });
        }
        animationFrameId = requestAnimationFrame(animate);
      };
      animationFrameId = requestAnimationFrame(animate);

      setWebGlSupported(true);
    } catch (e) {
      console.warn("WebGL globe initialization failed, falling back to 2D view.", e);
      setWebGlSupported(false);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (globe) globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [countries, isHovered]);

  return (
    <div
      id="live-globe-card"
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-black/[0.08] bg-[#FAF8F5] p-4 sm:p-6 shadow-[0_4px_24px_rgba(17,17,17,0.03)] transition-all duration-300",
        className
      )}
    >
      {/* Halo lumineux subtil */}
      <div className="absolute top-0 right-1/4 -z-0 h-80 w-80 rounded-full bg-[#E5DEC9]/40 blur-[100px] pointer-events-none" />

      {/* ======================================================== */}
      {/* LIGNE EN-TÊTE : Puce télémétrie + Sélecteur de période aligné à droite */}
      {/* ======================================================== */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-black/[0.06]">
        <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-[#F3EFE6] px-3.5 py-1.5 text-xs font-bold text-[#111111]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
          </span>
          <span>Réseau COD Afrique de l'Ouest · En direct</span>
        </div>

        {/* Sélecteur de période universel avec panneau 820px, aligné à droite */}
        <DateRangePicker
          preset={period as PeriodPreset}
          onChange={(p) => onPeriodChange(p as PeriodType)}
          align="right"
        />
      </div>

      {/* ======================================================== */}
      {/* ZONE CENTRALE : Globe agrandi à gauche + Panneau d'informations à droite */}
      {/* ======================================================== */}
      <div className="relative z-10 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Colonne Gauche : Globe agrandi clamp(320px, 32vw, 460px) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative select-none">
          {/* Badge flottant En direct au-dessus du globe */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-black/[0.08] bg-white text-xs font-bold text-[#111111] shadow-2xs mb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>En direct · {activeVisitors} visiteurs</span>
          </div>

          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onPointerDown={(e) => {
              pointerInteracting.current =
                e.clientX - pointerInteractionMovement.current;
              if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
            }}
            onPointerUp={() => {
              pointerInteracting.current = null;
              if (canvasRef.current) canvasRef.current.style.cursor = "grab";
            }}
            onPointerOut={() => {
              pointerInteracting.current = null;
              if (canvasRef.current) canvasRef.current.style.cursor = "grab";
            }}
            onPointerMove={(e) => {
              if (pointerInteracting.current !== null) {
                const delta = e.clientX - pointerInteracting.current;
                pointerInteractionMovement.current = delta * 0.005;
              }
            }}
            style={{
              width: "clamp(320px, 32vw, 460px)",
              height: "clamp(320px, 32vw, 460px)",
            }}
            className="relative flex items-center justify-center"
          >
            {webGlSupported ? (
              <canvas
                ref={canvasRef}
                style={{
                  width: "100%",
                  height: "100%",
                  contain: "layout paint size",
                  cursor: "grab",
                }}
                className="filter drop-shadow-[0_16px_32px_rgba(17,17,17,0.12)]"
              />
            ) : (
              /* Repli 2D propre si WebGL indisponible ou animations réduites */
              <div className="w-full h-full rounded-full border border-black/[0.1] bg-[#F3EFE6] p-6 flex flex-col items-center justify-center text-center shadow-inner">
                <span className="text-3xl mb-2">🌍</span>
                <p className="text-xs font-bold text-[#111111]">Vue télémétrique 2D active</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {countries.map((c) => (
                    <span
                      key={c.code}
                      className="px-2 py-1 rounded-full bg-white border border-black/[0.08] text-[10px] font-bold"
                    >
                      {c.flag} {c.name} ({c.visitors})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Impulsion visuelle sur commande récente */}
            {recentPulses.length > 0 && (
              <div
                role="status"
                aria-live="polite"
                className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#111111] text-[#FAF8F5] text-[10px] font-bold shadow-lg flex items-center gap-1.5 animate-bounce"
              >
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>
                  Nouvelle commande : {recentPulses[0].country} ·{" "}
                  {recentPulses[0].amount.toLocaleString("fr-FR")} {recentPulses[0].currency}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Colonne Droite : Panneau d'informations en direct */}
        <div className="lg:col-span-6 space-y-5">
          {/* Métrique principale : Visiteurs en ce moment */}
          <div className="p-4 sm:p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs font-bold text-[#666660] uppercase tracking-wider">
                  Visiteurs en ce moment
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-[#111111] tracking-tight">
                    {activeVisitors}
                  </span>
                  <span className="text-xs font-semibold text-[#888880]">(estimation)</span>
                </div>
              </div>

              {/* Compteurs du jour */}
              <div className="text-right">
                <p className="text-[11px] font-bold text-[#666660] uppercase tracking-wider">
                  Commandes aujourd'hui
                </p>
                <p className="text-base font-black text-[#111111] mt-0.5">{todayOrders}</p>
                <p className="text-[11px] font-semibold text-emerald-700">
                  {todaySales.toLocaleString("fr-FR")} {currency}
                </p>
              </div>
            </div>
          </div>

          {/* Liste Pays d'Origine (Top 5 + barres de proportion) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-[#666660] px-1">
              <span>Pays d'origine</span>
              <span>Visiteurs en direct</span>
            </div>

            {countries.length > 0 ? (
              <div className="space-y-1.5">
                {countries.slice(0, 5).map((country) => (
                  <div
                    key={country.code}
                    onMouseEnter={() => setActiveCountryTooltip(country)}
                    onMouseLeave={() => setActiveCountryTooltip(null)}
                    className="p-2.5 rounded-xl border border-black/[0.06] bg-white/80 hover:bg-white transition-all text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{country.flag}</span>
                        <span className="font-bold text-[#111111]">{country.name}</span>
                      </div>
                      <span className="font-mono font-bold text-[#111111]">
                        {country.visitors} ({country.percent}%)
                      </span>
                    </div>

                    {/* Barre de proportion */}
                    <div className="w-full h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, country.percent * 2)}%` }}
                        className="h-full rounded-full bg-[#C2410C] transition-all duration-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-white border border-black/[0.06] text-xs text-[#666660]">
                Aucun visiteur pour l'instant
              </div>
            )}
          </div>

          {/* Bouton d'accès à la vue en direct complète */}
          <div className="pt-2">
            <Link
              href={`/app/${storeSlug}/stats/live`}
              id="btn-open-live-view"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-xs group"
            >
              <span>Ouvrir la vue en direct</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RANGÉE INFÉRIEURE : LES 5 CARTES DE STATISTIQUES RECTANGULAIRES */}
      {/* ======================================================== */}
      <div className="relative z-10 mt-6 pt-5 border-t border-black/[0.08] -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-1 sm:px-1.5 py-4 bg-white/[0.2]">
        <StatCardsGrid id="dashboard-stat-cards-grid">
          <StatCard
            id="stat-card-visitors"
            label="Visiteurs"
            numericValue={0}
            hint="vs période précédente"
            icon={Users}
          />

          <StatCard
            id="stat-card-total-sales"
            label="Ventes totales"
            numericValue={0}
            currency="FCFA"
            hint="Commandes passées"
            icon={ShoppingBag}
          />

          <StatCard
            id="stat-card-delivered-sales"
            label="Ventes livrées"
            numericValue={0}
            currency="FCFA"
            hint="CA réel encaissé en espèces"
            icon={Wallet}
          />

          <StatCard
            id="stat-card-orders-count"
            label="Commandes reçues"
            numericValue={0}
            hint="Tous canaux confondus"
            icon={Truck}
          />

          <StatCard
            id="stat-card-conversion-rate"
            label="Taux de conversion"
            numericValue={0}
            hint="Visites → Commandes"
            icon={Percent}
          />
        </StatCardsGrid>
      </div>
    </div>
  );
}
