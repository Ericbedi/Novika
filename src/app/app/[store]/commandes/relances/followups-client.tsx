"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Phone,
  MessageCircle,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  User,
  ArrowLeft,
  Search,
  Volume2,
  Users,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import { MOCK_ORDERS } from "@/mock-data/orders";
import { formatFcfa } from "@/lib/money";
import { whatsappLink } from "@/lib/phone";
import { cn } from "@/lib/utils";
import {
  Followup,
  CallOutcomeType,
  PostponeReason,
  POSTPONE_REASON_LABELS,
  CloserPerformanceStats,
} from "@/server/data/followups-types";
import {
  isWithinWorkingHours,
  adjustToNextWorkingSlot,
  calculateNextCadenceAttempt,
  validateRescheduleRequest,
  processOrderCallOutcome,
  canReopenOrder,
  calculateCloserPerformanceStats,
  checkOverdueFollowups,
  DEFAULT_WORKING_HOURS,
  MAX_RESCHEDULES_LIMIT,
} from "@/lib/followups";
import { canReassignFollowups, canViewCloserPerformance, canReopenRejectedOrders } from "@/config/permissions";
import { UserRole, Order } from "@/server/data/types";

interface FollowupsClientProps {
  storeSlug: string;
}

export function FollowupsClient({ storeSlug }: FollowupsClientProps) {
  // Rôle actif de test
  const [activeRole, setActiveRole] = useState<UserRole>("admin");
  const currentCloserId = "cls_01";
  const currentCloserName = "Aïcha Diallo";

  // État des commandes et des rappels
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [followups, setFollowups] = useState<Followup[]>([
    {
      id: "fol_01",
      orderId: "ord_10482",
      orderNumber: "CMD-10482",
      shopId: storeSlug,
      customerName: "Awa Traoré",
      customerPhone: "+2250748291102",
      productName: "Café Bio Champignon Vitality (Pack 2 boîtes)",
      totalAmount: 26900,
      city: "Abidjan (Cocody)",
      assignedTo: { id: "cls_01", name: "Aïcha Diallo" },
      type: "unreachable",
      dueAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // Échue il y a 15 min
      attemptNo: 1,
      status: "pending",
      notes: "Premier appel sans réponse",
      createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    },
    {
      id: "fol_02",
      orderId: "ord_10481",
      orderNumber: "CMD-10481",
      shopId: storeSlug,
      customerName: "Koffi Mensah",
      customerPhone: "+22890123456",
      productName: "Sérum Visage Anti-Taches & Éclat",
      totalAmount: 30000,
      city: "Lomé (Agoè Nyivé)",
      assignedTo: { id: "cls_01", name: "Aïcha Diallo" },
      type: "rescheduled",
      dueAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(), // Échue il y a 40 min (>30m : alerte manager)
      attemptNo: 2,
      status: "pending",
      postponeReason: "salary",
      notes: "Client en attente de virement ce matin",
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
    {
      id: "fol_03",
      orderId: "ord_10476",
      orderNumber: "CMD-10476",
      shopId: storeSlug,
      customerName: "Mariam Sanogo",
      customerPhone: "+2250789123456",
      productName: "Café Bio Champignon Vitality",
      totalAmount: 26900,
      city: "Abidjan (Yopougon)",
      assignedTo: { id: "cls_02", name: "Fatou Bamba" },
      type: "rescheduled",
      dueAt: new Date(Date.now() + 4 * 3600 * 1000).toISOString(), // Programmée future
      attemptNo: 1,
      status: "pending",
      postponeReason: "travel",
      notes: "En déplacement, retour en fin d'après-midi",
      createdAt: new Date().toISOString(),
    },
    {
      id: "fol_04",
      orderId: "ord_10474",
      orderNumber: "CMD-10474",
      shopId: storeSlug,
      customerName: "Kossi Amégan",
      customerPhone: "+22890445566",
      productName: "Sérum Visage Anti-Taches",
      totalAmount: 16500,
      city: "Lomé (Adidogomé)",
      assignedTo: { id: "cls_01", name: "Aïcha Diallo" },
      type: "unreachable",
      dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(), // Cadence essai 3
      attemptNo: 2,
      status: "pending",
      notes: "Injoignable au 2e essai. Rappel programmé demain matin.",
      createdAt: new Date().toISOString(),
    },
  ]);

  // 3 Onglets principaux
  const [activeTab, setActiveTab] = useState<"due_now" | "scheduled" | "archive">("due_now");
  const [searchQuery, setSearchQuery] = useState("");
  const [showManagerStats, setShowManagerStats] = useState(false);

  // Modale issue : Report
  const [rescheduleModal, setRescheduleModal] = useState<{
    isOpen: boolean;
    order?: Order;
    date: string;
    time: string;
    reason: PostponeReason;
    notes: string;
  }>({
    isOpen: false,
    date: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split("T")[0],
    time: "10:00",
    reason: "salary",
    notes: "",
  });

  // Modale issue : Rejet
  const [rejectionModal, setRejectionModal] = useState<{
    isOpen: boolean;
    order?: Order;
    reason: string;
    notes: string;
  }>({
    isOpen: false,
    reason: "Refus explicite du client (a changé d'avis)",
    notes: "",
  });

  // Modale Réouverture
  const [reopenModal, setReopenModal] = useState<{
    isOpen: boolean;
    order?: Order;
    reason: string;
    correctedPhone: string;
  }>({
    isOpen: false,
    reason: "Numéro de téléphone vérifié fourni par le client",
    correctedPhone: "",
  });

  // Modale WhatsApp Modèles
  const [selectedOrderForWa, setSelectedOrderForWa] = useState<Followup | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // Ré5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // La5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // Audio fallback silencieux si non autorisé
    }
  };

  // Filtrage des rappels selon le rôle et les autorisations
  const now = new Date();

  // Analyse des retards et alertes
  const overdueReport = useMemo(() => checkOverdueFollowups(followups, now), [followups]);

  // Statistiques de l'équipe pour manager / admin
  const closerStats: CloserPerformanceStats[] = useMemo(
    () => calculateCloserPerformanceStats(orders, followups),
    [orders, followups]
  );

  // Séparation en 3 onglets
  const tabData = useMemo(() => {
    const isCloser = activeRole === "closer";

    // 1. À appeler maintenant (pending & dueAt <= now)
    const dueNow = followups.filter((f) => {
      if (f.status !== "pending") return false;
      const isDue = new Date(f.dueAt).getTime() <= now.getTime();
      const isMine = !isCloser || f.assignedTo.id === currentCloserId;
      return isDue && isMine;
    });

    // 2. Programmées futures (pending & dueAt > now)
    const scheduled = followups.filter((f) => {
      if (f.status !== "pending") return false;
      const isFuture = new Date(f.dueAt).getTime() > now.getTime();
      const isMine = !isCloser || f.assignedTo.id === currentCloserId;
      return isFuture && isMine;
    });

    // 3. Perdues / Rejetées (historique archivé)
    const archiveOrders = orders.filter((o) => {
      const isArchivedStatus =
        o.status === "rejected" ||
        o.status === "rejected_invalid_number" ||
        o.status === "lost_unreachable";
      const isMine = !isCloser || o.assignedCloser?.id === currentCloserId;
      return isArchivedStatus && isMine;
    });

    return { dueNow, scheduled, archiveOrders };
  }, [followups, orders, activeRole]);

  // Filtrage par texte de recherche
  const filteredDueNow = tabData.dueNow.filter(
    (f) =>
      searchQuery === "" ||
      f.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.customerPhone.includes(searchQuery) ||
      f.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredScheduled = tabData.scheduled.filter(
    (f) =>
      searchQuery === "" ||
      f.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.customerPhone.includes(searchQuery) ||
      f.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredArchive = tabData.archiveOrders.filter(
    (o) =>
      searchQuery === "" ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.includes(searchQuery) ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ACTION 1 : Confirmée
  const handleConfirmOrder = (orderId: string, orderNumber: string) => {
    const order = orders.find((o) => o.id === orderId) || {
      id: orderId,
      orderNumber,
      customerName: "Client",
      customerPhone: "+22500000000",
      country: "CI" as const,
      city: "Abidjan",
      deliveryAddress: "Cocody",
      items: [],
      subtotal: 10000,
      shippingFee: 1000,
      totalAmount: 11000,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = processOrderCallOutcome({
      order,
      outcome: "confirmed",
      existingFollowups: followups,
      closer: { id: currentCloserId, name: currentCloserName },
      now: new Date(),
    });

    setOrders((prev) => prev.map((o) => (o.id === orderId ? res.updatedOrder : o)));
    setFollowups((prev) =>
      prev.map((f) => (res.cancelledFollowupIds.includes(f.id) ? { ...f, status: "completed" as const } : f))
    );
    showToast(res.message);
  };

  // ACTION 2 : Injoignable (Calcul automatique cadence)
  const handleUnreachableOrder = (orderId: string, orderNumber: string) => {
    const order = orders.find((o) => o.id === orderId) || {
      id: orderId,
      orderNumber,
      customerName: "Client",
      customerPhone: "+22500000000",
      country: "CI" as const,
      city: "Abidjan",
      deliveryAddress: "Cocody",
      items: [],
      subtotal: 10000,
      shippingFee: 1000,
      totalAmount: 11000,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = processOrderCallOutcome({
      order,
      outcome: "unreachable",
      existingFollowups: followups,
      closer: { id: currentCloserId, name: currentCloserName },
      now: new Date(),
    });

    setOrders((prev) =>
      prev.some((o) => o.id === orderId)
        ? prev.map((o) => (o.id === orderId ? res.updatedOrder : o))
        : [...prev, res.updatedOrder]
    );

    setFollowups((prev) => {
      const updated = prev.map((f) =>
        res.cancelledFollowupIds.includes(f.id) ? { ...f, status: "completed" as const } : f
      );
      return res.createdFollowup ? [res.createdFollowup, ...updated] : updated;
    });

    showToast(res.message);
  };

  // ACTION 3 : Reportée (Soumission modale)
  const handleSubmitReschedule = () => {
    if (!rescheduleModal.order) return;
    const targetOrder = rescheduleModal.order;

    const [hours, minutes] = rescheduleModal.time.split(":").map(Number);
    const targetDate = new Date(`${rescheduleModal.date}T12:00:00`);
    targetDate.setHours(hours || 10, minutes || 0, 0, 0);

    try {
      const res = processOrderCallOutcome({
        order: targetOrder,
        outcome: "rescheduled",
        existingFollowups: followups,
        closer: { id: currentCloserId, name: currentCloserName },
        postponeDate: targetDate,
        postponeReason: rescheduleModal.reason,
        notes: rescheduleModal.notes,
        now: new Date(),
      });

      setOrders((prev) => prev.map((o) => (o.id === targetOrder.id ? res.updatedOrder : o)));
      setFollowups((prev) => {
        const updated = prev.map((f) =>
          res.cancelledFollowupIds.includes(f.id) ? { ...f, status: "completed" as const } : f
        );
        return res.createdFollowup ? [res.createdFollowup, ...updated] : updated;
      });

      setRescheduleModal({ ...rescheduleModal, isOpen: false, notes: "" });
      showToast(res.message);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur de validation");
    }
  };

  // ACTION 4 : Rejetée (Soumission modale)
  const handleSubmitRejection = () => {
    if (!rejectionModal.order) return;
    const targetOrder = rejectionModal.order;

    try {
      const res = processOrderCallOutcome({
        order: targetOrder,
        outcome: "rejected",
        existingFollowups: followups,
        closer: { id: currentCloserId, name: currentCloserName },
        rejectionReason: rejectionModal.reason,
        notes: rejectionModal.notes,
        now: new Date(),
      });

      setOrders((prev) =>
        prev.some((o) => o.id === targetOrder.id)
          ? prev.map((o) => (o.id === targetOrder.id ? res.updatedOrder : o))
          : [...prev, res.updatedOrder]
      );

      setFollowups((prev) =>
        prev.map((f) =>
          res.cancelledFollowupIds.includes(f.id) ? { ...f, status: "cancelled" as const } : f
        )
      );

      setRejectionModal({ ...rejectionModal, isOpen: false, notes: "" });
      showToast(res.message);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur lors du rejet");
    }
  };

  // ACTION 5 : Faux numéro / numéro invalide
  const handleInvalidNumber = (orderId: string, orderNumber: string) => {
    const order = orders.find((o) => o.id === orderId) || {
      id: orderId,
      orderNumber,
      customerName: "Client",
      customerPhone: "+22500000000",
      country: "CI" as const,
      city: "Abidjan",
      deliveryAddress: "Cocody",
      items: [],
      subtotal: 10000,
      shippingFee: 1000,
      totalAmount: 11000,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = processOrderCallOutcome({
      order,
      outcome: "rejected_invalid_number",
      existingFollowups: followups,
      closer: { id: currentCloserId, name: currentCloserName },
      now: new Date(),
    });

    setOrders((prev) =>
      prev.some((o) => o.id === orderId)
        ? prev.map((o) => (o.id === orderId ? res.updatedOrder : o))
        : [...prev, res.updatedOrder]
    );

    setFollowups((prev) =>
      prev.map((f) =>
        res.cancelledFollowupIds.includes(f.id) ? { ...f, status: "cancelled" as const } : f
      )
    );

    showToast(res.message);
  };

  // ACTION 6 : Réassignation d'un rappel (Manager / Admin)
  const handleReassignFollowup = (followupId: string) => {
    setFollowups((prev) =>
      prev.map((f) =>
        f.id === followupId
          ? {
            ...f,
            assignedTo: { id: "cls_02", name: "Fatou Bamba" },
            notes: `${f.notes || ""}\n[Réassigné par le Manager à Fatou Bamba]`.trim(),
          }
          : f
      )
    );
    showToast("Rappel réassigné à Fatou Bamba (closeuse en service).");
  };

  // ACTION 7 : Réouverture de commande
  const handleReopenOrder = () => {
    if (!reopenModal.order) return;
    const targetOrder = reopenModal.order;

    const check = canReopenOrder({
      userRole: activeRole,
      order: targetOrder,
      isCorrectedPhoneSubmitted: Boolean(reopenModal.correctedPhone && reopenModal.correctedPhone.length > 5),
    });

    if (!check.allowed) {
      alert(check.reason);
      return;
    }

    const updatedOrder: Order = {
      ...targetOrder,
      status: "pending",
      customerPhone: reopenModal.correctedPhone || targetOrder.customerPhone,
      reopenCount: (targetOrder.reopenCount || 0) + 1,
      notes: `${targetOrder.notes || ""}\n[Réouverture]: ${reopenModal.reason}`.trim(),
    };

    setOrders((prev) => prev.map((o) => (o.id === targetOrder.id ? updatedOrder : o)));

    // Créer un rappel immédiat pour la réouverture
    const newFollowup: Followup = {
      id: `fol_reopen_${Date.now()}`,
      orderId: targetOrder.id,
      orderNumber: targetOrder.orderNumber,
      shopId: storeSlug,
      customerName: targetOrder.customerName,
      customerPhone: reopenModal.correctedPhone || targetOrder.customerPhone,
      productName: targetOrder.items[0]?.productName || "Produit",
      totalAmount: targetOrder.totalAmount,
      city: targetOrder.city,
      assignedTo: { id: currentCloserId, name: currentCloserName },
      type: "unreachable",
      dueAt: new Date().toISOString(),
      attemptNo: 1,
      status: "pending",
      notes: `Commande réouverte (${reopenModal.reason})`,
      createdAt: new Date().toISOString(),
    };

    setFollowups((prev) => [newFollowup, ...prev]);
    setReopenModal({ ...reopenModal, isOpen: false, correctedPhone: "" });
    showToast("Commande réouverte avec succès. Placée en tête de liste.");
  };

  // Modale WhatsApp
  const handleOpenWaModal = (item: Followup) => {
    setSelectedOrderForWa(item);
    let defaultMsg = "";
    if (item.type === "unreachable") {
      defaultMsg = `Bonjour ${item.customerName}, nous avons essayé de vous appeler sans succès pour confirmer votre commande #${item.orderNumber} (${item.productName}). Quel est le meilleur moment pour vous joindre aujourd'hui ? Merci !`;
    } else {
      defaultMsg = `Bonjour ${item.customerName}, nous vous recontactons comme convenu pour la livraison de votre commande #${item.orderNumber} à ${item.city}. Confirmez-vous que nous pouvons vous livrer aujourd'hui ?`;
    }
    setSelectedTemplate(defaultMsg);
    setIsWaModalOpen(true);
  };

  const handleSendWa = () => {
    if (!selectedOrderForWa) return;
    const url = whatsappLink(selectedOrderForWa.customerPhone, selectedTemplate);
    window.open(url, "_blank");
    setIsWaModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Toast */}
      {toastMessage && (
        <div
          id="followup-toast"
          className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#111111] text-[#FAF8F5] px-4 py-3 text-xs font-semibold shadow-2xl flex items-center gap-2 border border-white/10 animate-in fade-in slide-in-from-bottom-2"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Barre de contexte du rôle & Horaires de service */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-[#666660]">Rôle actif :</span>
          <div className="flex items-center gap-1 bg-black/[0.04] p-1 rounded-xl">
            {(["admin", "manager", "closer"] as UserRole[]).map((role) => (
              <button
                key={role}
                type="button"
                id={`role-btn-${role}`}
                onClick={() => setActiveRole(role)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize",
                  activeRole === role
                    ? "bg-[#111111] text-white shadow-xs"
                    : "text-[#666660] hover:text-[#111111]"
                )}
              >
                {role === "closer" ? "Closeuse" : role}
              </button>
            ))}
          </div>
          {activeRole === "closer" && (
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Session : {currentCloserName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-[#666660]">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="h-3.5 w-3.5 text-orange-600" />
            <span>Horaires : 07:00 – 18:00 (Lun–Sam)</span>
          </div>
          <button
            type="button"
            id="btn-play-alert-sound"
            onClick={playAlertSound}
            className="p-1.5 rounded-lg border border-black/[0.08] hover:bg-[#FAF8F5] text-[#111111] transition-all cursor-pointer"
            title="Tester le son d'alerte des rappels"
          >
            <Volume2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* En-tête principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
              Closing & Relances Automatiques
            </span>
            {tabData.dueNow.length > 0 && (
              <span
                id="due-now-badge"
                className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 animate-pulse"
              >
                {tabData.dueNow.length} rappel(s) à faire maintenant
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight mt-0.5">
            Commandes à Appeler
          </h1>
          <p className="text-xs text-[#666660] mt-0.5">
            File de relances cadencées, reports convenus et clôture automatique sans relance client autonome.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canViewCloserPerformance(activeRole) && (
            <button
              type="button"
              id="btn-toggle-manager-stats"
              onClick={() => setShowManagerStats(!showManagerStats)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer",
                showManagerStats
                  ? "bg-[#111111] text-white border-black"
                  : "bg-white text-[#111111] border-black/[0.08] hover:bg-[#FAF8F5]"
              )}
            >
              <Users className="h-4 w-4" />
              <span>{showManagerStats ? "Masquer Statistiques" : "Suivi Équipe & Abus"}</span>
            </button>
          )}

          <Link
            href={`/app/${storeSlug}/commandes`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] transition-all shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Commandes</span>
          </Link>
        </div>
      </div>

      {/* Section Alerte Manager : Retards > 30 min ou > 2h */}
      {canReassignFollowups(activeRole) && overdueReport.managerAlertFollowups.length > 0 && (
        <div id="manager-overdue-alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0" />
              <h3 className="text-xs font-black text-amber-900">
                Alerte Responsable : {overdueReport.managerAlertFollowups.length} rappel(s) sans action depuis plus de 30 minutes
              </h3>
            </div>
            <span className="text-[11px] font-bold text-amber-800">
              {overdueReport.reassignableFollowups.length} éligible(s) à la réassignation (&gt;2h)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
            {overdueReport.managerAlertFollowups.slice(0, 4).map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/80 border border-amber-200"
              >
                <div>
                  <span className="font-mono font-bold text-[#111111]">{f.orderNumber}</span>
                  <span className="text-[#666660]"> — {f.customerName} ({f.assignedTo.name})</span>
                </div>
                {canReassignFollowups(activeRole) && (
                  <button
                    type="button"
                    onClick={() => handleReassignFollowup(f.id)}
                    className="btn-reassign px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold transition-all cursor-pointer"
                  >
                    Réassigner
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TABLEAU DE PERFORMANCE & ANTI-ABUS (Manager / Admin) */}
      {showManagerStats && canViewCloserPerformance(activeRole) && (
        <div id="closer-performance-table" className="rounded-3xl border border-black/[0.08] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
            <div>
              <h2 className="text-sm font-black text-[#111111]">
                Tableau de bord de Vigilance Closing & Taux de Rejet
              </h2>
              <p className="text-xs text-[#666660]">
                Surveillance bienveillante : comparaison des taux de rejet et des délais de rappel par closeuse.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
              Vérification anti-abus
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/[0.06] text-[#888880] text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Closeuse</th>
                  <th className="py-2.5 px-3">Assignées</th>
                  <th className="py-2.5 px-3">Confirmées</th>
                  <th className="py-2.5 px-3">Reportées</th>
                  <th className="py-2.5 px-3">Rejetées</th>
                  <th className="py-2.5 px-3">Perdues</th>
                  <th className="py-2.5 px-3">Taux de Rejet</th>
                  <th className="py-2.5 px-3">Délai Moyen</th>
                  <th className="py-2.5 px-3">Indicateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {closerStats.map((st) => (
                  <tr key={st.closerId} className="hover:bg-[#FAF8F5] transition-all">
                    <td className="py-3 px-3 font-bold text-[#111111]">{st.closerName}</td>
                    <td className="py-3 px-3">{st.totalAssigned}</td>
                    <td className="py-3 px-3 font-semibold text-emerald-700">{st.confirmedCount}</td>
                    <td className="py-3 px-3 text-purple-700">{st.rescheduledCount}</td>
                    <td className="py-3 px-3 font-semibold text-red-600">{st.rejectedCount}</td>
                    <td className="py-3 px-3 text-[#888880]">{st.lostCount}</td>
                    <td className="py-3 px-3 font-mono font-bold">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md",
                          st.rejectionRate > 35 ? "bg-red-100 text-red-800" : "bg-black/[0.04] text-[#111111]"
                        )}
                      >
                        {st.rejectionRate}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#666660]">{st.avgProcessingMinutes} min</td>
                    <td className="py-3 px-3">
                      {st.isHighRejectionAlert ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Rejet Anormal (Vérifier)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Normal</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3 ONGLETS AVEC COMPTEURS VISIBLES & RECHERCHE */}
      <div className="rounded-3xl border border-black/[0.08] bg-[#FAF8F5] p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              type="button"
              id="tab-due-now"
              onClick={() => setActiveTab("due_now")}
              className={cn(
                "px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 shadow-2xs",
                activeTab === "due_now"
                  ? "bg-[#111111] text-[#FAF8F5]"
                  : "bg-white text-[#666660] hover:text-[#111111] border border-black/[0.06]"
              )}
            >
              <span>À appeler maintenant</span>
              <span
                id="count-due-now"
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-extrabold",
                  tabData.dueNow.length > 0 ? "bg-red-500 text-white" : "bg-black/[0.08] text-[#666660]"
                )}
              >
                {tabData.dueNow.length}
              </span>
            </button>

            <button
              type="button"
              id="tab-scheduled"
              onClick={() => setActiveTab("scheduled")}
              className={cn(
                "px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 shadow-2xs",
                activeTab === "scheduled"
                  ? "bg-[#111111] text-[#FAF8F5]"
                  : "bg-white text-[#666660] hover:text-[#111111] border border-black/[0.06]"
              )}
            >
              <span>Programmées</span>
              <span id="count-scheduled" className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-black/[0.08] text-[#666660]">
                {tabData.scheduled.length}
              </span>
            </button>

            <button
              type="button"
              id="tab-archive"
              onClick={() => setActiveTab("archive")}
              className={cn(
                "px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 shadow-2xs",
                activeTab === "archive"
                  ? "bg-[#111111] text-[#FAF8F5]"
                  : "bg-white text-[#666660] hover:text-[#111111] border border-black/[0.06]"
              )}
            >
              <span>Perdues / Rejetées</span>
              <span id="count-archive" className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-black/[0.08] text-[#666660]">
                {tabData.archiveOrders.length}
              </span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888880]" />
            <input
              type="text"
              id="search-followups"
              placeholder="Rechercher client, tél, commande..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* CONTENU ONGLET 1 : À APPELER MAINTENANT */}
      {activeTab === "due_now" && (
        <div id="list-due-now" className="space-y-3">
          {filteredDueNow.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-black/[0.08] bg-[#FAF8F5] text-xs text-[#888880] space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="font-bold text-[#111111] text-sm">
                Aucun rappel en attente immédiate !
              </p>
              <p>Toutes les commandes à appeler ont été traitées.</p>
            </div>
          ) : (
            filteredDueNow.map((item) => (
              <div
                key={item.id}
                id={`followup-card-${item.id}`}
                className="rounded-3xl border border-red-200 bg-white p-4 sm:p-5 shadow-sm space-y-4 hover:border-red-400 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.05] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-[#111111]">
                      {item.orderNumber}
                    </span>
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold",
                        item.type === "unreachable"
                          ? "bg-orange-100 text-orange-900 border border-orange-200"
                          : "bg-purple-100 text-purple-900 border border-purple-200"
                      )}
                    >
                      {item.type === "unreachable" ? `Injoignable (Essai #${item.attemptNo}/4)` : `Report convenu (#${item.attemptNo})`}
                    </span>
                    {item.postponeReason && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/[0.04] text-[#666660]">
                        {POSTPONE_REASON_LABELS[item.postponeReason]}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-red-600 font-bold">
                    <Clock className="h-3.5 w-3.5" />
                    <span>À appeler maintenant (Prévu à : {new Date(item.dueAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })})</span>
                  </div>
                </div>

                {/* Détails client & Produit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <h3 className="font-black text-base text-[#111111]">{item.customerName}</h3>
                    <p className="text-sm font-mono font-bold text-[#666660]">{item.customerPhone}</p>
                    <p className="text-[11px] text-[#888880] mt-0.5">
                      Ville : <strong className="text-[#111111]">{item.city}</strong> • Montant : <strong className="text-emerald-700">{formatFcfa(item.totalAmount)}</strong>
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-[#111111]">Produit : {item.productName}</p>
                    {item.notes && (
                      <p className="text-[11px] text-[#666660] italic mt-1 bg-[#FAF8F5] p-2 rounded-xl border border-black/[0.04]">
                        Dernière note : « {item.notes} »
                      </p>
                    )}
                  </div>
                </div>

                {/* ACTIONS MOBILES : Bouton Appeler 48px & WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-black/[0.06]">
                  <a
                    href={`tel:${item.customerPhone}`}
                    id={`btn-call-${item.id}`}
                    className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Appeler {item.customerPhone} (Composeur)</span>
                  </a>

                  <button
                    type="button"
                    id={`btn-wa-${item.id}`}
                    onClick={() => handleOpenWaModal(item)}
                    className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp (Modèle 1-Clic)</span>
                  </button>
                </div>

                {/* 5 ISSUES D'APPEL STRICTES (Prompt 05-RL) */}
                <div className="space-y-1.5 pt-2 border-t border-black/[0.06]">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#888880]">
                    Issue de cet appel (Cocher une issue) :
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
                    {/* 1. Confirmée */}
                    <button
                      type="button"
                      id={`btn-outcome-confirmed-${item.id}`}
                      onClick={() => handleConfirmOrder(item.orderId, item.orderNumber)}
                      className="px-2.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Confirmée</span>
                    </button>

                    {/* 2. Reportée */}
                    <button
                      type="button"
                      id={`btn-outcome-rescheduled-${item.id}`}
                      onClick={() => {
                        const targetOrder = orders.find((o) => o.id === item.orderId) || {
                          id: item.orderId,
                          orderNumber: item.orderNumber,
                          customerName: item.customerName,
                          customerPhone: item.customerPhone,
                          country: "CI" as const,
                          city: item.city,
                          deliveryAddress: "",
                          items: [],
                          subtotal: item.totalAmount,
                          shippingFee: 0,
                          totalAmount: item.totalAmount,
                          status: "pending" as const,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        };
                        setRescheduleModal({
                          isOpen: true,
                          order: targetOrder,
                          date: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split("T")[0],
                          time: "10:00",
                          reason: "salary",
                          notes: "",
                        });
                      }}
                      className="px-2.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Reportée</span>
                    </button>

                    {/* 3. Injoignable */}
                    <button
                      type="button"
                      id={`btn-outcome-unreachable-${item.id}`}
                      onClick={() => handleUnreachableOrder(item.orderId, item.orderNumber)}
                      className="px-2.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-300 text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Injoignable</span>
                    </button>

                    {/* 4. Rejetée */}
                    <button
                      type="button"
                      id={`btn-outcome-rejected-${item.id}`}
                      onClick={() => {
                        const targetOrder = orders.find((o) => o.id === item.orderId) || {
                          id: item.orderId,
                          orderNumber: item.orderNumber,
                          customerName: item.customerName,
                          customerPhone: item.customerPhone,
                          country: "CI" as const,
                          city: item.city,
                          deliveryAddress: "",
                          items: [],
                          subtotal: item.totalAmount,
                          shippingFee: 0,
                          totalAmount: item.totalAmount,
                          status: "pending" as const,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        };
                        setRejectionModal({
                          isOpen: true,
                          order: targetOrder,
                          reason: "Refus explicite du client (a changé d'avis)",
                          notes: "",
                        });
                      }}
                      className="px-2.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-900 border border-red-300 text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Rejetée Client</span>
                    </button>

                    {/* 5. Faux numéro */}
                    <button
                      type="button"
                      id={`btn-outcome-invalid-${item.id}`}
                      onClick={() => handleInvalidNumber(item.orderId, item.orderNumber)}
                      className="px-2.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>Faux Numéro</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CONTENU ONGLET 2 : PROGRAMMÉES (FUTURES) */}
      {activeTab === "scheduled" && (
        <div id="list-scheduled" className="space-y-3">
          {filteredScheduled.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-black/[0.08] bg-[#FAF8F5] text-xs text-[#888880]">
              Aucun rappel futur planifié pour le moment.
            </div>
          ) : (
            filteredScheduled.map((item) => (
              <div
                key={item.id}
                id={`scheduled-card-${item.id}`}
                className="rounded-3xl border border-black/[0.08] bg-white p-4 sm:p-5 shadow-2xs space-y-3 hover:border-black/[0.15] transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.05] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-[#111111]">
                      {item.orderNumber}
                    </span>
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold",
                        item.type === "unreachable"
                          ? "bg-orange-100 text-orange-900"
                          : "bg-purple-100 text-purple-900"
                      )}
                    >
                      {item.type === "unreachable" ? `Cadence (Essai #${item.attemptNo}/4)` : "Report convenu"}
                    </span>
                    {item.postponeReason && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/[0.04] text-[#666660]">
                        {POSTPONE_REASON_LABELS[item.postponeReason]}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-purple-800 font-bold bg-purple-50 px-2.5 py-1 rounded-xl">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Échéance : {new Date(item.dueAt).toLocaleString("fr-FR")}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-black text-sm text-[#111111]">{item.customerName}</span>
                    <span className="text-[#666660]"> ({item.customerPhone})</span>
                    <p className="text-[11px] text-[#888880]">
                      {item.city} • {item.productName} • <strong>{formatFcfa(item.totalAmount)}</strong>
                    </p>
                    {item.notes && (
                      <p className="text-[11px] text-[#666660] italic mt-1">« {item.notes} »</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenWaModal(item)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <a
                      href={`tel:${item.customerPhone}`}
                      className="px-3 py-2 rounded-xl border border-black/[0.08] bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#111111] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>Appeler</span>
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CONTENU ONGLET 3 : PERDUES & REJETÉES (ARCHIVE) */}
      {activeTab === "archive" && (
        <div id="list-archive" className="space-y-3">
          <div className="p-3 rounded-2xl bg-black/[0.03] border border-black/[0.06] text-xs text-[#666660] flex items-center justify-between">
            <span>
              Toutes les commandes rejetées ou injoignables après 4 essais : rappels coupés, stock remis en rayon et zéro pixel Purchase envoyé à Meta.
            </span>
            <span className="font-bold text-[#111111]">{filteredArchive.length} commande(s)</span>
          </div>

          {filteredArchive.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-black/[0.08] bg-[#FAF8F5] text-xs text-[#888880]">
              Aucune commande clôturée ou rejetée dans l&apos;historique.
            </div>
          ) : (
            filteredArchive.map((order) => (
              <div
                key={order.id}
                id={`archive-card-${order.id}`}
                className="rounded-3xl border border-black/[0.08] bg-white p-4 sm:p-5 shadow-2xs space-y-3 opacity-90 hover:opacity-100 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.05] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-[#111111]">
                      {order.orderNumber}
                    </span>
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold",
                        order.status === "lost_unreachable"
                          ? "bg-neutral-200 text-neutral-800"
                          : "bg-red-100 text-red-900 border border-red-200"
                      )}
                    >
                      {order.status === "lost_unreachable"
                        ? "Perdue – Injoignable (4 essais)"
                        : order.status === "rejected_invalid_number"
                          ? "Rejetée – Numéro invalide"
                          : "Rejetée par le client"}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      ✓ Stock remis en rayon
                    </span>
                  </div>

                  <span className="text-[11px] text-[#888880]">
                    Clôturée le {new Date(order.updatedAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <h4 className="font-black text-sm text-[#111111]">{order.customerName}</h4>
                    <p className="text-[11px] text-[#666660]">
                      Tél : {order.customerPhone} • {order.city} • Montant : {formatFcfa(order.totalAmount)}
                    </p>
                    <p className="text-[11px] text-red-700 font-semibold mt-1">
                      Motif de clôture : {order.rejectionReason || "Refus client"}
                    </p>
                  </div>

                  {/* Bouton de réouverture (Admin / Manager ou Closeuse avec numéro corrigé) */}
                  <div>
                    <button
                      type="button"
                      id={`btn-reopen-${order.id}`}
                      onClick={() =>
                        setReopenModal({
                          isOpen: true,
                          order,
                          reason: "Correction du numéro ou demande client",
                          correctedPhone: "",
                        })
                      }
                      className="px-3 py-2 rounded-xl border border-black/[0.08] bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#111111] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Rouvrir la commande</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODALE REPORT DE RAPPEL */}
      {rescheduleModal.isOpen && rescheduleModal.order && (
        <div id="modal-reschedule" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-black text-[#111111]">
                  Programmer un Report — {rescheduleModal.order.orderNumber}
                </h3>
                <p className="text-xs text-[#666660]">
                  Client : {rescheduleModal.order.customerName} (Report #{(rescheduleModal.order.rescheduleCount || 0) + 1}/{MAX_RESCHEDULES_LIMIT})
                </p>
              </div>
              <button
                type="button"
                id="btn-close-reschedule-modal"
                onClick={() => setRescheduleModal({ ...rescheduleModal, isOpen: false })}
                className="text-[#888880] hover:text-[#111111] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#666660] uppercase mb-1">
                  Motif du report (Obligatoire) :
                </label>
                <select
                  id="select-reschedule-reason"
                  value={rescheduleModal.reason}
                  onChange={(e) =>
                    setRescheduleModal({ ...rescheduleModal, reason: e.target.value as PostponeReason })
                  }
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white font-medium"
                >
                  <option value="salary">Attente salaire / Tontine</option>
                  <option value="travel">En voyage / Déplacement</option>
                  <option value="indisposed">Indisponible / En réunion</option>
                  <option value="other">Autre motif convenu</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#666660] uppercase mb-1">
                    Date prévue :
                  </label>
                  <input
                    type="date"
                    id="input-reschedule-date"
                    value={rescheduleModal.date}
                    onChange={(e) => setRescheduleModal({ ...rescheduleModal, date: e.target.value })}
                    className="w-full p-2 rounded-xl border border-black/[0.08] bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#666660] uppercase mb-1">
                    Heure (07:00 – 18:00) :
                  </label>
                  <input
                    type="time"
                    id="input-reschedule-time"
                    value={rescheduleModal.time}
                    onChange={(e) => setRescheduleModal({ ...rescheduleModal, time: e.target.value })}
                    className="w-full p-2 rounded-xl border border-black/[0.08] bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#666660] uppercase mb-1">
                  Note interne d&apos;appel :
                </label>
                <textarea
                  id="textarea-reschedule-notes"
                  value={rescheduleModal.notes}
                  onChange={(e) => setRescheduleModal({ ...rescheduleModal, notes: e.target.value })}
                  placeholder="Ex : Le client demande à être rappelé vendredi à 14h pour livraison..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => setRescheduleModal({ ...rescheduleModal, isOpen: false })}
                className="px-4 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                id="btn-submit-reschedule"
                onClick={handleSubmitReschedule}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Valider le Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE REJET DE COMMANDE */}
      {rejectionModal.isOpen && rejectionModal.order && (
        <div id="modal-rejection" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-black text-red-900">
                  Clôturer en Rejetée — {rejectionModal.order.orderNumber}
                </h3>
                <p className="text-xs text-[#666660]">
                  Tous les rappels seront coupés et le stock sera remis automatiquement en place.
                </p>
              </div>
              <button
                type="button"
                id="btn-close-rejection-modal"
                onClick={() => setRejectionModal({ ...rejectionModal, isOpen: false })}
                className="text-[#888880] hover:text-[#111111] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#666660] uppercase mb-1">
                  Motif obligatoire de refus du client :
                </label>
                <select
                  id="select-rejection-reason"
                  value={rejectionModal.reason}
                  onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white font-medium"
                >
                  <option value="Refus explicite du client (a changé d'avis)">
                    Refus explicite du client (a changé d&apos;avis)
                  </option>
                  <option value="« Je n'ai pas commandé ce produit » (Erreur ou usurpation)">
                    « Je n&apos;ai pas commandé ce produit » (Erreur ou usurpation)
                  </option>
                  <option value="Prix jugé trop élevé au closing">Prix jugé trop élevé au closing</option>
                  <option value="A déjà trouvé ailleurs / Délai trop long">
                    A déjà trouvé ailleurs / Délai trop long
                  </option>
                  <option value="Autre refus catégorique">Autre refus catégorique</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#666660] uppercase mb-1">
                  Précisions / Note :
                </label>
                <textarea
                  id="textarea-rejection-notes"
                  value={rejectionModal.notes}
                  onChange={(e) => setRejectionModal({ ...rejectionModal, notes: e.target.value })}
                  placeholder="Détails supplémentaires..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => setRejectionModal({ ...rejectionModal, isOpen: false })}
                className="px-4 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                id="btn-submit-rejection"
                onClick={handleSubmitRejection}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Confirmer le Rejet Définitif
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE RÉOUVERTURE DE COMMANDE */}
      {reopenModal.isOpen && reopenModal.order && (
        <div id="modal-reopen" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-black text-[#111111]">
                  Réouverture de la commande — {reopenModal.order.orderNumber}
                </h3>
                <p className="text-xs text-[#666660]">
                  Rôle requérant : <strong>{activeRole}</strong>
                </p>
              </div>
              <button
                type="button"
                id="btn-close-reopen-modal"
                onClick={() => setReopenModal({ ...reopenModal, isOpen: false })}
                className="text-[#888880] hover:text-[#111111] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#666660] uppercase mb-1">
                  Nouveau numéro fourni par le client (Si correction) :
                </label>
                <input
                  type="tel"
                  id="input-reopen-phone"
                  value={reopenModal.correctedPhone}
                  onChange={(e) => setReopenModal({ ...reopenModal, correctedPhone: e.target.value })}
                  placeholder="+225..."
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#666660] uppercase mb-1">
                  Motif de réouverture (Journal d&apos;audit) :
                </label>
                <input
                  type="text"
                  id="input-reopen-reason"
                  value={reopenModal.reason}
                  onChange={(e) => setReopenModal({ ...reopenModal, reason: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => setReopenModal({ ...reopenModal, isOpen: false })}
                className="px-4 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                id="btn-submit-reopen"
                onClick={handleReopenOrder}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Rouvrir & Remettre en File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE CHOIX DU MODÈLE WHATSAPP */}
      {isWaModalOpen && selectedOrderForWa && (
        <div id="modal-whatsapp-template" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-black text-[#111111]">
                  Modèle WhatsApp pour {selectedOrderForWa.customerName}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#888880]">
                {selectedOrderForWa.customerPhone}
              </span>
            </div>

            {/* Sélecteur rapide de modèle */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-[#666660] uppercase">
                Changer de modèle pré-formaté :
              </label>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <button
                  type="button"
                  id="wa-template-1"
                  onClick={() =>
                    setSelectedTemplate(
                      `Bonjour ${selectedOrderForWa.customerName}, nous avons tenté de vous joindre sans succès pour votre commande #${selectedOrderForWa.orderNumber} (${selectedOrderForWa.productName}). Quand seriez-vous disponible pour que notre livreur passe à ${selectedOrderForWa.city} ? Merci !`
                    )
                  }
                  className="p-2 rounded-xl border border-black/[0.08] bg-white hover:bg-black/[0.03] text-left font-bold cursor-pointer"
                >
                  1. Injoignable (Douce)
                </button>
                <button
                  type="button"
                  id="wa-template-2"
                  onClick={() =>
                    setSelectedTemplate(
                      `Bonjour ${selectedOrderForWa.customerName}, comme convenu lors de notre dernier appel, nous vous recontactons pour finaliser votre commande #${selectedOrderForWa.orderNumber}. Êtes-vous prêt pour la livraison aujourd'hui ?`
                    )
                  }
                  className="p-2 rounded-xl border border-black/[0.08] bg-white hover:bg-black/[0.03] text-left font-bold cursor-pointer"
                >
                  2. Rappel convenu
                </button>
                <button
                  type="button"
                  id="wa-template-3"
                  onClick={() =>
                    setSelectedTemplate(
                      `Bonjour ${selectedOrderForWa.customerName}, nous arrivons à la date convenue pour la livraison de votre commande #${selectedOrderForWa.orderNumber} d'un montant de ${formatFcfa(selectedOrderForWa.totalAmount)}. Le livreur peut-il se mettre en route vers ${selectedOrderForWa.city} ?`
                    )
                  }
                  className="p-2 rounded-xl border border-black/[0.08] bg-white hover:bg-black/[0.03] text-left font-bold cursor-pointer"
                >
                  3. Jour J Livraison
                </button>
                <button
                  type="button"
                  id="wa-template-4"
                  onClick={() =>
                    setSelectedTemplate(
                      `Bonjour ${selectedOrderForWa.customerName}, dernière tentative pour votre commande #${selectedOrderForWa.orderNumber}. Sans réponse d'ici ce soir, la commande sera automatiquement annulée et le produit remis en vente. Merci !`
                    )
                  }
                  className="p-2 rounded-xl border border-black/[0.08] bg-white hover:bg-black/[0.03] text-left font-bold text-red-700 cursor-pointer"
                >
                  4. Relance ferme (Essai 4)
                </button>
              </div>
            </div>

            {/* Texte modifiable avant envoi */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-[#666660] uppercase">
                Aperçu et personnalisation du message :
              </label>
              <textarea
                id="textarea-whatsapp-body"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                rows={4}
                className="w-full p-3 rounded-2xl border border-black/[0.08] bg-white text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06]">
              <button
                type="button"
                id="btn-close-wa-modal"
                onClick={() => setIsWaModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-black/[0.03] transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                id="btn-open-wa-link"
                onClick={handleSendWa}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Ouvrir WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
