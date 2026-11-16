"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Phone,
  MessageCircle,
  Search,
  Plus,
  X,
  Wallet,
  Building2,
  Bike,
  ShieldCheck,
  Check,
  RotateCcw,
} from "lucide-react";
import { Remittance, RemittanceStatus } from "@/server/data/types";
import { MOCK_REMITTANCES } from "@/mock-data/remittances";
import { formatFcfa } from "@/lib/money";
import { useApp } from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  RemittanceStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ElementType }
> = {
  pending: {
    label: "En attente de confirmation",
    bg: "bg-amber-50",
    text: "text-amber-900",
    border: "border-amber-200",
    icon: Clock,
  },
  confirmed: {
    label: "Validé & Confirmé",
    bg: "bg-emerald-50",
    text: "text-emerald-900",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  disputed: {
    label: "Écart constaté / Litige",
    bg: "bg-rose-50",
    text: "text-rose-900",
    border: "border-rose-200",
    icon: AlertTriangle,
  },
};

export function RemittancesClient({ storeSlug }: { storeSlug: string }) {
  const { activeRole } = useApp();
  const [remittances, setRemittances] = useState<Remittance[]>(MOCK_REMITTANCES);
  const [activeTab, setActiveTab] = useState<"all" | RemittanceStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRemittance, setSelectedRemittance] = useState<Remittance | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("wave");
  const [confirmationNotes, setConfirmationNotes] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // KPIs
  const kpis = useMemo(() => {
    let collected = 0;
    let fees = 0;
    let remitted = 0;
    let pending = 0;

    remittances.forEach((r) => {
      collected += r.collectedAmount;
      fees += r.deliveryFees;
      remitted += r.remittedAmount;
      if (r.status === "pending") {
        pending += r.collectedAmount - r.deliveryFees;
      }
    });

    return { collected, fees, remitted, pending };
  }, [remittances]);

  // Filtrage
  const filtered = useMemo(() => {
    return remittances.filter((r) => {
      if (activeTab !== "all" && r.status !== activeTab) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.reference.toLowerCase().includes(q) ||
          r.entityName.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q) ||
          r.phone.includes(q)
        );
      }
      return true;
    });
  }, [remittances, activeTab, searchQuery]);

  const handleOpenConfirm = (rem: Remittance) => {
    setSelectedRemittance(rem);
    setPaymentMethod("wave");
    setConfirmationNotes("");
    setIsConfirmModalOpen(true);
  };

  const handleConfirmRemittance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRemittance) return;

    setRemittances((prev) =>
      prev.map((r) =>
        r.id === selectedRemittance.id
          ? {
              ...r,
              status: "confirmed",
              confirmedBy: "Promises Bedi (Propriétaire)",
              confirmedAt: "Aujourd'hui à " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
              notes: confirmationNotes || `Paiement reçu via ${paymentMethod.toUpperCase()}`,
            }
          : r
      )
    );
    setIsConfirmModalOpen(false);
    showToast(`Reversement ${selectedRemittance.reference} validé avec succès !`);
  };

  return (
    <div className="space-y-6 pb-24">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#111111] text-[#FAF8F5] px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
              Finances & Réconciliation COD
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            Reversements des Espèces
          </h1>
          <p className="text-xs text-[#666660] mt-0.5">
            Suivi des cashs collectés par les coursiers et agences de livraison, déduction des courses et confirmation propriétaire.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/app/${storeSlug}/finances`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/[0.08] bg-[#FAF8F5] text-xs font-bold text-[#111111] hover:bg-black/5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour Finances</span>
          </Link>
          <Link
            href={`/app/${storeSlug}/livraisons`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111111] text-xs font-bold text-[#FAF8F5] hover:bg-black"
          >
            <Bike className="h-4 w-4" />
            <span>Tournées de livraison</span>
          </Link>
        </div>
      </div>

      {/* 4 Cartes KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-[22px] border border-black/[0.08] bg-[#FAF8F5] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
            Total Espèces Encaissées
          </span>
          <div className="mt-2 text-2xl font-black text-[#111111]">
            {formatFcfa(kpis.collected)}
          </div>
          <p className="text-[11px] text-[#666660] mt-1">
            Cash collecté auprès des clients à la livraison
          </p>
        </div>

        <div className="p-5 rounded-[22px] border border-black/[0.08] bg-[#FAF8F5] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
            Frais de Livraison Déduits
          </span>
          <div className="mt-2 text-2xl font-black text-[#111111]">
            {formatFcfa(kpis.fees)}
          </div>
          <p className="text-[11px] text-[#888880] mt-1">
            Forfaits retenus par les livreurs et agences
          </p>
        </div>

        <div className="p-5 rounded-[22px] border border-black/[0.08] bg-[#FAF8F5] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
            Net Reversé au Propriétaire
          </span>
          <div className="mt-2 text-2xl font-black text-emerald-800">
            {formatFcfa(kpis.remitted)}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            Fonds confirmés reçus sur comptes boutique
          </p>
        </div>

        <div className="p-5 rounded-[22px] border border-black/[0.08] bg-[#FAF8F5] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
            En Attente de Confirmation
          </span>
          <div className="mt-2 text-2xl font-black text-amber-900">
            {formatFcfa(kpis.pending)}
          </div>
          <p className="text-[11px] text-amber-800 mt-1">
            Courses en cours ou dépôts à valider
          </p>
        </div>
      </div>

      {/* Barre de Recherche et Onglets de Statut */}
      <div className="rounded-[22px] border border-black/[0.08] bg-[#FAF8F5] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === "all" ? "bg-[#111111] text-[#FAF8F5]" : "bg-white text-[#666660] border border-black/[0.06]"
              )}
            >
              Tous ({remittances.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === "pending" ? "bg-amber-600 text-white" : "bg-white text-[#666660] border border-black/[0.06]"
              )}
            >
              En attente ({remittances.filter((r) => r.status === "pending").length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("confirmed")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === "confirmed" ? "bg-emerald-600 text-white" : "bg-white text-[#666660] border border-black/[0.06]"
              )}
            >
              Confirmés ({remittances.filter((r) => r.status === "confirmed").length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("disputed")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === "disputed" ? "bg-rose-600 text-white" : "bg-white text-[#666660] border border-black/[0.06]"
              )}
            >
              Litiges & Écarts ({remittances.filter((r) => r.status === "disputed").length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#888880]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par réf, agence, livreur..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tableau des Reversements */}
      <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/[0.08] bg-black/[0.02] text-[11px] font-bold text-[#666660] uppercase">
                <th className="py-3 px-4">Référence</th>
                <th className="py-3 px-4">Livreur / Agence</th>
                <th className="py-3 px-4">Colis</th>
                <th className="py-3 px-4">Espèces Encaissées</th>
                <th className="py-3 px-4">Frais Courses</th>
                <th className="py-3 px-4">Montant Remis</th>
                <th className="py-3 px-4">Écart</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Action Propriétaire</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06] bg-white">
              {filtered.map((rem) => {
                const conf = STATUS_CONFIG[rem.status];
                const StatusIcon = conf.icon;
                return (
                  <tr key={rem.id} className="hover:bg-black/[0.015] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-[#111111]">
                      {rem.reference}
                      <span className="block font-normal text-[10px] text-[#888880]">
                        {rem.date}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {rem.entityType === "agency" ? (
                          <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xs">
                            <Building2 className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
                            <Bike className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-[#111111]">{rem.entityName}</p>
                          <p className="text-[10px] text-[#888880]">
                            {rem.city} ({rem.country}) • {rem.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#111111]">
                      {rem.ordersCount} colis
                    </td>
                    <td className="py-3.5 px-4 font-black text-[#111111]">
                      {formatFcfa(rem.collectedAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-[#888880]">
                      -{formatFcfa(rem.deliveryFees)}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-800">
                      {formatFcfa(rem.remittedAmount)}
                    </td>
                    <td className="py-3.5 px-4">
                      {rem.discrepancy > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                          +{formatFcfa(rem.discrepancy)} écart
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-700">0 FCFA</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border",
                          conf.bg,
                          conf.text,
                          conf.border
                        )}
                      >
                        <StatusIcon className="h-3 w-3" />
                        <span>{conf.label}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {rem.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() => handleOpenConfirm(rem)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-2xs cursor-pointer"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Confirmer réception</span>
                        </button>
                      ) : rem.status === "disputed" ? (
                        <button
                          type="button"
                          onClick={() => handleOpenConfirm(rem)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Régulariser</span>
                        </button>
                      ) : (
                        <div className="text-[10px] text-[#666660]">
                          <span className="font-semibold text-emerald-800 block">Validé</span>
                          <span className="text-[9px] text-[#888880]">{rem.confirmedAt}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALE DE CONFIRMATION DE REVERSEMENT */}
      {isConfirmModalOpen && selectedRemittance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-black text-[#111111]">
                  Confirmer le reversement {selectedRemittance.reference}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="text-[#888880] hover:text-[#111111]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-black/[0.08] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#666660]">Entité :</span>
                <strong className="text-[#111111]">{selectedRemittance.entityName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666660]">Espèces collectées :</span>
                <strong className="text-[#111111]">{formatFcfa(selectedRemittance.collectedAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666660]">Frais de courses :</span>
                <span className="text-rose-700 font-semibold">-{formatFcfa(selectedRemittance.deliveryFees)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-black/[0.06] text-sm">
                <span className="font-bold text-[#111111]">Montant net à recevoir :</span>
                <strong className="font-black text-emerald-800">{formatFcfa(selectedRemittance.remittedAmount)}</strong>
              </div>
            </div>

            <form onSubmit={handleConfirmRemittance} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  Moyen de paiement reçu *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                >
                  <option value="wave">Wave Mobile Money</option>
                  <option value="tmoney">T-Money (Togo)</option>
                  <option value="moov">Moov Money (Flooz)</option>
                  <option value="orange">Orange Money</option>
                  <option value="mtn">MTN Mobile Money</option>
                  <option value="cash">Remise d'espèces physiques en main propre</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  Notes ou référence de transaction
                </label>
                <input
                  type="text"
                  value={confirmationNotes}
                  onChange={(e) => setConfirmationNotes(e.target.value)}
                  placeholder="Ex: Réf Wave #982347 ou Reçu signé"
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black"
                >
                  Valider l'encaissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
