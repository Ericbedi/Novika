"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Receipt as ReceiptIcon,
  Search,
  MessageCircle,
  Copy,
  ExternalLink,
  CheckCircle2,
  Clock,
  Eye,
  Settings,
  ChevronRight,
  Filter,
  Check,
  AlertCircle,
  Package,
  UserX,
  PhoneOff,
  ArrowRight,
  Sparkles,
  Info,
  X,
} from "lucide-react";
import { Receipt, ReceiptSettings, ReceiptStatus } from "@/server/data/receipt-types";
import {
  MOCK_RECEIPTS_DATA,
  MOCK_RECEIPT_SETTINGS,
  MOCK_MESSAGE_OPTOUTS,
} from "@/mock-data/receipts";
import {
  buildReceiptWhatsAppMessage,
  buildWaMeUrl,
  recordReceiptSent,
  DEFAULT_WHATSAPP_TEMPLATE,
} from "@/lib/receipts-engine";
import { formatFcfa } from "@/lib/money";
import { cn } from "@/lib/utils";

interface ReceiptsListClientProps {
  storeSlug: string;
}

export function ReceiptsListClient({ storeSlug }: ReceiptsListClientProps) {
  // Données locales modifiables pour l'interactivité
  const [receipts, setReceipts] = useState<Receipt[]>(MOCK_RECEIPTS_DATA);
  const [settings, setSettings] = useState<ReceiptSettings>(MOCK_RECEIPT_SETTINGS);
  const [optouts, setOptouts] = useState<string[]>(
    MOCK_MESSAGE_OPTOUTS.map((o) => o.phone.replace(/[^0-9]/g, ""))
  );

  // Filtres et recherche
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "to_send" | "sent" | "viewed" | "opted_out">("to_send");

  // État de la invite de retour (Confirmation après clic WhatsApp)
  const [pendingPromptReceipt, setPendingPromptReceipt] = useState<Receipt | null>(null);

  // État du modal Paramètres
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState<ReceiptSettings>(settings);

  // Toast temporaire
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Statistiques calculées en direct
  const stats = useMemo(() => {
    const toSend = receipts.filter((r) => r.status === "to_send").length;
    const sent = receipts.filter((r) => r.status === "sent" || r.status === "viewed").length;
    const viewed = receipts.filter((r) => r.status === "viewed").length;
    const optedOut = receipts.filter((r) => r.isOptedOut || optouts.includes(r.customerPhone.replace(/[^0-9]/g, ""))).length;
    return { toSend, sent, viewed, optedOut };
  }, [receipts, optouts]);

  // Filtrage des reçus
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      // Filtre statut
      const isClientOptedOut = r.isOptedOut || optouts.includes(r.customerPhone.replace(/[^0-9]/g, ""));
      if (statusFilter === "to_send" && (r.status !== "to_send" || isClientOptedOut)) return false;
      if (statusFilter === "sent" && r.status !== "sent") return false;
      if (statusFilter === "viewed" && r.status !== "viewed") return false;
      if (statusFilter === "opted_out" && !isClientOptedOut) return false;

      // Filtre recherche
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.customerFirstName.toLowerCase().includes(q);
        const matchesCity = r.customerCity.toLowerCase().includes(q);
        const matchesOrder = r.orderNumber.toLowerCase().includes(q);
        const matchesReceipt = r.receiptNumber.toLowerCase().includes(q);
        const matchesItem = r.items.some((it) => it.productName.toLowerCase().includes(q));
        if (!matchesName && !matchesCity && !matchesOrder && !matchesReceipt && !matchesItem) {
          return false;
        }
      }

      return true;
    });
  }, [receipts, statusFilter, searchQuery, optouts]);

  // Handler ouverture WhatsApp + Déclenchement de l'invite de confirmation
  const handleOpenWhatsApp = (receipt: Receipt) => {
    const isClientOptedOut = receipt.isOptedOut || optouts.includes(receipt.customerPhone.replace(/[^0-9]/g, ""));
    if (isClientOptedOut) {
      showToast("Ce client ne souhaite plus recevoir de messages.");
      return;
    }

    const message = buildReceiptWhatsAppMessage(
      receipt,
      DEFAULT_WHATSAPP_TEMPLATE,
      typeof window !== "undefined" ? window.location.origin : "https://afribuilder.com"
    );
    const waUrl = buildWaMeUrl(receipt.customerPhone, message);

    // Ouvre WhatsApp dans un nouvel onglet
    window.open(waUrl, "_blank", "noopener,noreferrer");

    // Affiche immédiatement l'invite au retour
    setPendingPromptReceipt(receipt);
  };

  // Handler confirmation d'envoi ("Oui / Non / Plus tard")
  const handleConfirmSent = (targetReceipt: Receipt, confirmed: boolean) => {
    if (confirmed) {
      const updated = recordReceiptSent(targetReceipt, "usr_01", "Aminata", "whatsapp_web");
      if (updated) {
        setReceipts((prev) => prev.map((r) => (r.id === targetReceipt.id ? updated : r)));
        showToast("Envoi du reçu enregistré avec succès !");
      }
    }
    setPendingPromptReceipt(null);
  };

  // Handler copie du message WhatsApp dans le presse-papier
  const handleCopyMessage = async (receipt: Receipt) => {
    const message = buildReceiptWhatsAppMessage(
      receipt,
      DEFAULT_WHATSAPP_TEMPLATE,
      typeof window !== "undefined" ? window.location.origin : "https://afribuilder.com"
    );
    await navigator.clipboard.writeText(message);
    showToast("Message WhatsApp copié dans le presse-papier !");
  };

  // Handler copie du lien public du reçu
  const handleCopyLink = async (receipt: Receipt) => {
    const url = `${typeof window !== "undefined" ? window.location.origin : "https://afribuilder.com"}/recu/${receipt.token}`;
    await navigator.clipboard.writeText(url);
    showToast("Lien direct du reçu copié !");
  };

  // Handler bascule Opt-out "Ne plus contacter"
  const handleToggleOptout = (receipt: Receipt) => {
    const phoneClean = receipt.customerPhone.replace(/[^0-9]/g, "");
    const currentlyOpted = optouts.includes(phoneClean) || receipt.isOptedOut;

    if (currentlyOpted) {
      setOptouts((prev) => prev.filter((p) => p !== phoneClean));
      setReceipts((prev) =>
        prev.map((r) =>
          r.customerPhone.replace(/[^0-9]/g, "") === phoneClean
            ? { ...r, isOptedOut: false, status: r.status === "opted_out" ? "to_send" : r.status }
            : r
        )
      );
      showToast("Opt-out désactivé : les envois WhatsApp sont réautorisés.");
    } else {
      setOptouts((prev) => [...prev, phoneClean]);
      setReceipts((prev) =>
        prev.map((r) =>
          r.customerPhone.replace(/[^0-9]/g, "") === phoneClean
            ? { ...r, isOptedOut: true, status: "opted_out" }
            : r
        )
      );
      showToast("Numéro ajouté à la liste « Ne plus contacter ». Envois WhatsApp bloqués.");
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast de notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111111] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Fil d'Ariane & En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#888880] mb-1">
            <Link href={`/app/${storeSlug}/commandes`} className="hover:text-[#111111]">
              Ventes
            </Link>
            <span>›</span>
            <span className="font-semibold text-[#111111]">Reçus à envoyer</span>
          </div>
          <h1 className="text-xl font-black text-[#111111] tracking-tight">
            Reçus de livraison
          </h1>
          <p className="text-xs text-[#666660]">
            Reçus créés automatiquement à la remise. L'envoi WhatsApp reste strictement manuel.
          </p>
        </div>

        <button
          onClick={() => {
            setTempSettings(settings);
            setIsSettingsOpen(true);
          }}
          id="btn-receipt-settings"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-black/10 hover:bg-[#FAF8F5] text-xs font-bold text-[#111111] shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Settings className="w-3.5 h-3.5 text-[#666660]" />
          <span>Paramètres des reçus</span>
        </button>
      </div>

      {/* Cartes de statistiques (Grille réactive AfriBuilder) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter("to_send")}
          className={cn(
            "p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs",
            statusFilter === "to_send"
              ? "border-amber-500 ring-2 ring-amber-500/10"
              : "border-black/[0.08] hover:border-black/20"
          )}
        >
          <div className="flex items-center justify-between text-xs text-[#666660]">
            <span className="font-bold">À envoyer</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p id="stat-to-send-count" className="text-2xl font-black text-[#111111] mt-2">
            {stats.toSend}
          </p>
          <p className="text-[11px] text-[#888880] mt-0.5">En attente d'envoi WhatsApp</p>
        </div>

        <div
          onClick={() => setStatusFilter("sent")}
          className={cn(
            "p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs",
            statusFilter === "sent"
              ? "border-blue-500 ring-2 ring-blue-500/10"
              : "border-black/[0.08] hover:border-black/20"
          )}
        >
          <div className="flex items-center justify-between text-xs text-[#666660]">
            <span className="font-bold">Envoyés</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-[#111111] mt-2">{stats.sent}</p>
          <p className="text-[11px] text-[#888880] mt-0.5">Déclarés envoyés par l'équipe</p>
        </div>

        <div
          onClick={() => setStatusFilter("viewed")}
          className={cn(
            "p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs",
            statusFilter === "viewed"
              ? "border-emerald-500 ring-2 ring-emerald-500/10"
              : "border-black/[0.08] hover:border-black/20"
          )}
        >
          <div className="flex items-center justify-between text-xs text-[#666660]">
            <span className="font-bold">Consultés</span>
            <Eye className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-[#111111] mt-2">{stats.viewed}</p>
          <p className="text-[11px] text-[#888880] mt-0.5">Ouverts par le client (sans IP)</p>
        </div>

        <div
          onClick={() => setStatusFilter("opted_out")}
          className={cn(
            "p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs",
            statusFilter === "opted_out"
              ? "border-rose-500 ring-2 ring-rose-500/10"
              : "border-black/[0.08] hover:border-black/20"
          )}
        >
          <div className="flex items-center justify-between text-xs text-[#666660]">
            <span className="font-bold">Ne plus contacter</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-[#111111] mt-2">{stats.optedOut}</p>
          <p className="text-[11px] text-[#888880] mt-0.5">Opt-out / Messages bloqués</p>
        </div>
      </div>

      {/* Barre de recherche et filtres de statuts */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
        {/* Filtres par onglets */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { key: "to_send", label: "À envoyer", count: stats.toSend },
              { key: "sent", label: "Envoyés", count: stats.sent },
              { key: "viewed", label: "Consultés", count: stats.viewed },
              { key: "opted_out", label: "Désabonnés", count: stats.optedOut },
              { key: "all", label: "Tous", count: receipts.length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5",
                statusFilter === tab.key
                  ? "bg-[#111111] text-[#FAF8F5]"
                  : "text-[#666660] hover:bg-[#FAF8F5] hover:text-[#111111]"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                  statusFilter === tab.key ? "bg-white/20 text-white" : "bg-black/5 text-[#666660]"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Champ de recherche */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#888880] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher client, commande, reçu..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-black/10 bg-[#FAF8F5] text-xs text-[#111111] placeholder:text-[#888880] focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
      </div>

      {/* Liste des cartes de reçus */}
      {filteredReceipts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-black/[0.08] space-y-3">
          <ReceiptIcon className="w-10 h-10 text-[#888880] mx-auto opacity-40" />
          <h3 className="text-sm font-bold text-[#111111]">Aucun reçu trouvé</h3>
          <p className="text-xs text-[#666660]">
            Aucun reçu ne correspond aux critères de filtre sélectionnés.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReceipts.map((receipt) => {
            const isClientOptedOut =
              receipt.isOptedOut ||
              optouts.includes(receipt.customerPhone.replace(/[^0-9]/g, ""));

            const isViewed = receipt.status === "viewed";
            const isSent = receipt.status === "sent";
            const isToSend = receipt.status === "to_send" && !isClientOptedOut;

            return (
              <div
                key={receipt.id}
                id={`receipt-card-${receipt.id}`}
                className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-2xs hover:border-black/20 transition-all space-y-4"
              >
                {/* En-tête de la carte */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#FAF8F5] text-[#111111] flex items-center justify-center font-bold text-xs border border-black/10">
                      <ReceiptIcon className="w-4 h-4 text-[#666660]" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-[#111111]">
                          {receipt.receiptNumber}
                        </span>
                        <span className="text-[10px] text-[#888880]">•</span>
                        <Link
                          href={`/app/${storeSlug}/commandes/${receipt.orderNumber}`}
                          className="font-mono text-xs font-bold text-blue-600 hover:underline"
                        >
                          {receipt.orderNumber}
                        </Link>
                        {receipt.scope === "single_item" && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Par produit
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-[#888880] mt-0.5">
                        Livrée le{" "}
                        {new Date(receipt.deliveredAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Statut du reçu */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {isClientOptedOut ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <UserX className="w-3.5 h-3.5" />
                        <span>Ne plus contacter</span>
                      </span>
                    ) : isViewed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Consulté ({receipt.viewsCount} fois)</span>
                      </span>
                    ) : isSent ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          Envoyé {receipt.sendLogs[0]?.sentBy ? `par ${receipt.sendLogs[0].sentBy}` : ""}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>À envoyer</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Corps : Destinataire & Produits */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Info Destinataire */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
                      Client livré
                    </span>
                    <p className="text-sm font-bold text-[#111111]">
                      {receipt.customerFirstName}
                    </p>
                    <p className="text-xs text-[#666660]">{receipt.customerCity}</p>
                    <p className="text-xs font-mono text-[#888880]">{receipt.customerPhone}</p>
                  </div>

                  {/* Articles inclus */}
                  <div className="md:col-span-2 space-y-2">
                    <span className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
                      Articles du reçu ({receipt.items.length})
                    </span>

                    <div className="space-y-1.5">
                      {receipt.items.map((item, idx) => (
                        <div
                          key={item.orderItemId || idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] text-xs"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="font-bold text-[#111111] shrink-0">
                              {item.quantity}×
                            </span>
                            <span className="truncate text-[#111111]">{item.productName}</span>
                            {item.variantName && (
                              <span className="text-[11px] text-[#666660] shrink-0">
                                ({item.variantName})
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-[#111111] shrink-0">
                            {formatFcfa(item.finalPrice)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-1 text-xs">
                      <span className="text-[#666660]">Total réglé :</span>
                      <span className="font-black text-sm text-emerald-800">
                        {formatFcfa(receipt.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Barre d'actions du reçu */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/[0.06]">
                  {/* Actions de lien / aperçu */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/recu/${receipt.token}`}
                      target="_blank"
                      id={`btn-view-receipt-${receipt.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 hover:bg-[#FAF8F5] text-xs font-bold text-[#111111] transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#666660]" />
                      <span>Aperçu du reçu</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleCopyMessage(receipt)}
                      id={`btn-copy-msg-${receipt.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 hover:bg-[#FAF8F5] text-xs font-bold text-[#111111] transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#666660]" />
                      <span>Copier message</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(receipt)}
                      id={`btn-copy-link-${receipt.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 hover:bg-[#FAF8F5] text-xs font-bold text-[#111111] transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#666660]" />
                      <span>Copier lien</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleOptout(receipt)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer",
                        isClientOptedOut
                          ? "text-emerald-700 hover:bg-emerald-50"
                          : "text-rose-600 hover:bg-rose-50"
                      )}
                    >
                      <PhoneOff className="w-3.5 h-3.5" />
                      <span>{isClientOptedOut ? "Réautoriser contact" : "Ne plus contacter"}</span>
                    </button>
                  </div>

                  {/* Bouton d'action principal : Envoyer sur WhatsApp */}
                  <div>
                    {isClientOptedOut ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 text-gray-400 text-xs font-bold cursor-not-allowed">
                        <UserX className="w-3.5 h-3.5" />
                        <span>Envois bloqués (Opt-out)</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsApp(receipt)}
                        id={`btn-send-whatsapp-${receipt.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4 fill-white" />
                        <span>Envoyer sur WhatsApp</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL INVITE AU RETOUR (APRÈS CLIC SUR WHATSAPP) */}
      {/* ======================================================== */}
      {pendingPromptReceipt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-black/10 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <MessageCircle className="w-5 h-5 fill-emerald-800" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111111]">
                    Confirmation d'envoi WhatsApp
                  </h3>
                  <p className="text-xs text-[#666660]">
                    {pendingPromptReceipt.customerFirstName} • {pendingPromptReceipt.orderNumber}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPendingPromptReceipt(null)}
                className="text-[#888880] hover:text-[#111111] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#111111] leading-relaxed">
              WhatsApp s'est ouvert dans un nouvel onglet. Avez-vous envoyé le reçu à{" "}
              <strong>{pendingPromptReceipt.customerFirstName}</strong> ?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => handleConfirmSent(pendingPromptReceipt, false)}
                className="px-3.5 py-2 rounded-xl border border-black/10 hover:bg-[#FAF8F5] text-xs font-bold text-[#666660] transition-colors cursor-pointer"
              >
                Non
              </button>

              <button
                type="button"
                onClick={() => setPendingPromptReceipt(null)}
                className="px-3.5 py-2 rounded-xl border border-black/10 hover:bg-[#FAF8F5] text-xs font-bold text-[#666660] transition-colors cursor-pointer"
              >
                Plus tard
              </button>

              <button
                type="button"
                id="btn-confirm-sent-yes"
                onClick={() => handleConfirmSent(pendingPromptReceipt, true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Oui, marquer comme envoyé</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL PARAMÈTRES DES REÇUS */}
      {/* ======================================================== */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-black/10 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#FAF8F5] flex items-center justify-center border border-black/10">
                  <Settings className="w-4 h-4 text-[#111111]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111111]">
                    Paramètres des reçus de livraison
                  </h3>
                  <p className="text-xs text-[#666660]">
                    Configuration globale de la boutique pour l'émission des reçus
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-[#888880] hover:text-[#111111] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode d'émission des reçus */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#111111]">
                Mode d'émission des reçus
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setTempSettings((prev) => ({ ...prev, mode: "per_order" }))}
                  className={cn(
                    "p-3.5 rounded-2xl border text-xs cursor-pointer transition-all space-y-1.5",
                    tempSettings.mode === "per_order"
                      ? "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600"
                      : "border-black/10 hover:border-black/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111111]">Un reçu par commande</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Recommandé
                    </span>
                  </div>
                  <p className="text-[11px] text-[#666660]">
                    Regroupe tous les articles livrés dans un seul reçu global avec sous-total et total.
                  </p>
                </label>

                <label
                  onClick={() => setTempSettings((prev) => ({ ...prev, mode: "per_product" }))}
                  className={cn(
                    "p-3.5 rounded-2xl border text-xs cursor-pointer transition-all space-y-1.5",
                    tempSettings.mode === "per_product"
                      ? "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600"
                      : "border-black/10 hover:border-black/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111111]">Un reçu par produit</span>
                  </div>
                  <p className="text-[11px] text-[#666660]">
                    Génère un reçu distinct pour chaque ligne, avec remise proportionnelle exacte.
                  </p>
                </label>
              </div>
            </div>

            {/* Mention légale personnalisable */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#111111]">
                Mention légale du reçu
              </label>
              <textarea
                rows={2}
                value={tempSettings.legalNotice}
                onChange={(e) =>
                  setTempSettings((prev) => ({ ...prev, legalNotice: e.target.value }))
                }
                className="w-full p-3 rounded-xl border border-black/10 text-xs text-[#111111] focus:outline-none focus:ring-1 focus:ring-black leading-relaxed"
              />
              <p className="text-[11px] text-[#888880]">
                Cette mention est imprimée au bas de chaque reçu public et PDF.
              </p>
            </div>

            {/* Avertissement API WhatsApp automatique désactivée */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Envoi WhatsApp strictement manuel</p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  L'API d'envoi automatique est désactivée par défaut. Vous gardez le contrôle direct de chaque message envoyé à vos clients via WhatsApp.
                </p>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.08]">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-xl border border-black/10 hover:bg-[#FAF8F5] text-xs font-bold text-[#666660] transition-colors cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                id="btn-save-receipt-settings"
                onClick={() => {
                  setSettings(tempSettings);
                  setIsSettingsOpen(false);
                  showToast("Paramètres des reçus enregistrés avec succès !");
                }}
                className="px-5 py-2 rounded-xl bg-[#111111] hover:bg-black text-[#FAF8F5] text-xs font-black transition-colors cursor-pointer shadow-xs"
              >
                Enregistrer les paramètres
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
