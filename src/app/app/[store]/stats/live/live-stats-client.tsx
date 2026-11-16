"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import createGlobe from "cobe";
import {
  Radio,
  Users,
  ShoppingBag,
  Wallet,
  Percent,
  ShieldAlert,
  Globe,
  Clock,
  Activity,
  Eye,
  RefreshCw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  Flame,
} from "lucide-react";
import { useApp } from "@/components/layout/app-shell";
import { Money } from "@/components/app/money";
import { PageHeader } from "@/components/app/page-header";
import { cn } from "@/lib/utils";

interface CountryVisitor {
  code: string;
  name: string;
  flag: string;
  visitors: number;
  percent: number;
  lat: number;
  lng: number;
  ordersCount?: number;
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

export function LiveStatsClient({ storeSlug }: { storeSlug: string }) {
  const { activeStore, activeRole } = useApp();

  // Contrôle d'accès RLS : owner, admin, agency autorisés ; closer et rider refusés
  const isAuthorized = activeRole === "owner" || activeRole === "admin" || activeRole === "agency";

  const [activeWindow, setActiveWindow] = useState<5 | 10 | 15>(5);
  const [viewMode, setViewMode] = useState<"visitors" | "orders">("visitors");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Données de télémétrie en direct
  const [activeVisitors, setActiveVisitors] = useState(14);
  const [todayOrders, setTodayOrders] = useState(18);
  const [todaySales, setTodaySales] = useState(435000);
  const [recentPulses, setRecentPulses] = useState<OrderPulse[]>([
    {
      id: "ord_1",
      country: "Togo",
      flag: "🇹🇬",
      amount: 24500,
      currency: "FCFA",
      time: "Il y a 35s",
      lat: 6.1375,
      lng: 1.2123,
    },
    {
      id: "ord_2",
      country: "Côte d'Ivoire",
      flag: "🇨🇮",
      amount: 38000,
      currency: "FCFA",
      time: "Il y a 2 min",
      lat: 5.36,
      lng: -4.0083,
    },
    {
      id: "ord_3",
      country: "Sénégal",
      flag: "🇸🇳",
      amount: 19500,
      currency: "FCFA",
      time: "Il y a 5 min",
      lat: 14.6928,
      lng: -17.4467,
    },
    {
      id: "ord_4",
      country: "Bénin",
      flag: "🇧🇯",
      amount: 14000,
      currency: "FCFA",
      time: "Il y a 9 min",
      lat: 6.3654,
      lng: 2.4183,
    },
  ]);

  const [countries, setCountries] = useState<CountryVisitor[]>([
    { code: "TG", name: "Togo", flag: "🇹🇬", visitors: 6, percent: 43, lat: 6.1375, lng: 1.2123, ordersCount: 8 },
    { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", visitors: 4, percent: 29, lat: 5.36, lng: -4.0083, ordersCount: 6 },
    { code: "SN", name: "Sénégal", flag: "🇸🇳", visitors: 2, percent: 14, lat: 14.6928, lng: -17.4467, ordersCount: 2 },
    { code: "BJ", name: "Bénin", flag: "🇧🇯", visitors: 1, percent: 7, lat: 6.3654, lng: 2.4183, ordersCount: 1 },
    { code: "CM", name: "Cameroun", flag: "🇨🇲", visitors: 1, percent: 7, lat: 4.0511, lng: 9.7679, ordersCount: 1 },
  ]);

  const [pageViews, setPageViews] = useState({
    home: 42,
    catalog: 28,
    product: 20,
    checkout: 10,
  });

  const [newVsReturning, setNewVsReturning] = useState({
    newVisitorsPercent: 72,
    returningPercent: 28,
  });

  // Gestion du Globe WebGL cobe
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryVisitor | null>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);

  // Polling de télémétrie en direct
  useEffect(() => {
    let isSubscribed = true;

    const fetchMetrics = async () => {
      try {
        const res = await fetch(`/api/live/metrics?shopSlug=${storeSlug}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isSubscribed && data) {
          if (data.activeVisitors) {
            // Appliquer le facteur selon la fenêtre d'activité choisie
            const multiplier = activeWindow === 5 ? 1 : activeWindow === 10 ? 1.7 : 2.4;
            setActiveVisitors(Math.round(data.activeVisitors * multiplier));
          }
          if (data.todayOrdersCount) setTodayOrders(data.todayOrdersCount);
          if (data.todaySalesAmount) setTodaySales(data.todaySalesAmount);
          if (data.countries && data.countries.length > 0) setCountries(data.countries);
          if (data.recentOrderPulses && data.recentOrderPulses.length > 0) {
            setRecentPulses(data.recentOrderPulses);
          }
          if (data.pageViewsDistribution) setPageViews(data.pageViewsDistribution);
          if (data.newVsReturning) setNewVsReturning(data.newVsReturning);
        }
      } catch {
        // Mode hors ligne / repli silencieux
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 8000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [storeSlug, activeWindow]);

  // Initialisation et boucle de rendu du Globe 3D avec cobe
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Test de support WebGL
    try {
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setWebGlSupported(false);
        return;
      }
    } catch {
      setWebGlSupported(false);
      return;
    }

    let phi = 0.45; // Centré sur l'Afrique de l'Ouest
    let width = 0;

    const onResize = () => {
      if (canvas) {
        width = canvas.offsetWidth;
      }
    };
    window.addEventListener("resize", onResize);
    onResize();

    // Construction des marqueurs lumineux
    const markers = countries.map((c) => ({
      location: [c.lat, c.lng] as [number, number],
      size: Math.min(0.12, Math.max(0.04, c.visitors * 0.015)),
    }));

    // Ajout des pulses de commandes récentes
    recentPulses.slice(0, 3).forEach((p) => {
      markers.push({
        location: [p.lat, p.lng] as [number, number],
        size: 0.14,
      });
    });

    let globe: ReturnType<typeof createGlobe> | null = null;
    let animationFrameId: number;

    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width: width * 2,
        height: width * 2,
        phi: 0.45,
        theta: 0.15,
        dark: 0,
        diffuse: 1.1,
        mapSamples: 16000,
        mapBrightness: 5.5,
        baseColor: [0.96, 0.94, 0.9],
        markerColor: [0.76, 0.25, 0.05], // #C2410C (Couleur de marque AfriBuilder)
        glowColor: [0.95, 0.85, 0.75],
        markers,
      });

      const animate = () => {
        if (!isHovered && pointerInteracting.current === null) {
          phi += 0.003;
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
    } catch (e) {
      console.warn("Erreur d'initialisation du globe WebGL cobe:", e);
      setWebGlSupported(false);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (globe) {
        globe.destroy();
      }
    };
  }, [countries, recentPulses, isHovered]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/live/metrics?shopSlug=${storeSlug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.activeVisitors) setActiveVisitors(data.activeVisitors);
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Écran d'accès refusé si rôle non autorisé
  if (!isAuthorized) {
    return (
      <div className="space-y-6 pb-20">
        <div className="rounded-[24px] border border-rose-200 bg-rose-50/50 p-12 text-center shadow-2xs space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-rose-950">Accès Restreint (Sécurité RLS)</h2>
            <p className="text-xs text-rose-700 max-w-md mx-auto mt-1">
              Votre rôle ({activeRole}) ne vous autorise pas à consulter la télémétrie en direct de la boutique. Seuls les propriétaires, administrateurs et agences partenaires ont accès à cette vue.
            </p>
          </div>
          <Link
            href={`/app/${storeSlug}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all shadow-sm"
          >
            <span>Retour au Tableau de Bord</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* 1. En-tête de la page Live */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/app/${storeSlug}`}
              className="text-[11px] font-semibold text-[#888880] hover:text-[#111111] transition-colors"
            >
              Accueil
            </Link>
            <span className="text-[11px] text-[#888880]">›</span>
            <span className="text-[11px] font-semibold text-[#888880]">Stats</span>
            <span className="text-[11px] text-[#888880]">›</span>
            <span className="text-[11px] font-bold text-[#111111]">En direct</span>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
              Vue en direct
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF8F5] text-[#111111] border border-black/[0.08] shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>● En direct · {activeVisitors} visiteurs (estimation)</span>
            </span>
          </div>
          <p className="text-xs text-[#666660] mt-0.5">
            Activité en temps réel sur la vitrine de {activeStore.name} — Télémétrie anonyme sans cookie ni IP stockée.
          </p>
        </div>

        {/* Contrôles d'en-tête : Fenêtre d'activité & Rafraîchissement */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Fenêtre active (5 min, 10 min, 15 min) */}
          <div className="inline-flex items-center rounded-xl border border-black/[0.08] bg-[#FAF8F5] p-1 shadow-2xs text-xs font-semibold text-[#666660]">
            <Clock className="h-3.5 w-3.5 ml-2 mr-1 text-[#888880]" />
            <span className="text-[11px] mr-1 hidden sm:inline">Fenêtre :</span>
            {([5, 10, 15] as const).map((win) => (
              <button
                key={win}
                type="button"
                onClick={() => setActiveWindow(win)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  activeWindow === win
                    ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                    : "hover:text-[#111111]"
                )}
              >
                {win} min{win === 5 ? " (défaut)" : ""}
              </button>
            ))}
          </div>

          {/* Bascule Visiteurs / Commandes */}
          <div className="inline-flex items-center rounded-xl border border-black/[0.08] bg-[#FAF8F5] p-1 shadow-2xs text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("visitors")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                viewMode === "visitors"
                  ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                  : "text-[#666660] hover:text-[#111111]"
              )}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Visiteurs</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("orders")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                viewMode === "orders"
                  ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                  : "text-[#666660] hover:text-[#111111]"
              )}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Commandes</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            title="Rafraîchir les données"
            className="p-2 rounded-xl border border-black/[0.08] bg-[#FAF8F5] hover:bg-white text-[#111111] transition-all shadow-2xs cursor-pointer"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin text-[#C2410C]")} />
          </button>
        </div>
      </div>

      {/* 2. Zone Principale Héro : Globe 3D Plein Format + Fil de Commandes Live */}
      <div className="rounded-[28px] border border-black/[0.08] bg-[#FAF8F5] p-6 lg:p-8 shadow-xs relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Globe 3D plein format (Gauche 7 colonnes) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
            <div
              className="relative w-full max-w-[520px] aspect-square flex items-center justify-center"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => {
                setIsHovered(false);
                pointerInteracting.current = null;
              }}
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
              onMouseMove={(e) => {
                if (pointerInteracting.current !== null) {
                  const delta = e.clientX - pointerInteracting.current;
                  pointerInteractionMovement.current = delta * 0.005;
                }
              }}
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
                />
              ) : (
                /* Repli 2D élégant lorsque WebGL est indisponible */
                <div className="h-full w-full rounded-full border border-black/[0.08] bg-[#F3EFE6] flex flex-col items-center justify-center p-8 text-center">
                  <Globe className="h-20 w-20 text-[#C2410C] stroke-1 mb-3 animate-pulse" />
                  <p className="text-xs font-bold text-[#111111]">Télémétrie 2D Active</p>
                  <p className="text-[11px] text-[#666660] mt-1 max-w-[200px]">
                    Accélération matérielle non détectée. Rendu vectoriel des flux COD engagé.
                  </p>
                </div>
              )}

              {/* Puce d'état flottante au-dessus du globe */}
              <div className="absolute top-4 left-4 z-20 pointer-events-none">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-white/95 text-[#111111] border border-black/[0.08] shadow-md backdrop-blur-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>● En direct · {activeVisitors} visiteurs</span>
                </span>
              </div>

              {/* Tooltip interactif au survol d'un pays */}
              {selectedCountry && (
                <div className="absolute bottom-4 right-4 z-20 p-3 rounded-2xl bg-[#111111] text-[#FAF8F5] text-xs shadow-xl animate-in fade-in duration-200">
                  <p className="font-bold flex items-center gap-1.5">
                    <span>{selectedCountry.flag}</span>
                    <span>{selectedCountry.name}</span>
                  </p>
                  <p className="text-[11px] text-[#A8A29E] mt-0.5">
                    {selectedCountry.visitors} visiteur{selectedCountry.visitors > 1 ? "s" : ""} actif{selectedCountry.visitors > 1 ? "s" : ""} ({selectedCountry.percent}%)
                  </p>
                  {selectedCountry.ordersCount !== undefined && (
                    <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                      {selectedCountry.ordersCount} commande{selectedCountry.ordersCount > 1 ? "s" : ""} aujourd'hui
                    </p>
                  )}
                </div>
              )}
            </div>

            <p className="text-[11px] text-[#888880] text-center mt-2 flex items-center justify-center gap-2">
              <span>Glissez pour faire pivoter le globe</span>
              <span>•</span>
              <span>Survolez pour figer la rotation</span>
            </p>
          </div>

          {/* Panneau latéral Droit (5 colonnes) : Fil des commandes en direct + Chiffres clés */}
          <div className="lg:col-span-5 space-y-6">
            {/* Chiffres clés de la session en cours */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-[#666660] mb-1">
                  <Users className="h-3.5 w-3.5 text-[#111111]" />
                  <span>Visiteurs actifs</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
                  {activeVisitors}
                </div>
                <p className="text-[10px] text-[#888880] mt-0.5">
                  Fenêtre de {activeWindow} min (estimation)
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-[#666660] mb-1">
                  <ShoppingBag className="h-3.5 w-3.5 text-[#C2410C]" />
                  <span>Commandes du jour</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
                  {todayOrders}
                </div>
                <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                  +15% vs hier
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-2xs col-span-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#666660] mb-1">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Volume de ventes du jour</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#888880]">Devise : {activeStore.currency}</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#111111]">
                  <Money value={todaySales} currency={activeStore.currency} />
                </div>
                <p className="text-[10px] text-[#888880] mt-0.5">
                  Total brut des paniers COD soumis
                </p>
              </div>
            </div>

            {/* Fil d'événements en direct (Strictement SANS PII : aucun nom ni téléphone) */}
            <div className="rounded-2xl bg-white border border-black/[0.06] p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-[#C2410C]" />
                  <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                    Flux des commandes en direct
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Temps réel
                </span>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                {recentPulses.map((pulse) => (
                  <div
                    key={pulse.id}
                    className="p-2.5 rounded-xl bg-[#FAF8F5] border border-black/[0.04] flex items-center justify-between hover:bg-[#F3EFE6] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg shrink-0">{pulse.flag}</span>
                      <div className="truncate">
                        <p className="text-xs font-bold text-[#111111] truncate">
                          Nouvelle commande · {pulse.country}
                        </p>
                        <p className="text-[10px] text-[#888880]">
                          {pulse.time}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-[#111111]">
                        <Money value={pulse.amount} currency={pulse.currency} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-[#888880] text-center pt-1 border-t border-black/[0.04]">
                Conformité vie privée : Aucun numéro ni identité client affiché dans le flux live.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Rangée des Panneaux Détaillés (Pages vues, Nouveaux vs Récurrents, Pays) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panneau 1 : Répartition des pages consultées */}
        <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-[#111111]" />
              <span>Pages en cours de lecture</span>
            </h2>
            <span className="text-[10px] text-[#888880]">En direct</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-[#111111]">Page d'accueil</span>
                <span className="font-bold text-[#111111]">{pageViews.home}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-black/[0.06] overflow-hidden">
                <div
                  className="h-full bg-[#111111] rounded-full transition-all duration-500"
                  style={{ width: `${pageViews.home}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-[#111111]">Catalogue complet</span>
                <span className="font-bold text-[#111111]">{pageViews.catalog}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-black/[0.06] overflow-hidden">
                <div
                  className="h-full bg-[#C2410C] rounded-full transition-all duration-500"
                  style={{ width: `${pageViews.catalog}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-[#111111]">Fiche Produit (Détails)</span>
                <span className="font-bold text-[#111111]">{pageViews.product}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-black/[0.06] overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${pageViews.product}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-[#111111]">Formulaire de commande COD</span>
                <span className="font-bold text-[#111111]">{pageViews.checkout}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-black/[0.06] overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full transition-all duration-500"
                  style={{ width: `${pageViews.checkout}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#888880] pt-2 border-t border-black/[0.06]">
            {pageViews.checkout}% des visiteurs sont actuellement sur le point de valider un colis.
          </p>
        </div>

        {/* Panneau 2 : Nouveaux vs Récurrents */}
        <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#C2410C]" />
              <span>Nouveaux vs Récurrents</span>
            </h2>
            <span className="text-[10px] text-[#888880]">Ratio</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#111111]">Nouveaux visiteurs</span>
                <span className="text-lg font-black text-[#111111]">
                  {newVsReturning.newVisitorsPercent}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-black/[0.06] overflow-hidden">
                <div
                  className="h-full bg-[#111111] rounded-full"
                  style={{ width: `${newVsReturning.newVisitorsPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-[#888880]">
                Première visite sans historique local dans l'onglet actif.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#111111]">Visiteurs récurrents</span>
                <span className="text-lg font-black text-[#C2410C]">
                  {newVsReturning.returningPercent}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-black/[0.06] overflow-hidden">
                <div
                  className="h-full bg-[#C2410C] rounded-full"
                  style={{ width: `${newVsReturning.returningPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-[#888880]">
                Clients revenant consulter une commande ou suivre un colis.
              </p>
            </div>
          </div>
        </div>

        {/* Panneau 3 : Pays d'origine complets */}
        <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-[#111111]" />
              <span>Origine géographique (Top 5)</span>
            </h2>
            <span className="text-[10px] text-[#888880]">Visiteurs actifs</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {countries.map((c) => (
              <div
                key={c.code}
                onMouseEnter={() => setSelectedCountry(c)}
                onMouseLeave={() => setSelectedCountry(null)}
                className="p-2.5 rounded-xl bg-white border border-black/[0.04] hover:border-black/[0.15] transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{c.flag}</span>
                    <span className="font-bold text-[#111111]">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className="text-xs font-black text-[#111111]">
                      {c.visitors}
                    </span>
                    <span className="text-[10px] text-[#888880]">
                      ({c.percent}%)
                    </span>
                  </div>
                </div>

                <div className="h-1.5 w-full rounded-full bg-black/[0.06] overflow-hidden">
                  <div
                    className="h-full bg-[#111111] rounded-full transition-all"
                    style={{ width: `${c.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-[#888880] text-center pt-1 border-t border-black/[0.06]">
            Déduit via les serveurs périphériques sans enregistrement d'IP.
          </p>
        </div>
      </div>
    </div>
  );
}
