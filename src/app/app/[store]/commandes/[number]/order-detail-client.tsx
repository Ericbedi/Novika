"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Edit2,
  FileText,
  MapPin,
  MessageCircle,
  Phone,
  Radio,
  Share2,
  Trash2,
  Truck,
  User,
  Users,
  AlertTriangle,
  X,
  Camera,
  KeyRound,
  ShieldCheck,
  Copy,
  ExternalLink,
  Navigation,
  Receipt as ReceiptIcon,
  RefreshCw,
  Printer,
  Eye,
} from "lucide-react";
import { Order, OrderStatus, ORDER_STATUSES, ORDER_STATUS_LABELS, StatusHistoryEntry } from "@/server/data/types";
import { MOCK_ORDERS } from "@/mock-data/orders";
import { MOCK_RIDERS } from "@/mock-data/deliveries";
import { MOCK_TRACKING_TOKENS, MOCK_MESSAGE_TEMPLATES } from "@/mock-data/vague1-data";
import { MOCK_RECEIPTS_DATA } from "@/mock-data/receipts";
import {
  buildReceiptWhatsAppMessage,
  buildWaMeUrl,
  recordReceiptSent,
  DEFAULT_WHATSAPP_TEMPLATE,
} from "@/lib/receipts-engine";
import { Receipt } from "@/server/data/receipt-types";
import { StatusBadge } from "@/components/app/status-badge";
import { Money } from "@/components/app/money";
import { CountryChip, CountryFlagSvg, InitialsAvatar, ProductThumb } from "@/components/app/bits";
import { PhoneActions } from "@/components/app/phone-actions";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { useApp } from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";
import {
  reserveStockForOrder,
  fulfillDeliveredOrderStock,
  releaseReservedStock,
  generatePendingStockWhatsAppUrl,
} from "@/lib/stock-settings-store";
import { notificationSound } from "@/lib/notification-sound";
import { persistOrderStatus } from "@/lib/orders-api";

interface OrderDetailClientProps {
  storeSlug: string;
  orderNumber: string;
  initialOrder?: Order;
}

export function OrderDetailClient({ storeSlug, orderNumber, initialOrder: providedOrder }: OrderDetailClientProps) {
  const router = useRouter();
  const { activeRole } = useApp();

  const initialOrder =
    providedOrder || MOCK_ORDERS.find((o) => o.orderNumber === orderNumber) || MOCK_ORDERS[0];

  const [order, setOrder] = useState<Order>(initialOrder);
  const [internalNotes, setInternalNotes] = useState(
    order.notes || "Client joignable de préférence l'après-midi. Confirmer par message WhatsApp avant le départ du livreur."
  );
  const [history, setHistory] = useState<StatusHistoryEntry[]>(
    order.history || [
      {
        status: "pending",
        changedAt: "15/11/2026 à 10:42",
        changedBy: "Système (Vitrine en ligne)",
        reason: "Formulaire COD validé",
      },
    ]
  );

  // Modales d'état
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState<OrderStatus>(order.status);
  const [statusReason, setStatusReason] = useState("");
  const [scheduledDateInput, setScheduledDateInput] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingStockAlertOpen, setPendingStockAlertOpen] = useState(false);

  // K2 : Preuve de livraison
  const [deliveryProofType, setDeliveryProofType] = useState<"code" | "photo" | "none">("code");
  const [enteredCode, setEnteredCode] = useState("");
  const [codeAttempts, setCodeAttempts] = useState(0);
  const [isCodeLocked, setIsCodeLocked] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [riderGeoConsent, setRiderGeoConsent] = useState(false);
  const [isFailureMode, setIsFailureMode] = useState(false);
  const [failureReason, setFailureReason] = useState("Client absent au rendez-vous");

  const validOtpCode = "4821"; // Code de confirmation sécurisé envoyé au client

  // Reçu de livraison dédié
  const initialReceipt =
    MOCK_RECEIPTS_DATA.find(
      (r) => r.orderId === order.id || r.orderNumber === order.orderNumber
    ) || null;
  const [receipt, setReceipt] = useState<Receipt | null>(initialReceipt);
  const [isResendModalOpen, setIsResendModalOpen] = useState(false);
  const [resendReason, setResendReason] = useState("Client demande un nouvel envoi");

  const handleResendReceipt = () => {
    if (!receipt) return;
    if ((receipt.resendCount || 0) >= 3) {
      setToastMessage("Limite maximale de 3 renvois atteinte.");
      setIsResendModalOpen(false);
      return;
    }

    const updatedReceipt = recordReceiptSent(
      receipt,
      activeRole === "closer" ? "cls_01" : "admin_01",
      activeRole === "closer" ? (order.assignedCloser?.name || "Closeuse") : "Admin",
      "whatsapp_web",
      resendReason
    );

    setReceipt(updatedReceipt);
    setIsResendModalOpen(false);

    // Ouvrir WhatsApp avec message
    const msg = buildReceiptWhatsAppMessage(
      updatedReceipt,
      DEFAULT_WHATSAPP_TEMPLATE,
      typeof window !== "undefined" ? window.location.origin : "https://afribuilder.com"
    );
    const waUrl = buildWaMeUrl(receipt.customerPhone, msg);
    window.open(waUrl, "_blank", "noopener,noreferrer");

    setToastMessage(`Reçu renvoyé (${updatedReceipt.resendCount}/3) !`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Récupération du jeton de suivi sécurisé
  const trackingRecord =
    MOCK_TRACKING_TOKENS.find((t) => t.orderId === order.id || t.orderNumber === order.orderNumber) ||
    MOCK_TRACKING_TOKENS[0];
  const trackingUrl = typeof window !== "undefined"
    ? `${window.location.origin}/suivi/${trackingRecord.rawToken}`
    : `http://localhost:3000/suivi/${trackingRecord.rawToken}`;

  // Message WhatsApp formaté selon le modèle Prompt 05-T :
  // « Bonjour {prénom}, votre commande {numéro} est {statut}. Suivez-la ici : {lien} »
  const customerFirstName = order.customerName.split(" ")[0] || "Client";
  const orderStatusLabel = ORDER_STATUS_LABELS[order.status] || order.status;
  const interpolatedMessage = `Bonjour ${customerFirstName}, votre commande ${order.orderNumber} est ${orderStatusLabel}. Suivez-la ici : ${trackingUrl}`;

  const handleCopyTrackingMessage = () => {
    navigator.clipboard.writeText(interpolatedMessage);
    showToast("Message de suivi WhatsApp copié dans le presse-papier !");
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();

    // Règle métier stricte : une closeuse ne peut jamais marquer Livrée
    if (activeRole === "closer" && selectedNewStatus === "delivered") {
      alert("Action refusée (RLS) : Une closeuse ne peut jamais marquer une commande comme Livrée. Seul le livreur ou l'administrateur peut le faire après encaissement des espèces.");
      return;
    }

    // K2. Vérification de la preuve de livraison
    if (selectedNewStatus === "delivered") {
      if (deliveryProofType === "code") {
        if (isCodeLocked) {
          alert("Erreur : Le code de confirmation est temporairement verrouillé suite à 3 tentatives infructueuses. Veuillez contacter le support ou déclarer un échec.");
          return;
        }
        if (enteredCode.trim() !== validOtpCode) {
          const nextAttempts = codeAttempts + 1;
          setCodeAttempts(nextAttempts);
          if (nextAttempts >= 3) {
            setIsCodeLocked(true);
            alert("Code incorrect ! Vous avez dépassé les 3 tentatives autorisées. Le code est verrouillé pour 15 minutes.");
          } else {
            alert(`Code de confirmation incorrect (Tentative ${nextAttempts}/3). Le code à 4 chiffres a été envoyé par SMS/WhatsApp au client.`);
          }
          return;
        }
      } else if (deliveryProofType === "photo") {
        if (!photoUploaded) {
          alert("Erreur : La photo de remise du colis est obligatoire pour valider la livraison.");
          return;
        }
      }
    }

    // Validation stricte du prompt
    if ((selectedNewStatus === "rejected" || selectedNewStatus === "cancelled") && !statusReason.trim()) {
      alert("Le motif est obligatoire pour un statut Rejetée ou Annulée.");
      return;
    }

    if ((selectedNewStatus === "scheduled" || selectedNewStatus === "postponed") && !scheduledDateInput.trim()) {
      alert("La date de programmation / report est obligatoire.");
      return;
    }

    const changedByName =
      activeRole === "closer"
        ? "Closeuse en charge"
        : activeRole === "rider"
          ? "Livreur en tournée"
          : activeRole === "agency"
            ? "Agence de livraison"
            : "Administrateur";

    let reasonText = statusReason;
    if (selectedNewStatus === "delivered") {
      reasonText = `Preuve validée (${deliveryProofType === "code" ? "Code OTP client " + enteredCode : deliveryProofType === "photo" ? "Photo prise" : "Sans preuve"}) - Espèces encaissées`;
      if (riderGeoConsent) {
        reasonText += " (Géoloc vérifiée avec accord)";
      }
    } else if (selectedNewStatus === "scheduled" || selectedNewStatus === "postponed") {
      reasonText = `Programmée pour : ${scheduledDateInput}`;
    }

    // Enregistrement en base : en cas d'échec, rien ne change à l'écran
    const persistErr = await persistOrderStatus(
      storeSlug,
      order.orderNumber,
      selectedNewStatus,
      reasonText || undefined
    );
    if (persistErr) {
      showToast(persistErr);
      return;
    }

    // Gestion de la réservation de stock (Prompt 16-b)
    const targetProdId = order.items?.[0]?.productId || order.items?.[0]?.id || "prod_1";
    const qty = order.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 1;

    if (selectedNewStatus === "confirmed") {
      const stockRes = reserveStockForOrder({
        storeSlug,
        productId: targetProdId,
        quantity: qty,
        orderNumber: order.orderNumber,
        isCloserConfirmation: true,
      });

      if (!stockRes.success && stockRes.orderStatus === "pending_stock") {
        notificationSound.playOrderSound(); // Alerte sonore pour la closeuse
        setOrder((prev) => ({
          ...prev,
          status: "pending_stock",
          updatedAt: "À l'instant",
        }));
        const pendingEntry: StatusHistoryEntry = {
          status: "pending_stock",
          changedAt: "À l'instant",
          changedBy: changedByName,
          reason: "Stock insuffisant : confirmation closeuse refusée. Commande passée en attente de stock prioritaire.",
        };
        setHistory((prev) => [pendingEntry, ...prev]);
        setIsStatusModalOpen(false);
        setPendingStockAlertOpen(true);
        showToast("Stock insuffisant : commande basculée en attente de stock !");
        return;
      }
    } else if (selectedNewStatus === "delivered") {
      fulfillDeliveredOrderStock({
        storeSlug,
        productId: targetProdId,
        quantity: qty,
        orderNumber: order.orderNumber,
      });
    } else if (selectedNewStatus === "cancelled" || selectedNewStatus === "rejected") {
      releaseReservedStock({
        storeSlug,
        productId: targetProdId,
        quantity: qty,
        orderNumber: order.orderNumber,
        reason: reasonText,
      });
    }

    setOrder((prev) => ({
      ...prev,
      status: selectedNewStatus,
      scheduledDate: selectedNewStatus === "scheduled" || selectedNewStatus === "postponed" ? scheduledDateInput : prev.scheduledDate,
      updatedAt: "À l'instant",
    }));

    const newEntry: StatusHistoryEntry = {
      status: selectedNewStatus,
      changedAt: "À l'instant",
      changedBy: changedByName,
      reason: reasonText,
    };

    setHistory((prev) => [newEntry, ...prev]);
    setIsStatusModalOpen(false);
    showToast(`Statut mis à jour : ${ORDER_STATUS_LABELS[selectedNewStatus]}`);
  };

  const handleAssignCloser = (closerId: string, closerName: string) => {
    setOrder((prev) => ({
      ...prev,
      assignedCloser: { id: closerId, name: closerName },
    }));
    showToast(`Closeuse assignée : ${closerName}`);
  };

  const handleAssignRider = (riderId: string, riderName: string, riderPhone: string) => {
    setOrder((prev) => ({
      ...prev,
      assignedRider: { id: riderId, name: riderName, phone: riderPhone },
    }));
    showToast(`Livreur assigné : ${riderName}`);
  };

  const handleDeleteOrder = () => {
    showToast("Commande supprimée avec succès.");
    setTimeout(() => {
      router.push(`/app/${storeSlug}/commandes`);
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#111111] text-[#FAF8F5] px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Barre supérieure : Bouton retour & Actions de commande */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/app/${storeSlug}/commandes`}
            className="p-2 rounded-xl border border-black/[0.08] bg-[#FAF8F5] text-[#111111] hover:bg-white transition-all shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-[#111111]">
                Commande #{order.orderNumber}
              </h1>
              <StatusBadge status={order.status} size="md" />
            </div>
            <p className="text-xs text-[#666660] mt-0.5">
              Reçue le {order.createdAt} · Dernière modification : {order.updatedAt}
            </p>
          </div>
        </div>

        {/* Boutons d'action droite */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="order-send-tracking-btn"
            aria-label="Lien de suivi client"
            onClick={() => setIsTrackingModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 transition-all shadow-2xs cursor-pointer"
          >
            <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
            <span>Lien de suivi client</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedNewStatus(order.status);
              setStatusReason("");
              setScheduledDateInput("");
              setIsFailureMode(false);
              setIsStatusModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-2xs cursor-pointer"
          >
            Changer le statut
          </button>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
            title="Supprimer la commande"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bannière Commande en attente de stock (Prompt 16-b) */}
      {order.status === "pending_stock" && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-900">
                Commande en attente de stock prioritaire
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Le stock disponible était insuffisant au moment de la confirmation. Vous pouvez contacter le client sur WhatsApp en 1 clic pour lui proposer une alternative ou maintenir sa commande prioritaire.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={generatePendingStockWhatsAppUrl({
                customerPhone: order.customerPhone,
                customerName: order.customerName,
                orderNumber: order.orderNumber,
                productName: order.items?.[0]?.productName || (order.items?.[0] as any)?.name || "votre produit",
                storeName: "Novika",
              })}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="btn-whatsapp-pending-stock"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-black shadow-xs transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp client en 1 clic</span>
            </a>
            <Link
              href={`/app/${storeSlug}/produits/achats`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-black/[0.1] text-xs font-bold text-[#111111] hover:bg-[#FAF8F5]"
            >
              Alerte réappro
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne Gauche (8 cols) : Produits, Finances & Historique */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Lignes de commande & Total à encaisser */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider">
              Articles commandés ({order.items.length})
            </h3>

            <div className="divide-y divide-black/[0.06]">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <ProductThumb src={item.image} alt={item.productName} size={48} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111111] truncate">{item.productName}</p>
                      {item.variant && (
                        <p className="text-[11px] text-[#666660]">Variante : {item.variant}</p>
                      )}
                      <p className="text-[11px] text-[#888880]">
                        Prix unitaire : <Money value={item.unitPrice} /> × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-[#111111]">
                      <Money value={item.totalPrice} />
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Récapitulatif financier COD */}
            <div className="pt-3 border-t border-black/[0.08] space-y-2 text-xs">
              <div className="flex justify-between text-[#666660]">
                <span>Sous-total articles</span>
                <span className="font-semibold text-[#111111]"><Money value={order.subtotal} /></span>
              </div>
              <div className="flex justify-between text-[#666660]">
                <span>Frais de livraison facturés au client</span>
                <span className="font-semibold text-[#111111]"><Money value={order.shippingFee} /></span>
              </div>
              <div className="flex justify-between pt-2 border-t border-black/[0.06] text-sm font-black text-[#111111]">
                <span>TOTAL À ENCAISSER (COD)</span>
                <span className="text-base text-[#111111]"><Money value={order.totalAmount} /></span>
              </div>
            </div>
          </div>

          {/* 2. Historique des statuts horodaté (Audit Trail) */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#666660]" />
                Historique des statuts horodaté
              </h3>
              <span className="text-[11px] text-[#666660]">{history.length} entrées</span>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-black/[0.08]">
              {history.map((entry, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-[#FAF8F5] bg-[#111111]" />
                  <div className="bg-white border border-black/[0.06] rounded-xl p-3 shadow-2xs text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={entry.status} size="sm" />
                      <span className="text-[11px] text-[#888880] tabular-nums">{entry.changedAt}</span>
                    </div>
                    <p className="font-semibold text-[#111111]">Par : {entry.changedBy}</p>
                    {entry.reason && (
                      <p className="text-[11px] text-[#666660] italic">Motif / Note : « {entry.reason} »</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Notes internes */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#666660]" />
                Notes Internes de Closing
              </h3>
              <span className="text-[11px] text-[#888880]">Visible uniquement par l'équipe</span>
            </div>
            <textarea
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Ajouter une consigne pour le livreur ou un retour de closing..."
              className="w-full p-3 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-black/[0.12]"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => showToast("Notes internes enregistrées avec succès")}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-black/[0.08] text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] transition-all cursor-pointer shadow-2xs"
              >
                Enregistrer la note
              </button>
            </div>
          </div>
        </div>

        {/* Colonne Droite (4 cols) : Client, Assignation, UTM */}
        <div className="lg:col-span-4 space-y-6">
          {/* A. Fiche Client */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4 text-[#666660]" />
              Client & Contact
            </h3>

            <div className="flex items-center gap-3">
              <InitialsAvatar name={order.customerName} size="md" />
              <div>
                <p className="font-bold text-sm text-[#111111]">{order.customerName}</p>
                <p className="font-mono text-xs text-[#666660]">{order.customerPhone}</p>
              </div>
            </div>

            {/* Actions d'appel et WhatsApp direct */}
            <div className="pt-2 border-t border-black/[0.06]">
              <PhoneActions
                phoneE164={order.customerPhone}
                name={order.customerName}
                orderNumber={order.orderNumber}
                size="lg"
                className="w-full flex"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-black/[0.06] text-xs">
              <div>
                <p className="text-[10px] font-bold text-[#666660] uppercase">Pays & Ville</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <CountryChip code={order.country} />
                  <span className="font-semibold text-[#111111]">{order.city}</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-[#666660] uppercase">Adresse de livraison</p>
                <p className="text-xs text-[#111111] font-medium mt-0.5 leading-relaxed bg-white p-2.5 rounded-xl border border-black/[0.06]">
                  <MapPin className="h-3.5 w-3.5 inline mr-1 text-[#666660]" />
                  {order.deliveryAddress}
                </p>
              </div>
            </div>
          </div>

          {/* B. Assignation de l'équipe (Closeuse & Livreur) */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-[#666660]" />
                Assignation Équipe
              </h3>
              {(activeRole === "closer" || activeRole === "rider") && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Lecture seule (RLS)
                </span>
              )}
              {activeRole === "agency" && (
                <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                  Livreurs agence
                </span>
              )}
            </div>

            {/* Select Closeuse */}
            <div>
              <label className="block text-[11px] font-bold text-[#666660] uppercase mb-1">
                Closeuse responsable
              </label>
              {activeRole === "closer" || activeRole === "rider" || activeRole === "agency" ? (
                <div className="p-2.5 text-xs rounded-xl border border-black/[0.08] bg-black/[0.03] text-[#333333] font-medium flex items-center justify-between">
                  <span>{order.assignedCloser?.name || "Non assignée"}</span>
                  <span className="text-[10px] text-[#888880] italic">
                    {activeRole === "agency" ? "Assigné par propriétaire" : "Verrouillé"}
                  </span>
                </div>
              ) : (
                <select
                  value={order.assignedCloser?.id || ""}
                  onChange={(e) => {
                    const name = e.target.options[e.target.selectedIndex].text;
                    handleAssignCloser(e.target.value, name);
                  }}
                  className="w-full p-2.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                >
                  <option value="">Sélectionner une closeuse</option>
                  <option value="cls_01">Aïcha Diallo</option>
                  <option value="cls_02">Esther Lawson</option>
                  <option value="cls_03">Mariam Coulibaly</option>
                </select>
              )}
            </div>

            {/* Select Livreur */}
            <div>
              <label className="block text-[11px] font-bold text-[#666660] uppercase mb-1">
                Livreur assigné
              </label>
              {activeRole === "closer" || activeRole === "rider" ? (
                <div className="p-2.5 text-xs rounded-xl border border-black/[0.08] bg-black/[0.03] text-[#333333] font-medium flex items-center justify-between">
                  <span>{order.assignedRider?.name || "Non assigné"}</span>
                  <span className="text-[10px] text-[#888880] italic">Verrouillé</span>
                </div>
              ) : (
                <select
                  value={order.assignedRider?.id || ""}
                  onChange={(e) => {
                    const name = e.target.options[e.target.selectedIndex].text;
                    handleAssignRider(e.target.value, name, "+22890556677");
                  }}
                  className="w-full p-2.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                >
                  <option value="">Sélectionner un livreur</option>
                  {MOCK_RIDERS.length > 0 ? (
                    MOCK_RIDERS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.city})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Aucun livreur disponible</option>
                  )}
                </select>
              )}
            </div>
          </div>

          {/* C. Infos Campagne (UTM) */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2">
              <Share2 className="h-4 w-4 text-[#666660]" />
              Traçabilité Campagne (UTM)
            </h3>
            {activeRole === "closer" || activeRole === "rider" ? (
              <div className="p-3 rounded-xl bg-black/[0.02] border border-black/[0.06] text-center space-y-1">
                <p className="text-xs font-bold text-[#666660]">Données UTM masquées</p>
                <p className="text-[10px] text-[#888880]">
                  Politique RLS : Les coûts et paramètres de tracking marketing sont réservés aux administrateurs.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-black/[0.05]">
                  <span className="text-[#666660]">Source pub</span>
                  <span className="font-bold text-[#111111] capitalize">{order.utm?.source || "Direct / WhatsApp"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-black/[0.05]">
                  <span className="text-[#666660]">Campagne</span>
                  <span className="font-mono text-[#111111] truncate max-w-[160px]">{order.utm?.campaign || "campagne_organique"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#666660]">Support (Medium)</span>
                  <span className="font-medium text-[#111111]">{order.utm?.medium || "cpc"}</span>
                </div>
              </div>
            )}
          </div>

          {/* D. Reçu de livraison (REC-...) */}
          <div
            id="order-receipt-card"
            className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2">
                <ReceiptIcon className="h-4 w-4 text-[#666660]" />
                Reçu de livraison
              </h3>

              {receipt ? (
                receipt.status === "viewed" ? (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Consulté ({receipt.viewsCount})
                  </span>
                ) : receipt.status === "sent" ? (
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Envoyé
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    À envoyer
                  </span>
                )
              ) : null}
            </div>

            {receipt ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-white border border-black/[0.06] space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#888880]">N° Reçu :</span>
                    <span className="font-mono font-bold text-[#111111]">{receipt.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#888880]">Portée :</span>
                    <span className="font-medium text-[#111111]">
                      {receipt.scope === "entire_order" ? "Commande entière" : "Par produit"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#888880]">Renvois effectués :</span>
                    <span className="font-mono font-bold text-[#111111]">{receipt.resendCount || 0} / 3</span>
                  </div>
                </div>

                {/* Historique des envois */}
                {receipt.sendLogs && receipt.sendLogs.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#888880] uppercase tracking-wider">
                      Historique des envois :
                    </span>
                    <div className="space-y-1">
                      {receipt.sendLogs.slice(0, 3).map((log, idx) => (
                        <div
                          key={idx}
                          className="text-[11px] p-2 rounded-lg bg-black/[0.03] text-[#666660] flex items-center justify-between"
                        >
                          <span>
                            {new Date(log.sentAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            par <strong>{log.sentBy}</strong>
                          </span>
                          {log.resendReason && (
                            <span className="text-[10px] text-[#888880] italic truncate max-w-[120px]">
                              {log.resendReason}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Boutons d'action pour le reçu */}
                {activeRole === "rider" ? (
                  <p className="text-[11px] text-[#888880] italic text-center p-2 rounded-lg bg-black/[0.02]">
                    Seules les closeuses et gérants peuvent envoyer ou réémettre les reçus.
                  </p>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/recu/${receipt.token}`}
                        target="_blank"
                        id="btn-order-view-receipt"
                        className="py-1.5 px-2.5 rounded-xl border border-black/10 bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#111111] flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#666660]" />
                        <span>Voir reçu</span>
                      </Link>

                      <button
                        type="button"
                        onClick={async () => {
                          const url = `${typeof window !== "undefined" ? window.location.origin : "https://afribuilder.com"}/recu/${receipt.token}`;
                          await navigator.clipboard.writeText(url);
                          setToastMessage("Lien du reçu copié !");
                        }}
                        id="btn-order-copy-receipt-link"
                        className="py-1.5 px-2.5 rounded-xl border border-black/10 bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#111111] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-[#666660]" />
                        <span>Copier lien</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={(receipt.resendCount || 0) >= 3}
                      onClick={() => setIsResendModalOpen(true)}
                      id="btn-order-resend-receipt"
                      className={cn(
                        "w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors",
                        (receipt.resendCount || 0) >= 3
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs"
                      )}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>
                        {(receipt.resendCount || 0) >= 3
                          ? "Limite de 3 renvois atteinte"
                          : `Renvoyer sur WhatsApp (${receipt.resendCount || 0}/3)`}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-black/[0.02] border border-black/[0.05] text-center space-y-1">
                <p className="text-xs font-medium text-[#666660]">
                  Généré automatiquement dès le passage à « Livrée ».
                </p>
                <p className="text-[10px] text-[#888880]">
                  L'envoi WhatsApp restera soumis à votre confirmation manuelle.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALE : Changer le statut avec motif ou date obligatoire */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <h3 className="text-base font-bold text-[#111111]">Modifier le statut</h3>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="p-1.5 text-[#666660] hover:text-[#111111]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Nouveau statut :
                </label>
                <select
                  id="status-select"
                  value={selectedNewStatus}
                  onChange={(e) => setSelectedNewStatus(e.target.value as OrderStatus)}
                  className="w-full p-2.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] font-semibold focus:outline-none"
                >
                  {ORDER_STATUSES.filter((st) => {
                    if (activeRole === "closer") return st !== "delivered";
                    if (activeRole === "rider") return st === "delivered" || st === "rejected";
                    return true;
                  }).map((st) => (
                    <option key={st} value={st}>
                      {ORDER_STATUS_LABELS[st]}
                    </option>
                  ))}
                </select>
                {activeRole === "closer" && (
                  <p className="text-[10px] text-amber-800 mt-1">
                    * Règle de sécurité : Le statut &laquo; Livrée &raquo; ne peut être validé que par le livreur ou l'administrateur après encaissement effectif des espèces.
                  </p>
                )}
              </div>

              {/* K2. Preuve de livraison obligatoire si statut = Livrée */}
              {selectedNewStatus === "delivered" && (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Preuve de livraison obligatoire (K2)
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Protocole anti-fraude</span>
                  </div>

                  {/* Mode de preuve configuré par la boutique */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-900 mb-1">
                      Type de preuve requis par la boutique :
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "code", label: "Code OTP", icon: KeyRound },
                        { id: "photo", label: "Photo remise", icon: Camera },
                        { id: "none", label: "Aucun", icon: Check },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setDeliveryProofType(item.id as any)}
                          className={cn(
                            "py-1.5 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                            deliveryProofType === item.id
                              ? "bg-[#111111] text-[#FAF8F5] border-[#111111] shadow-2xs"
                              : "bg-white text-emerald-950 border-emerald-200 hover:bg-emerald-100/50"
                          )}
                        >
                          <item.icon className="h-3 w-3" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Saisie du Code à 4 chiffres */}
                  {deliveryProofType === "code" && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-emerald-950">Code de confirmation client (4 chiffres) :</label>
                        <span className="text-[10px] text-emerald-800">Tentatives : {codeAttempts}/3</span>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        disabled={isCodeLocked}
                        value={enteredCode}
                        onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="Ex: 4821"
                        className="w-full text-center font-mono tracking-widest text-base font-black py-2 rounded-xl border border-emerald-300 bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <p className="text-[10px] text-emerald-800 leading-tight">
                        * Le client a reçu ce code par SMS/WhatsApp. Il doit le dicter au livreur contre remise du colis. (Code test : <strong>4821</strong>).
                      </p>
                    </div>
                  )}

                  {/* Upload de Photo */}
                  {deliveryProofType === "photo" && (
                    <div className="space-y-1.5 pt-1">
                      <label className="block text-xs font-bold text-emerald-950">Photo du colis remis au client :</label>
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoUploaded(true);
                          showToast("Photo de preuve enregistrée !");
                        }}
                        className={cn(
                          "w-full py-2.5 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer",
                          photoUploaded
                            ? "border-emerald-500 bg-emerald-100 text-emerald-900"
                            : "border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50"
                        )}
                      >
                        <Camera className="h-4 w-4" />
                        <span>{photoUploaded ? "✓ Photo de remise validée" : "Prendre / Joindre la photo du colis"}</span>
                      </button>
                    </div>
                  )}

                  {/* Accord géolocalisation livreur */}
                  <label className="flex items-start gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={riderGeoConsent}
                      onChange={(e) => setRiderGeoConsent(e.target.checked)}
                      className="mt-0.5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-emerald-900 leading-tight">
                      Le livreur consent à enregistrer sa position GPS pour la réconciliation (jamais exposée au client sans accord).
                    </span>
                  </label>

                  {/* Bouton déclarer un échec si la preuve n'est pas possible */}
                  <div className="pt-2 border-t border-emerald-200 flex justify-between items-center">
                    <span className="text-[10px] text-emerald-800">Le client ne peut pas recevoir ?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedNewStatus("rejected");
                        setStatusReason("Client absent au rendez-vous");
                      }}
                      className="text-xs font-bold text-rose-700 hover:underline cursor-pointer"
                    >
                      Déclarer un échec de livraison
                    </button>
                  </div>
                </div>
              )}

              {/* Champ obligatoire pour Rejetée ou Annulée */}
              {(selectedNewStatus === "rejected" || selectedNewStatus === "cancelled") && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                  <label className="block text-xs font-bold text-rose-800">
                    Motif obligatoire de l'échec / rejet :
                  </label>
                  <select
                    value={statusReason || failureReason}
                    onChange={(e) => {
                      setStatusReason(e.target.value);
                      setFailureReason(e.target.value);
                    }}
                    className="w-full p-2 text-xs rounded-lg border border-rose-300 bg-white text-[#111111] focus:outline-none"
                  >
                    <option value="Client absent au rendez-vous">Client absent au rendez-vous</option>
                    <option value="Refus du colis à la porte">Refus du colis à la porte</option>
                    <option value="Client injoignable après multiples tentatives">Client injoignable après multiples tentatives</option>
                    <option value="Adresse introuvable ou zone inaccessible">Adresse introuvable ou zone inaccessible</option>
                    <option value="Manque de liquidités pour le paiement">Manque de liquidités pour le paiement</option>
                  </select>
                </div>
              )}

              {/* Champ obligatoire pour Programmée ou Reportée */}
              {(selectedNewStatus === "scheduled" || selectedNewStatus === "postponed") && (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-1.5">
                  <label className="block text-xs font-bold text-purple-900">
                    Date & créneau obligatoire :
                  </label>
                  <input
                    type="text"
                    required
                    value={scheduledDateInput}
                    onChange={(e) => setScheduledDateInput(e.target.value)}
                    placeholder="Ex: Demain 16/11 entre 14h et 17h"
                    className="w-full p-2 text-xs rounded-lg border border-purple-300 bg-white text-[#111111] focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#666660] hover:text-[#111111]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#111111] text-xs font-bold text-[#FAF8F5] hover:bg-black shadow-2xs"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE CONFIRMATION DE SUPPRESSION */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="h-10 w-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111111]">Supprimer la commande ?</h3>
                <p className="text-xs text-[#666660]">Cette action est irréversible.</p>
              </div>
            </div>
            <p className="text-xs text-[#666660] leading-relaxed">
              Êtes-vous sûr de vouloir supprimer la commande <strong>#{order.orderNumber}</strong> de <strong>{order.customerName}</strong> ?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#666660] hover:text-[#111111]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteOrder}
                className="px-4 py-2 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 shadow-2xs"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODALE : PARTAGER LE LIEN DE SUIVI CLIENT (K1) */}
      {isTrackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Share2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#111111]">Lien de suivi client (K1)</h3>
                  <p className="text-[11px] text-[#666660]">Lien public unique, non devinable et sécurisé</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTrackingModalOpen(false)}
                className="p-1.5 text-[#666660] hover:text-[#111111]"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* URL de suivi */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666660]">
                Lien public de suivi (Expire après 30 jours)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={trackingUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-black/[0.08] bg-white text-[#111111] select-all focus:outline-none"
                />
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] hover:bg-black hover:text-[#FAF8F5] transition-all"
                  title="Ouvrir la page de suivi client"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Message WhatsApp personnalisé */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666660]">
                Message prêt à envoyer au client
              </label>
              <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] text-xs text-[#111111] leading-relaxed whitespace-pre-wrap font-sans">
                {interpolatedMessage}
              </div>
            </div>

            {/* Réassurance confidentialité */}
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Confidentialité garantie :</strong> Le nom complet, le numéro complet et l&apos;adresse précise sont masqués sur la page publique.
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={handleCopyTrackingMessage}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] transition-all cursor-pointer shadow-2xs"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copier le message</span>
              </button>
              <a
                href={`https://wa.me/${order.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                  interpolatedMessage
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#1EBE5D] transition-all shadow-md cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Envoyer sur WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE RENVOI DU REÇU (AVEC MOTIF OBLIGATOIRE) */}
      {isResendModalOpen && receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-black/[0.1] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <ReceiptIcon className="w-4 h-4 text-[#111111]" />
                <h3 className="text-sm font-bold text-[#111111]">
                  Renvoyer le reçu de livraison
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsResendModalOpen(false)}
                className="p-1 text-[#888880] hover:text-[#111111]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-black/[0.06] text-xs">
                <div className="flex justify-between">
                  <span className="text-[#888880]">Destinataire :</span>
                  <span className="font-bold text-[#111111]">
                    {receipt.customerFirstName} ({receipt.customerPhone})
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[#888880]">Renvois précédents :</span>
                  <span className="font-bold text-amber-700">
                    {receipt.resendCount || 0} sur 3 autorisés
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Motif du renvoi (obligatoire pour traçabilité) :
                </label>
                <select
                  id="resend-reason-select"
                  value={resendReason}
                  onChange={(e) => setResendReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-black/10 bg-[#FAF8F5] text-xs text-[#111111] font-medium focus:outline-none"
                >
                  <option value="Client demande un nouvel envoi">
                    Le client demande un nouvel envoi
                  </option>
                  <option value="Non reçu sur WhatsApp">
                    Non reçu lors du premier envoi
                  </option>
                  <option value="Changement de numéro WhatsApp">
                    Changement de numéro WhatsApp
                  </option>
                  <option value="Autre motif justifié">Autre motif justifié</option>
                </select>
              </div>

              <p className="text-[11px] text-[#888880] leading-relaxed">
                Le renvoi est limité à 3 fois par commande pour protéger le taux d'engagement WhatsApp et éviter tout spam.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => setIsResendModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-black/10 hover:bg-[#FAF8F5] text-xs font-bold text-[#666660] transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                id="btn-confirm-resend"
                onClick={handleResendReceipt}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Confirmer et ouvrir WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE ALERTE RUPTURE CLOSEUSE : EN ATTENTE DE STOCK (Prompt 16-b) */}
      {pendingStockAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-[#111111]">
                Stock insuffisant — Confirmation impossible
              </h3>
              <p className="text-xs text-[#555550] leading-relaxed">
                Le stock disponible pour cette référence vient d'être attribué à une autre commande confirmée. La commande #{order.orderNumber} a été basculée en <strong>« En attente de stock »</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] text-xs space-y-2">
              <p className="font-bold text-[#111111]">Actions recommandées :</p>
              <ul className="list-disc pl-4 space-y-1 text-[#666660] text-[11px]">
                <li>Contactez immédiatement le client pour lui proposer un produit similaire ou un délai d'attente prioritaire.</li>
                <li>Une alerte réapprovisionnement a été enregistrée pour les gestionnaires de stock.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingStockAlertOpen(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-black/[0.1] bg-white text-xs font-bold text-[#666660] hover:bg-black/[0.04]"
              >
                Fermer
              </button>
              <a
                href={generatePendingStockWhatsAppUrl({
                  customerPhone: order.customerPhone,
                  customerName: order.customerName,
                  orderNumber: order.orderNumber,
                  productName: order.items?.[0]?.productName || (order.items?.[0] as any)?.name || "votre commande",
                  storeName: "Novika",
                })}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setPendingStockAlertOpen(false)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-black shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Message WhatsApp client</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
