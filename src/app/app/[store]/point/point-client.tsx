"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Truck,
  Headphones,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Phone,
  MessageCircle,
  TrendingUp,
  Award,
  Clock,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  Send,
  Calendar,
  X,
  Target,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { CountryChip } from "@/components/app/bits";
import { formatMoney } from "@/lib/currencies";
import { useApp } from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";

interface PointClientProps {
  storeSlug: string;
}

interface RiderShift {
  id: string;
  name: string;
  phone: string;
  city: string;
  country: string;
  cashInHand: number; // En FCFA
  cashLimit: number; // Plafond configurable (ex: 300 000 FCFA)
  deliveredTodayCount: number;
  assignedStops: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    address: string;
    amountToCollect: number;
    status: "to_deliver" | "delivered" | "failed";
  }>;
}

interface CloserShift {
  id: string;
  name: string;
  phone: string;
  country: string;
  processedCount: number;
  confirmedCount: number;
  scheduledCount: number;
  deliveredCount: number;
  confirmationRate: number; // En %
  commissionPerDelivery: number; // ex: 500 FCFA
  currentCommissions: number;
  monthlyTarget: number; // ex: 150 commandes livrées
  monthlyDeliveries: number;
  targetTier1: { threshold: number; bonus: number };
  targetTier2: { threshold: number; bonus: number };
}

const INITIAL_RIDERS: RiderShift[] = [];

const INITIAL_CLOSERS: CloserShift[] = [];

export function PointClient({ storeSlug }: PointClientProps) {
  const { activeRole } = useApp();
  const [activeTab, setActiveTab] = useState<"riders" | "closers">("riders");

  const [riders, setRiders] = useState<RiderShift[]>(INITIAL_RIDERS);
  const [closers, setClosers] = useState<CloserShift[]>(INITIAL_CLOSERS);

  // Modal Reversement 2 Étapes
  const [remittanceModalRider, setRemittanceModalRider] = useState<RiderShift | null>(null);
  const [declaredRemittance, setDeclaredRemittance] = useState<number>(0);
  const [remittanceReason, setRemittanceReason] = useState("");

  // Modal Relance WhatsApp Closeuse
  const [whatsAppRecipient, setWhatsAppRecipient] = useState<{ name: string; phone: string; orderNumber: string } | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Traiter un reversement en 2 étapes
  const handleConfirmRemittance = () => {
    if (!remittanceModalRider) return;
    const theoretical = remittanceModalRider.cashInHand;
    const discrepancy = declaredRemittance - theoretical;

    setRiders((prev) =>
      prev.map((r) =>
        r.id === remittanceModalRider.id
          ? {
              ...r,
              cashInHand: Math.max(0, r.cashInHand - declaredRemittance),
            }
          : r
      )
    );

    setRemittanceModalRider(null);
    setRemittanceReason("");
    showToast(
      `Reversement de ${formatMoney(declaredRemittance, "XOF")} validé pour ${remittanceModalRider.name} (Écart : ${formatMoney(discrepancy, "XOF")}) !`
    );
  };

  // Marquer un arrêt livré
  const handleMarkStopDelivered = (riderId: string, stopId: string) => {
    setRiders((prev) =>
      prev.map((r) => {
        if (r.id !== riderId) return r;
        const stop = r.assignedStops.find((s) => s.id === stopId);
        if (!stop) return r;
        return {
          ...r,
          cashInHand: r.cashInHand + stop.amountToCollect,
          deliveredTodayCount: r.deliveredTodayCount + 1,
          assignedStops: r.assignedStops.map((s) =>
            s.id === stopId ? { ...s, status: "delivered" as const } : s
          ),
        };
      })
    );
    showToast("Colis marqué comme Livré et espèces ajoutées au solde livreur !");
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#111111] text-[#FAF8F5] px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* En-tête de la page */}
      <ScrollReveal delay={0}>
        <PageHeader
          title="Point d'Activité & Rémunérations"
          description="Contrôlez les liquidités en tournée, reversements espèces des livreurs, commissions et paliers de bonus des closeuses."
          actions={
            <div className="flex items-center gap-2">
              <DateRangePicker align="right" />
            </div>
          }
        />
      </ScrollReveal>

      {/* Barre d'Onglets Livreurs / Closeuses */}
      <ScrollReveal delay={50}>
        <div className="inline-flex rounded-xl border border-black/[0.08] bg-[#FAF8F5] p-1">
          <button
            type="button"
            onClick={() => setActiveTab("riders")}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeTab === "riders"
                ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                : "text-[#666660] hover:text-[#111111]"
            )}
          >
            <Truck className="h-4 w-4" />
            <span>Point Livreurs ({riders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("closers")}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeTab === "closers"
                ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                : "text-[#666660] hover:text-[#111111]"
            )}
          >
            <Headphones className="h-4 w-4" />
            <span>Point Closeuses ({closers.length})</span>
          </button>
        </div>
      </ScrollReveal>

      {/* ======================================================== */}
      {/* VUE 1 : POINT LIVREURS */}
      {/* ======================================================== */}
      {activeTab === "riders" && (
        <ScrollReveal delay={100} className="space-y-6">
          {riders.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-black/[0.08] space-y-2">
              <Truck className="h-8 w-8 text-[#888880] mx-auto opacity-40" />
              <p className="font-bold text-sm text-[#111111]">Aucun coursier en tournée actuellement</p>
              <p className="text-xs text-[#666660]">Les coursiers assignés et leurs encaissements s'afficheront ici lors des livraisons du jour.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {riders.map((r) => {
              const isOverLimit = r.cashInHand >= r.cashLimit;

              return (
                <div
                  key={r.id}
                  className={cn(
                    "rounded-3xl border p-5 bg-white shadow-2xs space-y-4 transition-all",
                    isOverLimit ? "border-rose-400 ring-2 ring-rose-200" : "border-black/[0.08]"
                  )}
                >
                  {/* Alerte si Plafond Dépassé */}
                  {isOverLimit && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-2.5 text-xs animate-pulse">
                      <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Alerte Sécurité : Plafond d'espèces dépassé !</p>
                        <p className="text-[11px] text-rose-800">
                          {r.name} détient {formatMoney(r.cashInHand, "XOF")} (plafond autorisé :{" "}
                          {formatMoney(r.cashLimit, "XOF")}). Les nouvelles livraisons sont suspendues jusqu'au reversement.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Header Livreur */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-[#FAF8F5] border border-black/[0.08] flex items-center justify-center font-bold text-[#111111]">
                        <Truck className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-base text-[#111111]">{r.name}</h3>
                        <p className="text-xs text-[#666660]">
                          {r.city} • <CountryChip code={r.country} />
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setRemittanceModalRider(r);
                        setDeclaredRemittance(r.cashInHand);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#111111] text-xs font-bold text-[#FAF8F5] hover:bg-black transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      <span>Faire le point</span>
                    </button>
                  </div>

                  {/* Compteur Cash en mains vs Plafond */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#FAF8F5] p-3 rounded-xl border border-black/[0.06]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#666660] block">
                        Cash en Mains Actuel
                      </span>
                      <span className={cn("text-xl font-black mt-0.5 block", isOverLimit ? "text-rose-600" : "text-[#111111]")}>
                        {formatMoney(r.cashInHand, "XOF")}
                      </span>
                    </div>

                    <div className="bg-[#FAF8F5] p-3 rounded-xl border border-black/[0.06]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#666660] block">
                        Plafond Autorisé
                      </span>
                      <span className="text-xl font-black text-[#111111] mt-0.5 block">
                        {formatMoney(r.cashLimit, "XOF")}
                      </span>
                    </div>
                  </div>

                  {/* Liste des Arrêts de Tournée */}
                  <div className="space-y-2 pt-2 border-t border-black/[0.06]">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#666660]">
                      Tournée du jour ({r.assignedStops.length} arrêts)
                    </span>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {r.assignedStops.map((stop) => (
                        <div
                          key={stop.id}
                          className="p-2.5 rounded-xl border border-black/[0.06] bg-[#FAF8F5]/50 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-[#111111] truncate">{stop.customerName}</p>
                            <p className="text-[11px] text-[#666660] truncate">{stop.address}</p>
                            <p className="text-[11px] font-black text-[#111111] mt-0.5">
                              {formatMoney(stop.amountToCollect, "XOF")}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={`tel:${stop.customerPhone}`}
                              className="p-2 rounded-lg bg-white border border-black/[0.08] hover:bg-[#FAF8F5] text-[#111111]"
                              title="Appeler le client"
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                            <a
                              href={`https://wa.me/${stop.customerPhone.replace(/\+/g, "")}?text=${encodeURIComponent(
                                `Bonjour ${stop.customerName}, c'est votre livreur pour votre commande ${stop.orderNumber}. Je suis en route vers vous !`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
                              title="WhatsApp direct"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                            {stop.status === "to_deliver" && (
                              <button
                                type="button"
                                onClick={() => handleMarkStopDelivered(r.id, stop.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#111111] text-[#FAF8F5] font-bold text-[10px]"
                              >
                                Livré
                              </button>
                            )}
                            {stop.status === "delivered" && (
                              <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                Livré ✓
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </ScrollReveal>
      )}

      {/* ======================================================== */}
      {/* VUE 2 : POINT CLOSEUSES & COMMISSIONS */}
      {/* ======================================================== */}
      {activeTab === "closers" && (
        <ScrollReveal delay={100} className="space-y-6">
          {closers.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-black/[0.08] space-y-2">
              <Headphones className="h-8 w-8 text-[#888880] mx-auto opacity-40" />
              <p className="font-bold text-sm text-[#111111]">Aucune closeuse active actuellement</p>
              <p className="text-xs text-[#666660]">Le suivi des appels, des confirmations et des commissions de votre équipe s'affichera ici.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {closers.map((c) => {
              const progressPct = Math.min(100, Math.round((c.monthlyDeliveries / c.monthlyTarget) * 100));

              return (
                <div
                  key={c.id}
                  className="rounded-3xl border border-black/[0.08] p-5 bg-white shadow-2xs space-y-4"
                >
                  {/* Header Closeuse */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center font-bold text-purple-900">
                        <Headphones className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-base text-[#111111]">{c.name}</h3>
                        <p className="text-xs text-[#666660]">
                          Closeuse Réseau • <CountryChip code={c.country} />
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {c.confirmationRate}% confirmées
                    </span>
                  </div>

                  {/* Indicateurs d'activité */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-[#FAF8F5] p-2 rounded-xl">
                      <span className="text-[10px] text-[#666660] block">Traitées</span>
                      <span className="font-black text-sm text-[#111111]">{c.processedCount}</span>
                    </div>
                    <div className="bg-[#FAF8F5] p-2 rounded-xl">
                      <span className="text-[10px] text-[#666660] block">Confirmées</span>
                      <span className="font-black text-sm text-blue-700">{c.confirmedCount}</span>
                    </div>
                    <div className="bg-[#FAF8F5] p-2 rounded-xl">
                      <span className="text-[10px] text-[#666660] block">Programmées</span>
                      <span className="font-black text-sm text-purple-700">{c.scheduledCount}</span>
                    </div>
                    <div className="bg-[#FAF8F5] p-2 rounded-xl">
                      <span className="text-[10px] text-[#666660] block">Livrées</span>
                      <span className="font-black text-sm text-emerald-700">{c.deliveredCount}</span>
                    </div>
                  </div>

                  {/* Commissions Cumulées en direct */}
                  <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-black/[0.06] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#666660] block">
                        Commissions Cumulées ({c.commissionPerDelivery} FCFA / colis livré)
                      </span>
                      <span className="text-2xl font-black text-emerald-700 mt-0.5 block">
                        {formatMoney(c.currentCommissions, "XOF")}
                      </span>
                    </div>
                    <Award className="h-8 w-8 text-amber-500" />
                  </div>

                  {/* Paliers d'Objectifs Mensuels & Bonus */}
                  <div className="space-y-2 pt-2 border-t border-black/[0.06]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#111111] flex items-center gap-1.5">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span>Objectif Mensuel : {c.monthlyTarget} livraisons</span>
                      </span>
                      <span className="font-black text-[#111111]">
                        {c.monthlyDeliveries} / {c.monthlyTarget} ({progressPct}%)
                      </span>
                    </div>

                    <div className="w-full bg-[#E5DEC9] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60">
                        <span className="text-[10px] font-bold text-amber-900 block">
                          Palier 1 ({c.targetTier1.threshold} livraisons)
                        </span>
                        <span className="font-black text-amber-950 block mt-0.5">
                          Bonus +{formatMoney(c.targetTier1.bonus, "XOF")}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/60">
                        <span className="text-[10px] font-bold text-purple-900 block">
                          Palier 2 ({c.targetTier2.threshold} livraisons)
                        </span>
                        <span className="font-black text-purple-950 block mt-0.5">
                          Bonus +{formatMoney(c.targetTier2.bonus, "XOF")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </ScrollReveal>
      )}

      {/* MODAL REVERSEMENT À 2 ÉTAPES */}
      {remittanceModalRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.08]">
              <div>
                <h3 className="font-black text-base text-[#111111]">
                  Point & Reversement : {remittanceModalRider.name}
                </h3>
                <p className="text-[11px] text-[#666660]">
                  Confirmation physique des espèces remises par le livreur.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRemittanceModalRider(null)}
                className="p-1 rounded-lg text-[#888880] hover:text-[#111111]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-white p-3 rounded-xl border border-black/[0.08] flex items-center justify-between">
                <span className="text-[#666660] font-bold">Espèces théoriques à reverser :</span>
                <span className="font-black text-[#111111] text-sm">
                  {formatMoney(remittanceModalRider.cashInHand, "XOF")}
                </span>
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  Montant physique remis en mains propres (FCFA) *
                </label>
                <input
                  type="number"
                  value={declaredRemittance}
                  onChange={(e) => setDeclaredRemittance(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white font-black text-sm text-[#111111]"
                />
              </div>

              {/* Écart calculé */}
              <div
                className={cn(
                  "p-3 rounded-xl border flex items-center justify-between font-bold",
                  declaredRemittance === remittanceModalRider.cashInHand
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                )}
              >
                <span>Écart (manquant ou surplus) :</span>
                <span>{formatMoney(declaredRemittance - remittanceModalRider.cashInHand, "XOF")}</span>
              </div>

              {declaredRemittance !== remittanceModalRider.cashInHand && (
                <div>
                  <label className="font-bold text-[#111111] block mb-1">
                    Motif obligatoire de l'écart *
                  </label>
                  <textarea
                    rows={2}
                    value={remittanceReason}
                    onChange={(e) => setRemittanceReason(e.target.value)}
                    placeholder="Ex: Monnaie gardée pour le plein de carburant, billet abîmé..."
                    className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111]"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.08]">
                <button
                  type="button"
                  onClick={() => setRemittanceModalRider(null)}
                  className="px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white font-bold text-[#111111]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemittance}
                  className="px-4 py-2 rounded-xl bg-[#111111] font-bold text-[#FAF8F5] hover:bg-black"
                >
                  Confirmer la réception des fonds
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
