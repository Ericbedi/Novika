"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  RotateCcw,
  Phone,
  MessageCircle,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Send,
  User,
  ArrowLeft,
  Search,
} from "lucide-react";
import { MOCK_FOLLOWUPS } from "@/mock-data/followups";
import { FollowupOrder } from "@/server/data/types";
import { formatFcfa } from "@/lib/money";
import { whatsappLink } from "@/lib/phone";
import { cn } from "@/lib/utils";

interface FollowupsClientProps {
  storeSlug: string;
}

export function FollowupsClient({ storeSlug }: FollowupsClientProps) {
  const [followups, setFollowups] = useState<FollowupOrder[]>(MOCK_FOLLOWUPS);
  const [filterReason, setFilterReason] = useState<"all" | "unreachable" | "callback" | "postponed_due">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modale WhatsApp Modèles
  const [selectedOrder, setSelectedOrder] = useState<FollowupOrder | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredFollowups = followups.filter((f) => {
    const matchReason = filterReason === "all" || f.followupReason === filterReason;
    const matchSearch =
      searchQuery === "" ||
      f.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.customerPhone.includes(searchQuery) ||
      f.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchReason && matchSearch;
  });

  const handleIncrementAttempt = (id: string) => {
    const nowStr = new Date().toLocaleDateString("fr-FR") + " à " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    setFollowups((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              attemptsCount: f.attemptsCount + 1,
              lastFollowupAt: nowStr,
            }
          : f
      )
    );
    showToast("Tentative de relance enregistrée (+1)");
  };

  const handleOpenWaModal = (order: FollowupOrder) => {
    setSelectedOrder(order);
    let defaultMsg = "";
    if (order.followupReason === "unreachable") {
      defaultMsg = `Bonjour ${order.customerName}, nous avons tenté de vous joindre sans succès concernant votre commande #${order.orderNumber} (${order.productName}). Quand seriez-vous disponible pour que notre livreur passe à ${order.city} ? Merci !`;
    } else if (order.followupReason === "callback") {
      defaultMsg = `Bonjour ${order.customerName}, comme convenu lors de notre dernier appel, nous vous recontactons pour finaliser votre commande #${order.orderNumber}. Êtes-vous prêt pour la livraison aujourd'hui ?`;
    } else {
      defaultMsg = `Bonjour ${order.customerName}, nous arrivons à la date convenue pour la livraison de votre commande #${order.orderNumber} d'un montant de ${formatFcfa(order.totalAmount)}. Le livreur peut-il se mettre en route vers ${order.city} ?`;
    }
    setSelectedTemplate(defaultMsg);
    setIsWaModalOpen(true);
  };

  const handleSendWa = () => {
    if (!selectedOrder) return;
    const url = whatsappLink(selectedOrder.customerPhone, selectedTemplate);
    window.open(url, "_blank");
    handleIncrementAttempt(selectedOrder.id);
    setIsWaModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#111111] text-[#FAF8F5] px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
              Récupération de Paniers & Relances
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            Commandes à Relancer
          </h1>
          <p className="text-xs text-[#666660] mt-0.5">
            Recontactez les clients injoignables, ceux ayant demandé à être rappelés et les reports arrivés à échéance.
          </p>
        </div>

        <Link
          href={`/app/${storeSlug}/commandes`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour aux commandes</span>
        </Link>
      </div>

      {/* Filtres & Recherche */}
      <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setFilterReason("all")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                filterReason === "all" ? "bg-[#111111] text-[#FAF8F5]" : "bg-white text-[#666660] border border-black/[0.06]"
              )}
            >
              Toutes ({followups.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterReason("unreachable")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                filterReason === "unreachable" ? "bg-orange-600 text-white" : "bg-white text-[#666660] border border-black/[0.06]"
              )}
            >
              Injoignables ({followups.filter((f) => f.followupReason === "unreachable").length})
            </button>
            <button
              type="button"
              onClick={() => setFilterReason("callback")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                filterReason === "callback" ? "bg-blue-600 text-white" : "bg-white text-[#666660] border border-black/[0.06]"
              )}
            >
              « Je vous reviens » ({followups.filter((f) => f.followupReason === "callback").length})
            </button>
            <button
              type="button"
              onClick={() => setFilterReason("postponed_due")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                filterReason === "postponed_due" ? "bg-purple-600 text-white" : "bg-white text-[#666660] border border-black/[0.06]"
              )}
            >
              Reportées dues ({followups.filter((f) => f.followupReason === "postponed_due").length})
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#888880]" />
            <input
              type="text"
              placeholder="Rechercher client, tél, commande..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Liste des cartes de relance */}
      <div className="space-y-3">
        {filteredFollowups.length === 0 ? (
          <div className="p-12 text-center rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] text-xs text-[#888880]">
            Aucune commande à relancer dans cette catégorie. Excellent travail de closing !
          </div>
        ) : (
          filteredFollowups.map((item) => (
            <div
              key={item.id}
              className="rounded-[22px] border border-black/[0.08] bg-[#FAF8F5] p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-black/[0.15] transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-black text-[#111111]">
                    {item.orderNumber}
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                      item.followupReason === "unreachable"
                        ? "bg-orange-100 text-orange-900"
                        : item.followupReason === "callback"
                        ? "bg-blue-100 text-blue-900"
                        : "bg-purple-100 text-purple-900"
                    )}
                  >
                    {item.followupReasonLabel}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/[0.05] text-[#111111]">
                    Tentative #{item.attemptsCount}
                  </span>
                </div>

                <div className="text-xs">
                  <span className="font-black text-sm text-[#111111]">{item.customerName}</span>
                  <span className="text-[#666660]"> ({item.customerPhone})</span>
                  <p className="text-[11px] text-[#888880]">
                    Ville : {item.city} • Montant : <strong className="text-[#111111]">{formatFcfa(item.totalAmount)}</strong>
                  </p>
                  <p className="text-[11px] font-medium text-[#111111] mt-0.5">
                    Produit : {item.productName}
                  </p>
                  {item.notes && (
                    <p className="text-[11px] text-[#666660] italic mt-1 bg-white p-2 rounded-xl border border-black/[0.05]">
                      Dernière note : « {item.notes} »
                    </p>
                  )}
                </div>

                <div className="text-[10px] text-[#888880] flex items-center gap-1.5 pt-1">
                  <Clock className="h-3 w-3" />
                  <span>Dernière relance : {item.lastFollowupAt}</span>
                  {item.scheduledDate && <span>• Date de report : {item.scheduledDate}</span>}
                </div>
              </div>

              {/* Actions de relance : WhatsApp, Appeler, Incrémenter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => handleOpenWaModal(item)}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>WhatsApp (Modèles)</span>
                </button>

                <a
                  href={`tel:${item.customerPhone}`}
                  className="px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] hover:bg-[#FAF8F5] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Appeler</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleIncrementAttempt(item.id)}
                  className="px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] hover:bg-[#FAF8F5] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Marquer une tentative supplémentaire"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>+1 Tentative</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODALE CHOIX DU MODÈLE WHATSAPP */}
      {isWaModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-black text-[#111111]">
                  Modèle WhatsApp pour {selectedOrder.customerName}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#888880]">
                {selectedOrder.customerPhone}
              </span>
            </div>

            {/* Sélecteur rapide de modèle */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-[#666660] uppercase">
                Changer de modèle pré-formaté :
              </label>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedTemplate(
                      `Bonjour ${selectedOrder.customerName}, nous avons tenté de vous joindre sans succès concernant votre commande #${selectedOrder.orderNumber} (${selectedOrder.productName}). Quand seriez-vous disponible pour que notre livreur passe à ${selectedOrder.city} ? Merci !`
                    )
                  }
                  className="p-2 rounded-xl border border-black/[0.08] bg-white hover:bg-black/[0.03] text-left font-bold"
                >
                  1. Injoignable
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedTemplate(
                      `Bonjour ${selectedOrder.customerName}, comme convenu lors de notre dernier appel, nous vous recontactons pour finaliser votre commande #${selectedOrder.orderNumber}. Êtes-vous prêt pour la livraison aujourd'hui ?`
                    )
                  }
                  className="p-2 rounded-xl border border-black/[0.08] bg-white hover:bg-black/[0.03] text-left font-bold"
                >
                  2. Rappel convenu
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedTemplate(
                      `Bonjour ${selectedOrder.customerName}, nous arrivons à la date convenue pour la livraison de votre commande #${selectedOrder.orderNumber} d'un montant de ${formatFcfa(selectedOrder.totalAmount)}. Le livreur peut-il se mettre en route vers ${selectedOrder.city} ?`
                    )
                  }
                  className="p-2 rounded-xl border border-black/[0.08] bg-white hover:bg-black/[0.03] text-left font-bold"
                >
                  3. Date report
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#666660] uppercase mb-1">
                Message à envoyer :
              </label>
              <textarea
                rows={4}
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => setIsWaModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSendWa}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Ouvrir WhatsApp & Enregistrer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
