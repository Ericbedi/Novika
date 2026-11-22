"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Filter,
  ArrowDown,
  Smartphone,
  Monitor,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Globe2,
  Share2,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Info,
  Layers,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/components/layout/app-shell";
import { canViewFunnel, canManageFunnel } from "@/config/permissions";
import { cn } from "@/lib/utils";

interface FunnelClientProps {
  storeSlug: string;
}

export function FunnelClient({ storeSlug }: FunnelClientProps) {
  const { activeRole } = useApp();

  const canView = canViewFunnel(activeRole);
  const canManage = canManageFunnel(activeRole);
  const isManager = activeRole === "manager";

  // Filtres
  const [periodFilter, setPeriodFilter] = useState<"7d" | "30d" | "today">("7d");
  const [deviceFilter, setDeviceFilter] = useState<"all" | "mobile" | "desktop">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "meta_ads" | "tiktok" | "whatsapp" | "direct">("all");
  const [productFilter, setProductFilter] = useState<string>("all");

  // Données de l'entonnoir (ajustées dynamiquement selon les filtres)
  const funnelData = useMemo(() => {
    let multiplier = periodFilter === "today" ? 0.2 : periodFilter === "30d" ? 3.8 : 1.0;
    if (deviceFilter === "mobile") multiplier *= 0.85;
    if (deviceFilter === "desktop") multiplier *= 0.15;

    const visitors = Math.round(0 * multiplier);
    const productView = Math.round(0 * multiplier);
    const clickOrder = Math.round(0 * multiplier);
    const formStarted = Math.round(0 * multiplier);
    const orderSent = Math.round(0 * multiplier);
    const orderConfirmed = Math.round(0 * multiplier); // Taux final de closing COD ~45 %

    return [
      {
        id: "step_visitors",
        label: "1. Visiteurs uniques",
        count: visitors,
        percentOfTotal: 100,
        dropOffCount: visitors - productView,
        dropOffPercent: visitors > 0 ? Math.round(((visitors - productView) / visitors) * 100) : 0,
        hint: "Trafic brut arrivant sur la vitrine depuis vos annonces ou partages WhatsApp.",
      },
      {
        id: "step_product_view",
        label: "2. Fiche produit consultée",
        count: productView,
        percentOfTotal: visitors > 0 ? Math.round((productView / visitors) * 100) : 0,
        dropOffCount: productView - clickOrder,
        dropOffPercent: productView > 0 ? Math.round(((productView - clickOrder) / productView) * 100) : 0,
        hint: "Visiteurs ayant exploré les images, les avis et la description du produit.",
      },
      {
        id: "step_click_order",
        label: "3. Clic sur « Commander »",
        count: clickOrder,
        percentOfTotal: visitors > 0 ? Math.round((clickOrder / visitors) * 100) : 0,
        dropOffCount: clickOrder - formStarted,
        dropOffPercent: clickOrder > 0 ? Math.round(((clickOrder - formStarted) / clickOrder) * 100) : 0,
        hint: "Clic sur le bouton collant mobile ou le bouton principal d'achat.",
      },
      {
        id: "step_form_started",
        label: "4. Formulaire commencé",
        count: formStarted,
        percentOfTotal: visitors > 0 ? Math.round((formStarted / visitors) * 100) : 0,
        dropOffCount: formStarted - orderSent,
        dropOffPercent: formStarted > 0 ? Math.round(((formStarted - orderSent) / formStarted) * 100) : 0,
        hint: "Visiteur ayant cliqué sur l'un des champs (nom, téléphone, ville).",
      },
      {
        id: "step_order_sent",
        label: "5. Commande envoyée",
        count: orderSent,
        percentOfTotal: visitors > 0 ? Math.round((orderSent / visitors) * 100) : 0,
        dropOffCount: orderSent - orderConfirmed,
        dropOffPercent: orderSent > 0 ? Math.round(((orderSent - orderConfirmed) / orderSent) * 100) : 0,
        hint: "Formulaire soumis et enregistré avec succès en base de données.",
      },
      {
        id: "step_order_confirmed",
        label: "6. Commande confirmée (Closeuse)",
        count: orderConfirmed,
        percentOfTotal: visitors > 0 ? Math.round((orderConfirmed / visitors) * 100) : 0,
        dropOffCount: 0,
        dropOffPercent: 0,
        hint: "Appel de la closeuse abouti avec acceptation de livraison et date convenue.",
      },
    ];
  }, [periodFilter, deviceFilter]);

  // Analyse d'abandon par champ
  const fieldDropoffs = useMemo(() => {
    return [
      {
        fieldName: "Téléphone (WhatsApp / Appel)",
        fieldKey: "phone",
        dropOffPercent: 0,
        errorTypes: ["Numéro incomplet (< 8 chiffres)", "Indicatif absent", "Client hésitant"],
        color: "bg-rose-500",
      },
      {
        fieldName: "Ville & Quartier de livraison",
        fieldKey: "city",
        dropOffPercent: 0,
        errorTypes: ["Champ laissé vide", "Ville non reconnue dans la zone"],
        color: "bg-amber-500",
      },
      {
        fieldName: "Prénom & Nom",
        fieldKey: "name",
        dropOffPercent: 0,
        errorTypes: ["Un seul mot saisi", "Caractères invalides"],
        color: "bg-blue-500",
      },
      {
        fieldName: "Choix de variante / Pack",
        fieldKey: "variant",
        dropOffPercent: 0,
        errorTypes: ["Taille XXL sélectionnée en rupture"],
        color: "bg-slate-400",
      },
    ];
  }, []);

  // Comparaison par source de trafic
  const sourcesComparison = useMemo(() => {
    return [
      {
        source: "Meta Ads (Facebook / Instagram)",
        badge: "Meta Ads",
        visitors: 0,
        orders: 0,
        conversionRate: "0 %",
        estimatedCpa: "0.00 $",
        closingRate: "0 %",
      },
      {
        source: "TikTok Ads",
        badge: "TikTok",
        visitors: 0,
        orders: 0,
        conversionRate: "0 %",
        estimatedCpa: "0.00 $",
        closingRate: "0 %",
      },
      {
        source: "WhatsApp & Recommandations",
        badge: "WhatsApp",
        visitors: 0,
        orders: 0,
        conversionRate: "0 %",
        estimatedCpa: "0.00 $",
        closingRate: "0 %",
      },
      {
        source: "Trafic Direct & Organique",
        badge: "Direct",
        visitors: 0,
        orders: 0,
        conversionRate: "0 %",
        estimatedCpa: "0.00 $",
        closingRate: "0 %",
      },
    ];
  }, []);

  // RLS : Closeuse, Livreur, Agence n'ont pas accès
  if (!canView) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-12">
        <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-10 text-center shadow-2xs space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-rose-950">Accès Restreint (Permissions RLS)</h1>
            <p className="text-xs text-rose-800 max-w-md mx-auto mt-1 leading-relaxed">
              L'entonnoir de conversion et le suivi des abandons sont réservés aux administrateurs et managers de la boutique.
            </p>
          </div>
          <Link
            href={`/app/${storeSlug}/commandes`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-colors"
          >
            <span>Retour aux Commandes</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto">
      {/* En-tête avec fil d'Ariane */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#666660] mb-1">
            <Link href={`/app/${storeSlug}/stats`} className="hover:text-[#111111]">
              Statistiques
            </Link>
            <span>/</span>
            <span className="text-[#111111]">Entonnoir de Conversion</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#111111] flex items-center gap-2.5">
            <Filter className="h-6 w-6 text-[#C2410C]" />
            <span>Entonnoir de Conversion du Parcours Client</span>
          </h1>
          <p className="text-xs text-[#666660] mt-0.5">
            Identifiez précisément où vos visiteurs décrochent : de la première vue produit jusqu'à la confirmation téléphonique.
          </p>
        </div>

        {/* Badge de respect de la confidentialité */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
          <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
          <span className="text-[11px] font-semibold">
            Conforme RGPD / APDP · 100 % Anonyme (Zéro PII ni IP)
          </span>
        </div>
      </div>

      {/* Barre de Filtres */}
      <div className="p-3 rounded-2xl border border-black/[0.08] bg-[#FAF8F5] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Période */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-black/10">
            <Calendar className="h-3.5 w-3.5 text-[#666660]" />
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="bg-transparent font-bold text-[#111111] focus:outline-none cursor-pointer"
            >
              <option value="today">Aujourd'hui</option>
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
            </select>
          </div>

          {/* Appareil */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-black/10">
            <Smartphone className="h-3.5 w-3.5 text-[#666660]" />
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value as any)}
              className="bg-transparent font-bold text-[#111111] focus:outline-none cursor-pointer"
            >
              <option value="all">Tous les appareils</option>
              <option value="mobile">Mobiles seulement (85 %)</option>
              <option value="desktop">Ordinateurs (15 %)</option>
            </select>
          </div>

          {/* Source de trafic */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-black/10">
            <Globe2 className="h-3.5 w-3.5 text-[#666660]" />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="bg-transparent font-bold text-[#111111] focus:outline-none cursor-pointer"
            >
              <option value="all">Toutes les sources de trafic</option>
              <option value="meta_ads">Meta Ads (Facebook / Insta)</option>
              <option value="tiktok">TikTok Ads</option>
              <option value="whatsapp">WhatsApp Direct</option>
              <option value="direct">Accès direct</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-[#888880] font-mono">
          Rétention des données : 90 jours
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. VISUALISATION EN ENTONNOIR (ÉTAPES & DÉPERDITION)     */}
      {/* ======================================================== */}
      <div className="rounded-3xl border border-black/[0.08] bg-[#FAF8F5] p-5 sm:p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
            Progression des Visiteurs dans l'Entonnoir
          </h2>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
            Taux de conversion global : {funnelData[0].count > 0 ? ((funnelData[5].count / funnelData[0].count) * 100).toFixed(1) : "0.0"} %
          </span>
        </div>

        {/* Étapes en barres d'entonnoir */}
        <div className="space-y-3.5" id="funnel-steps-container">
          {funnelData.map((step, idx) => (
            <div key={step.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#111111]">{step.label}</span>
                  <span className="text-[10px] text-[#888880] hidden sm:inline">
                    — {step.hint}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="font-black text-[#111111] text-sm">
                    {step.count.toLocaleString("fr-FR")}
                  </span>
                  <span className="text-[11px] font-bold text-[#666660] w-12 text-right">
                    {step.percentOfTotal} %
                  </span>
                </div>
              </div>

              {/* Barre de progression avec largeur proportionnelle */}
              <div className="w-full h-4 rounded-xl bg-black/[0.04] overflow-hidden flex items-center p-0.5">
                <div
                  className={cn(
                    "h-full rounded-lg transition-all duration-500",
                    idx === 5
                      ? "bg-emerald-600"
                      : idx >= 3
                        ? "bg-[#111111]"
                        : "bg-[#666660]"
                  )}
                  style={{ width: `${Math.max(4, step.percentOfTotal)}%` }}
                />
              </div>

              {/* Déperdition vers l'étape suivante */}
              {step.dropOffCount > 0 && (
                <div className="pl-4 py-0.5 flex items-center gap-2 text-[10px] text-rose-700 font-medium">
                  <ArrowDown className="h-3 w-3 shrink-0" />
                  <span>
                    Perte de <strong>{step.dropOffCount.toLocaleString("fr-FR")} visiteurs</strong> ({step.dropOffPercent} % de déperdition)
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Phrase d'aide factuelle automatique (Cahier des charges Prompt 05-E) */}
        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] flex items-start gap-3 shadow-2xs">
          <Sparkles className="h-5 w-5 text-[#C2410C] shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-[#111111]">
              Constat factuel d'optimisation :
            </p>
            <p className="text-[#666660] leading-relaxed">
              {funnelData[0].count > 0 ? "Des constats d'optimisation apparaîtront ici à partir de vos données réelles de parcours." : "Aucune donnée pour le moment : l'entonnoir se remplira dès que des visiteurs réels passeront par votre vitrine."}
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. ABANDON PAR CHAMP DE FORMULAIRE                       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-black/[0.08] bg-[#FAF8F5] p-5 sm:p-6 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Abandon par Champ de Saisie</span>
          </h2>
          <p className="text-xs text-[#666660]">
            Proportion des abandons enregistrés lors de la saisie du bon de commande COD (sans jamais stocker la valeur tapée).
          </p>

          <div className="space-y-4 pt-2">
            {fieldDropoffs.map((item) => (
              <div key={item.fieldKey} className="space-y-1.5 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-[#111111]">{item.fieldName}</span>
                  <span className="font-mono font-bold text-rose-700">{item.dropOffPercent} % des abandons</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-black/[0.06] overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", item.color)}
                    style={{ width: `${item.dropOffPercent}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.errorTypes.map((err, i) => (
                    <span
                      key={i}
                      className="text-[9px] bg-white border border-black/[0.06] px-2 py-0.5 rounded-md text-[#666660]"
                    >
                      {err}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. PERFORMANCE PAR SOURCE DE TRAFIC (Meta vs TikTok)     */}
        {/* ======================================================== */}
        <div className="rounded-3xl border border-black/[0.08] bg-[#FAF8F5] p-5 sm:p-6 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span>Rentabilité par Source de Trafic</span>
          </h2>
          <p className="text-xs text-[#666660]">
            Comparaison du volume de trafic, du taux de conversion et du coût moyen par commande générée.
          </p>

          <div className="space-y-3 pt-2">
            {sourcesComparison.map((sc, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#111111]">{sc.source}</span>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md text-[10px]">
                    Conv : {sc.conversionRate}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-[10px] pt-1 border-t border-black/[0.04]">
                  <div>
                    <span className="text-[#888880] block">Visiteurs</span>
                    <span className="font-mono font-bold text-[#111111]">{sc.visitors}</span>
                  </div>
                  <div>
                    <span className="text-[#888880] block">Commandes</span>
                    <span className="font-mono font-bold text-[#111111]">{sc.orders}</span>
                  </div>
                  <div>
                    <span className="text-[#888880] block">CPA Est.</span>
                    <span className="font-mono font-bold text-[#111111]">{sc.estimatedCpa}</span>
                  </div>
                  <div>
                    <span className="text-[#888880] block">Closing</span>
                    <span className="font-mono font-bold text-emerald-700">{sc.closingRate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
