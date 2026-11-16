"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  PackageCheck,
  CheckCircle2,
  Clock,
  Truck,
  Building,
  AlertTriangle,
  RotateCcw,
  XCircle,
  MessageCircle,
  ShieldCheck,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  HelpCircle,
  KeyRound,
  FileQuestion,
  User,
} from "lucide-react";
import {
  TrackingPublicOrder,
  TrackingStatus,
  TRACKING_STATUS_CONFIG,
  TRACKING_NORMAL_STATUSES,
} from "@/server/data/tracking-types";
import { CountryFlag } from "@/components/ui/country-flag";
import { cn } from "@/lib/utils";

interface TrackingClientProps {
  token: string;
  initialOrder: TrackingPublicOrder | null;
}

export function TrackingClient({ token, initialOrder }: TrackingClientProps) {
  const [order, setOrder] = useState<TrackingPublicOrder | null>(initialOrder);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [isLiveConnected, setIsLiveConnected] = useState(true);

  // Rafraîchissement automatique toutes les 30 secondes (Fallback réseau lent Prompt 05-T)
  const refreshTrackingData = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/tracking/${token}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        setIsLiveConnected(true);
      } else {
        if (res.status === 404) {
          setOrder(null);
        }
      }
    } catch {
      setIsLiveConnected(false);
    } finally {
      if (manual) setIsRefreshing(false);
      setLastRefreshedAt(new Date());
    }
  }, [token]);

  // Connexion temps réel SSE (< 5 secondes) avec repli vers scrutation 30s (Prompt 05-T)
  useEffect(() => {
    if (!initialOrder || typeof window === "undefined" || !window.EventSource) return;

    let es: EventSource | null = null;
    try {
      es = new EventSource(`/api/tracking/${token}/stream`);

      es.onmessage = (event) => {
        try {
          const updated = JSON.parse(event.data);
          if (updated && updated.token) {
            setOrder(updated);
            setIsLiveConnected(true);
            setLastRefreshedAt(new Date());
          }
        } catch {
          // Erreur de parsing mineure
        }
      };

      es.onerror = () => {
        setIsLiveConnected(false);
        // En cas de coupure du flux SSE, on bascule vers le rafraîchissement périodique
        es?.close();
      };
    } catch {
      setIsLiveConnected(false);
    }

    return () => {
      es?.close();
    };
  }, [token, initialOrder]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshTrackingData(false);
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [refreshTrackingData]);

  // =========================================================================
  // Cas 1 : Jeton introuvable ou expiré (Prompt 05-T # Lien de suivi)
  // Page neutre qui ne révèle JAMAIS si la commande existe ou a existé
  // =========================================================================
  if (!order) {
    return (
      <main className="min-h-screen bg-[#FAF8F5] text-[#111111] flex flex-col justify-between p-4 sm:p-6 font-sans antialiased">
        <div className="w-full max-w-md mx-auto pt-16 sm:pt-24 text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <FileQuestion className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">
            Lien de suivi non disponible
          </h1>
          <p className="text-sm text-[#666660] mt-3 leading-relaxed">
            Ce lien de suivi n&apos;est plus actif ou a expiré par mesure de confidentialité.
            Les liens de suivi expirent automatiquement 30 jours après la livraison ou l&apos;annulation.
          </p>
          <div className="mt-8 p-4 rounded-2xl bg-white border border-black/[0.08] text-xs text-[#666660] text-left space-y-2">
            <p className="font-semibold text-[#111111]">Que faire ?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Vérifiez l&apos;adresse web reçue par SMS ou WhatsApp.</li>
              <li>Contactez directement la boutique pour obtenir l&apos;état actualisé de votre livraison.</li>
            </ul>
          </div>
        </div>

        <footer className="w-full max-w-md mx-auto pt-8 pb-4 text-center text-xs text-[#888880]">
          <p className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Suivi sécurisé Novika · Confidentialité garantie
          </p>
        </footer>
      </main>
    );
  }

  // =========================================================================
  // Cas 2 : Commande valide - Frise d'acheminement en direct
  // =========================================================================
  const statusCfg = TRACKING_STATUS_CONFIG[order.status];
  const isSpecialStatus = statusCfg.isSpecial;

  // Modèle WhatsApp pré-rempli pour contacter la boutique
  const whatsappUrl = `https://wa.me/${order.shopWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Bonjour, je vous contacte concernant ma commande ${order.orderNumber} (${order.customerFirstName}, ${order.city}).`
  )}`;

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#111111] p-3 sm:p-6 font-sans antialiased">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">

        {/* 1. En-tête : Marque de la boutique (Prompt 05-T : Marque boutique, pas Novika) */}
        <header className="bg-white rounded-3xl p-5 sm:p-6 border border-black/[0.08] shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {order.shopLogo ? (
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-black/[0.08] bg-muted/20 shrink-0 flex items-center justify-center">
                <Image
                  src={order.shopLogo}
                  alt={order.shopName}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-bold text-lg flex items-center justify-center shrink-0 border border-primary/20">
                {order.shopName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-[11px] font-semibold tracking-wider text-[#888880] uppercase block">
                Suivi de livraison
              </span>
              <h1 className="text-lg sm:text-xl font-black text-[#111111] truncate">
                {order.shopName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => refreshTrackingData(true)}
              disabled={isRefreshing}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-black/[0.08] bg-[#FAF8F5] hover:bg-black/[0.04] text-xs font-semibold text-[#666660] flex items-center gap-1.5 transition-colors cursor-pointer"
              aria-label="Actualiser le statut"
              title="Actualiser en direct"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-primary")} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          </div>
        </header>

        {/* 2. Carte Résumé Commande */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-black/[0.08] shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] pb-4">
            <div>
              <span className="text-xs text-[#888880]">N° de commande</span>
              <div className="text-base sm:text-lg font-black text-[#111111] tracking-tight">
                {order.orderNumber}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CountryFlag code={order.country} width={22} height={15} />
              <div className="text-right">
                <span className="text-xs text-[#888880] block">Destination</span>
                <span className="text-xs font-bold text-[#111111]">{order.city}</span>
              </div>
            </div>
          </div>

          {/* Minimisation stricte PII (K1) */}
          <div className="flex items-center justify-between text-xs py-1 px-1 border-b border-black/[0.04]">
            <span className="text-[#666660]">
              Destinataire : <strong className="text-[#111111] font-bold">{order.maskedCustomerName || "Awa T."}</strong>
            </span>
            <span className="text-[#666660] font-mono text-[11px]">
              {order.maskedCustomerPhone || "+225 •• •• •• 02"}
            </span>
          </div>

          {/* Bannière d'état principal */}
          <div
            className={cn(
              "p-4 rounded-2xl border flex items-start gap-3.5 transition-colors",
              statusCfg.badgeVariant === "success" && "bg-emerald-500/10 border-emerald-500/30 text-emerald-950",
              statusCfg.badgeVariant === "warning" && "bg-amber-500/10 border-amber-500/30 text-amber-950",
              statusCfg.badgeVariant === "destructive" && "bg-rose-500/10 border-rose-500/30 text-rose-950",
              statusCfg.badgeVariant === "info" && "bg-blue-500/10 border-blue-500/30 text-blue-950"
            )}
          >
            <div className="shrink-0 mt-0.5">
              {order.status === "delivered" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {order.status === "in_transit" && <Truck className="w-5 h-5 text-amber-600 animate-pulse" />}
              {order.status === "handed_over" && <PackageCheck className="w-5 h-5 text-amber-600" />}
              {isSpecialStatus && <AlertTriangle className="w-5 h-5 text-rose-600" />}
              {!isSpecialStatus && order.status !== "delivered" && order.status !== "in_transit" && order.status !== "handed_over" && (
                <Clock className="w-5 h-5 text-blue-600" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base">
                  {statusCfg.label}
                </span>
                {isLiveConnected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                    En direct
                  </span>
                )}
              </div>
              <p className="text-xs mt-1 text-[#666660] leading-relaxed">
                {statusCfg.description}
              </p>
            </div>
          </div>

          {/* Option Preuve de livraison : Code à 4 chiffres visible par le client (Prompt 05-T # Preuve de livraison) */}
          {order.requiresProofCode && order.proofCodeForCustomer && order.status !== "delivered" && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 space-y-2">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-950">
                  Preuve de livraison
                </span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                Communiquez ce code de sécurité à 4 chiffres à votre livreur au moment de la remise du colis :
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-amber-300 font-mono text-xl sm:text-2xl font-black text-amber-950 tracking-[0.25em] shadow-xs">
                {order.proofCodeForCustomer}
              </div>
            </div>
          )}

          {/* Mention du Livreur ou Agence (si configuré) */}
          {(order.courierFirstName || order.agencyName) && (
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-[#666660]">
                {order.courierFirstName ? (
                  <>
                    <User className="w-4 h-4 text-primary" />
                    <span>
                      Livreur assigné : <strong className="text-[#111111]">{order.courierFirstName}</strong>
                    </span>
                  </>
                ) : (
                  <>
                    <Building className="w-4 h-4 text-primary" />
                    <span>
                      Agence : <strong className="text-[#111111]">{order.agencyName}</strong>
                      {order.agencyTrackingNumber && ` (Réf: ${order.agencyTrackingNumber})`}
                    </span>
                  </>
                )}
              </div>
              <span className="text-[11px] text-[#888880]">Livraison sécurisée</span>
            </div>
          )}
        </div>

        {/* 3. Frise Chronologique Étape par Étape (Prompt 05-T # Frise des statuts) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-black/[0.08] shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#111111] uppercase tracking-wider">
              Acheminement du colis
            </h2>
            <span className="text-xs text-[#888880]">6 étapes</span>
          </div>

          {/* Stepper horizontal/vertical responsive */}
          <div className="relative pt-2">
            <div className="space-y-4">
              {order.timeline.map((step, idx) => {
                const isStepDelivered = step.status === "delivered";

                return (
                  <div key={step.status} className="flex items-start gap-3.5 relative group">
                    {/* Ligne connectrice */}
                    {idx < order.timeline.length - 1 && (
                      <div
                        className={cn(
                          "absolute left-4 top-8 -bottom-3 w-0.5 -translate-x-1/2 transition-colors",
                          step.completed ? "bg-emerald-600" : "bg-black/[0.08]"
                        )}
                      />
                    )}

                    {/* Pastille de statut */}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-mono text-xs font-bold transition-all relative z-10",
                        step.completed
                          ? "bg-emerald-600 text-white shadow-xs"
                          : step.current
                            ? "bg-primary text-white ring-4 ring-primary/20 shadow-sm"
                            : "bg-muted text-muted-foreground border border-black/[0.08]"
                      )}
                    >
                      {step.completed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : step.current ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {/* Texte de l'étape */}
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <span
                          className={cn(
                            "text-sm font-bold tracking-tight",
                            step.completed || step.current ? "text-[#111111]" : "text-[#888880]"
                          )}
                        >
                          {step.label}
                        </span>
                        {step.timestamp && (
                          <span className="text-xs text-[#888880] font-mono">
                            {step.timestamp}
                          </span>
                        )}
                      </div>

                      {step.message && (
                        <p className="text-xs text-[#666660] mt-0.5 leading-relaxed">
                          {step.message}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Détails des articles (Prompt 05-T # Champs publics) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-black/[0.08] shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#888880]" />
            <h2 className="text-sm font-extrabold text-[#111111] uppercase tracking-wider">
              Contenu du colis ({order.items.reduce((acc, i) => acc + i.quantity, 0)} article{order.items.reduce((acc, i) => acc + i.quantity, 0) > 1 ? "s" : ""})
            </h2>
          </div>

          <div className="divide-y divide-black/[0.06]">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {item.image && (
                    <div className="w-11 h-11 rounded-xl bg-muted/30 border border-black/[0.08] overflow-hidden shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={44}
                        height={44}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-[#111111] truncate">
                      {item.name}
                    </p>
                    {item.variant && (
                      <span className="text-[11px] text-[#888880] block truncate">
                        {item.variant}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs font-mono font-bold text-[#111111] px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-black/[0.08] shrink-0">
                  Qté : {item.quantity}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Contact WhatsApp Boutique (Prompt 05-T # Bouton Contacter la boutique) */}
        <div className="bg-white rounded-3xl p-5 border border-black/[0.08] shadow-sm text-center space-y-3">
          <p className="text-xs text-[#666660]">
            Une question sur votre livraison ou besoin de modifier l&apos;heure de passage ?
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Contacter la boutique sur WhatsApp</span>
          </a>
        </div>

        {/* 6. Pied de page & Sécurité des données */}
        <footer className="pt-2 pb-8 text-center text-xs text-[#888880] space-y-1.5">
          <p className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Vos données personnelles sont protégées. Seules les informations nécessaires à la livraison sont affichées.</span>
          </p>
          <p className="text-[11px] text-[#888880]/80">
            Propulsé par Novika Platform · Suivi étape par étape en direct
          </p>
        </footer>

      </div>
    </main>
  );
}
