"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  Filter,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  X,
  ChevronDown,
  Check,
  Eye,
  Calendar,
  Users,
  Truck,
  RotateCcw,
  Sparkles,
  Receipt as ReceiptIcon,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import { generatePendingStockWhatsAppUrl } from "@/lib/stock-settings-store";
import { Order, OrderStatus, ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/server/data/types";
import { MOCK_ORDERS } from "@/mock-data/orders";
import { MOCK_RECEIPTS_DATA } from "@/mock-data/receipts";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Money } from "@/components/app/money";
import { CountryChip, CountryFlagSvg, InitialsAvatar, ProductThumb } from "@/components/app/bits";
import { PhoneActions } from "@/components/app/phone-actions";
import { DataTable, Column } from "@/components/app/data-table";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { useApp } from "@/components/layout/app-shell";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  PeriodPreset,
  DateRange,
  presetRange,
  getRangeDisplayLabel,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

interface OrdersListClientProps {
  storeSlug: string;
}

type TabStatus = "all" | OrderStatus | "rejected_cancelled";

export function OrdersListClient({ storeSlug }: OrdersListClientProps) {
  const router = useRouter();
  const { activeRole } = useApp();
  const isFounderDemoStore = storeSlug === "lome-glow";

  const [orders, setOrders] = useState<Order[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`novika_store_orders_${storeSlug}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
      if (!isFounderDemoStore) return [];
    }
    return isFounderDemoStore ? MOCK_ORDERS : [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`novika_store_orders_${storeSlug}`);
      if (saved) {
        try {
          setOrders(JSON.parse(saved));
          return;
        } catch {}
      }
      if (!isFounderDemoStore) {
        setOrders([]);
      }
    }
  }, [storeSlug, isFounderDemoStore]);

  useEffect(() => {
    if (typeof window !== "undefined" && !isFounderDemoStore) {
      localStorage.setItem(`novika_store_orders_${storeSlug}`, JSON.stringify(orders));
    }
  }, [orders, storeSlug, isFounderDemoStore]);
  const [activeTab, setActiveTab] = useState<TabStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedCloser, setSelectedCloser] = useState<string>("all");
  const [selectedRider, setSelectedRider] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedPreset, setSelectedPreset] = useState<PeriodPreset>("allTime");
  const [selectedRange, setSelectedRange] = useState<DateRange>(() =>
    presetRange("allTime", new Date())
  );
  const [showFilters, setShowFilters] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Compteurs par statut
  const counts = useMemo(() => {
    const res: Record<string, number> = {
      all: orders.length,
      pending: 0,
      pending_stock: 0,
      unreachable: 0,
      scheduled: 0,
      postponed: 0,
      delivered: 0,
      rejected_cancelled: 0,
    };
    orders.forEach((o) => {
      if (o.status === "pending") res.pending++;
      else if (o.status === "pending_stock") res.pending_stock++;
      else if (o.status === "unreachable") res.unreachable++;
      else if (o.status === "scheduled") res.scheduled++;
      else if (o.status === "postponed") res.postponed++;
      else if (o.status === "delivered") res.delivered++;
      else if (o.status === "rejected" || o.status === "cancelled") res.rejected_cancelled++;
    });
    return res;
  }, [orders]);

  // Filtrage combiné (Statut + Recherche + Pays + Closeuse + Livreur + Produit + Calendrier + RLS Rôle)
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 0. Politique RLS par rôle
      if (activeRole === "closer") {
        // La closeuse voit uniquement ses commandes assignées ou de son pays
        const isAssigned = order.assignedCloser?.name?.includes("Aïcha") || order.country === "CI";
        if (!isAssigned) return false;
      } else if (activeRole === "rider") {
        const isRiderOrder = order.assignedRider?.name?.includes("Mamadou");
        if (!isRiderOrder) return false;
      }

      // 1. Filtre par onglet statut
      if (activeTab === "rejected_cancelled") {
        if (order.status !== "rejected" && order.status !== "cancelled") return false;
      } else if (activeTab !== "all" && order.status !== activeTab) {
        return false;
      }

      // 2. Recherche textuelle
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesClient = order.customerName.toLowerCase().includes(q);
        const matchesPhone = order.customerPhone.includes(q);
        const matchesCity = order.city.toLowerCase().includes(q);
        const matchesNumber = order.orderNumber.toLowerCase().includes(q);
        const matchesProduct = order.items.some((it) => it.productName.toLowerCase().includes(q));
        if (!matchesClient && !matchesPhone && !matchesCity && !matchesNumber && !matchesProduct) {
          return false;
        }
      }

      // 3. Filtre Pays
      if (selectedCountry !== "all" && order.country !== selectedCountry) {
        return false;
      }

      // 4. Filtre Closeuse
      if (selectedCloser !== "all" && order.assignedCloser?.id !== selectedCloser) {
        return false;
      }

      // 5. Filtre Livreur
      if (selectedRider !== "all" && order.assignedRider?.id !== selectedRider) {
        return false;
      }

      // 6. Filtre Produit
      if (selectedProduct !== "all") {
        const hasProd = order.items.some((it) =>
          it.productName.toLowerCase().includes(selectedProduct.toLowerCase())
        );
        if (!hasProd) return false;
      }

      // 7. Filtre Date / Période Calendrier
      if (selectedPreset !== "allTime" && selectedRange?.from && selectedRange?.to) {
        let orderDate: Date | null = null;
        if (order.createdAt.includes(" à ")) {
          const datePart = order.createdAt.split(" à ")[0].trim();
          const [d, m, y] = datePart.split("/").map(Number);
          orderDate = new Date(y, m - 1, d);
        } else if (order.createdAt.includes("-")) {
          orderDate = new Date(order.createdAt);
          orderDate.setHours(0, 0, 0, 0);
        }

        if (orderDate) {
          const fromTime = new Date(selectedRange.from).setHours(0, 0, 0, 0);
          const toTime = new Date(selectedRange.to).getTime();
          const orderTime = orderDate.getTime();
          if (orderTime < fromTime || orderTime >= toTime) {
            return false;
          }
        }
      }

      return true;
    });
  }, [
    orders,
    activeTab,
    searchQuery,
    selectedCountry,
    selectedCloser,
    selectedRider,
    selectedProduct,
    selectedPreset,
    selectedRange,
    activeRole,
  ]);

  const activePeriodLabel = useMemo(() => {
    if (selectedPreset === "allTime") return null;
    return getRangeDisplayLabel(selectedPreset, selectedRange);
  }, [selectedPreset, selectedRange]);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    if (activeRole === "closer" && newStatus === "delivered") {
      showToast("Action interdite : Seul le livreur ou l'administrateur peut marquer une commande comme Livrée.");
      return;
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updatedAt: "À l'instant" } : o))
    );
    showToast(`Statut mis à jour : ${ORDER_STATUS_LABELS[newStatus]}`);
  };

  const handleResetAllFilters = () => {
    setSelectedCountry("all");
    setSelectedCloser("all");
    setSelectedRider("all");
    setSelectedProduct("all");
    setSelectedPreset("allTime");
    setSelectedRange(presetRange("allTime", new Date()));
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedCountry !== "all" ||
    selectedCloser !== "all" ||
    selectedRider !== "all" ||
    selectedProduct !== "all" ||
    selectedPreset !== "allTime" ||
    searchQuery.trim().length > 0;

  const handleExportCsv = () => {
    const headers = "N° Commande,Client,Téléphone,Pays,Ville,Montant,Statut,Date\n";
    const rows = filteredOrders
      .map(
        (o) =>
          `"${o.orderNumber}","${o.customerName}","${o.customerPhone}","${o.country}","${o.city}",${o.totalAmount},"${ORDER_STATUS_LABELS[o.status]}","${o.createdAt}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `commandes_${storeSlug}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast("Export CSV téléchargé avec succès !");
  };

  const tabs = [
    { key: "all" as const, label: "Toutes", count: counts.all },
    { key: "pending" as const, label: "À traiter", count: counts.pending, color: "bg-blue-50 text-blue-700" },
    { key: "pending_stock" as const, label: "En attente de stock", count: counts.pending_stock, color: "bg-amber-100 text-amber-900 border border-amber-300" },
    { key: "unreachable" as const, label: "Injoignables / Je vous reviens", count: counts.unreachable, color: "bg-orange-50 text-orange-700" },
    { key: "scheduled" as const, label: "Programmées", count: counts.scheduled, color: "bg-purple-50 text-purple-700" },
    { key: "postponed" as const, label: "Reportées", count: counts.postponed, color: "bg-yellow-50 text-yellow-800" },
    { key: "delivered" as const, label: "Livrées", count: counts.delivered, color: "bg-emerald-50 text-emerald-800" },
    { key: "rejected_cancelled" as const, label: "Rejetées / Annulées", count: counts.rejected_cancelled, color: "bg-rose-50 text-rose-700" },
  ];

  const columns: Column<Order>[] = [
    {
      key: "orderNumber",
      header: "N° Commande",
      className: "w-28",
      render: (order) => (
        <span className="font-mono text-xs font-bold text-[#111111]">
          {order.orderNumber}
        </span>
      ),
    },
    {
      key: "customer",
      header: "Client & Contact",
      render: (order) => (
        <div className="flex items-center gap-3">
          <InitialsAvatar name={order.customerName} size="sm" />
          <div className="min-w-0">
            <p className="font-bold text-xs text-[#111111] truncate">{order.customerName}</p>
            <p className="font-mono text-[11px] text-[#666660]">{order.customerPhone}</p>
          </div>
        </div>
      ),
    },
    {
      key: "location",
      header: "Ville & Pays",
      className: "w-36",
      render: (order) => (
        <div className="text-xs">
          <p className="font-medium text-[#111111] truncate">{order.city}</p>
          <div className="mt-0.5">
            <CountryChip code={order.country} />
          </div>
        </div>
      ),
    },
    {
      key: "products",
      header: "Produit(s)",
      render: (order) => (
        <div className="flex items-center gap-2">
          <ProductThumb
            src={order.items[0]?.image}
            alt={order.items[0]?.productName}
            size={32}
          />
          <div className="text-xs min-w-0">
            <p className="font-medium text-[#111111] truncate max-w-[200px]">
              {order.items[0]?.productName}
            </p>
            <p className="text-[11px] text-[#888880]">
              {order.items[0]?.variant} • Qté : {order.items[0]?.quantity}
              {order.items.length > 1 && ` (+${order.items.length - 1} autre)`}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "totalAmount",
      header: "Montant",
      className: "w-32",
      render: (order) => (
        <div className="text-xs">
          <p className="font-black text-[#111111]">
            <Money value={order.totalAmount} />
          </p>
          <p className="text-[10px] text-[#888880]">
            Frais : <Money value={order.shippingFee} />
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      className: "w-36",
      render: (order) => {
        const rcp = MOCK_RECEIPTS_DATA.find(
          (r) => r.orderId === order.id || r.orderNumber === order.orderNumber
        );

        return (
          <div className="flex items-center gap-1.5">
            <StatusBadge status={order.status} size="sm" />

            {/* Pastille / Icône de reçu si livrée ou reçu existant */}
            {rcp && (
              <Link
                href={`/app/${storeSlug}/commandes/recus`}
                onClick={(e) => e.stopPropagation()}
                id={`receipt-badge-${order.orderNumber}`}
                className={cn(
                  "p-1 rounded-md text-[10px] font-bold inline-flex items-center gap-0.5 transition-colors",
                  rcp.status === "viewed"
                    ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                    : rcp.status === "sent"
                    ? "text-blue-700 bg-blue-50 hover:bg-blue-100"
                    : "text-amber-700 bg-amber-50 hover:bg-amber-100 animate-pulse"
                )}
                title={`Reçu ${rcp.receiptNumber} : ${
                  rcp.status === "viewed"
                    ? "Consulté"
                    : rcp.status === "sent"
                    ? "Envoyé"
                    : "À envoyer"
                }`}
              >
                <ReceiptIcon className="w-3 h-3" />
              </Link>
            )}

            {/* Action 1-clic WhatsApp pour les commandes en attente de stock (Prompt 16-b) */}
            {order.status === "pending_stock" && (
              <a
                href={generatePendingStockWhatsAppUrl({
                  customerPhone: order.customerPhone,
                  customerName: order.customerName,
                  orderNumber: order.orderNumber,
                  productName: (order as any).productName || "votre commande",
                  storeName: "Novika",
                })}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-lg text-white bg-[#25D366] hover:bg-[#20ba5a] transition-all shadow-2xs"
                title="Message WhatsApp client (En attente de stock)"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Menu rapide de changement de statut */}
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 hover:opacity-100 focus:opacity-100 cursor-pointer text-[10px] bg-white border border-black/10 rounded px-1 py-0.5 text-[#111111]"
              title="Changer rapidement de statut"
            >
              {ORDER_STATUSES.filter((st) => activeRole !== "closer" || st !== "delivered").map((st) => (
                <option key={st} value={st}>
                  {ORDER_STATUS_LABELS[st]}
                </option>
              ))}
            </select>
          </div>
        );
      },
    },
    {
      key: "assignments",
      header: "Closeuse / Livreur",
      className: "w-36",
      render: (order) => (
        <div className="text-[11px] text-[#666660] space-y-0.5">
          <p className="truncate">
            <span className="text-[#888880]">Cl. :</span> {order.assignedCloser?.name || "Non assigné"}
          </p>
          <p className="truncate">
            <span className="text-[#888880]">Liv. :</span> {order.assignedRider?.name || "Non assigné"}
          </p>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      className: "w-28",
      render: (order) => (
        <span className="text-xs text-[#666660] whitespace-nowrap">
          {order.createdAt}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "w-28 text-right",
      render: (order) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <PhoneActions
            phoneE164={order.customerPhone}
            name={order.customerName}
            orderNumber={order.orderNumber}
            size="sm"
          />
          <Link
            href={`/app/${storeSlug}/commandes/${order.orderNumber}`}
            className="p-1.5 rounded-lg border border-black/[0.08] bg-white text-[#111111] hover:bg-black hover:text-[#FAF8F5] transition-colors"
            title="Voir le détail de la commande"
          >
            <Eye className="h-3.5 w-3.5" />
          </Link>
        </div>
      ),
    },
  ];

  const renderMobileCard = (order: Order) => (
    <div
      onClick={() => router.push(`/app/${storeSlug}/commandes/${order.orderNumber}`)}
      className="rounded-[20px] border border-black/[0.08] bg-white p-4 shadow-sm space-y-3 cursor-pointer hover:border-black/20 transition-all"
    >
      {/* Ligne 1 : Numéro, Statut et Date */}
      <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#111111]">{order.orderNumber}</span>
          <CountryChip code={order.country} showName={false} />
        </div>
        <StatusBadge status={order.status} size="sm" />
      </div>

      {/* Ligne 2 : Client & Ville & Montant */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <InitialsAvatar name={order.customerName} size="md" />
          <div>
            <p className="text-sm font-bold text-[#111111]">{order.customerName}</p>
            <p className="text-xs text-[#666660]">{order.city}</p>
            <p className="text-[11px] text-[#888880] mt-0.5">{order.createdAt}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-black text-[#111111]">
            <Money value={order.totalAmount} />
          </div>
          <span className="text-[10px] text-[#666660]">À encaisser</span>
        </div>
      </div>

      {/* Ligne 3 : Produit & Assignation */}
      <div className="bg-[#FAF8F5] border border-black/[0.06] rounded-xl p-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ProductThumb src={order.items[0]?.image} alt={order.items[0]?.productName} size={34} />
          <div className="min-w-0 text-xs">
            <p className="font-medium text-[#111111] truncate">{order.items[0]?.productName}</p>
            <p className="text-[11px] text-[#666660]">Qté : {order.items[0]?.quantity}</p>
          </div>
        </div>
        <div className="text-right text-[10px] text-[#666660] shrink-0">
          <p>Closeuse : {order.assignedCloser?.name?.split(" ")[0] || "—"}</p>
          <p>Livreur : {order.assignedRider?.name?.split(" ")[0] || "—"}</p>
        </div>
      </div>

      {/* Ligne 4 : Actions tactiles larges (> 44px) pour mobile */}
      <div className="pt-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex-1">
          <PhoneActions
            phoneE164={order.customerPhone}
            name={order.customerName}
            orderNumber={order.orderNumber}
            size="lg"
            className="w-full flex"
          />
        </div>
        <Link
          href={`/app/${storeSlug}/commandes/${order.orderNumber}`}
          className="h-11 min-h-[44px] px-4 rounded-xl border border-black/[0.08] bg-[#111111] flex items-center justify-center text-xs font-bold text-[#FAF8F5] hover:bg-black transition-colors shrink-0"
        >
          Détail
        </Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#111111] text-[#FAF8F5] px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* En-tête de la page */}
      <ScrollReveal delay={0}>
        <PageHeader
          title="Commandes"
          description="Gérez les flux de commandes COD, confirmez avec les closeuses et organisez les livraisons."
          badge={
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF8F5] text-[#111111] border border-black/[0.08] shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {counts.all} commandes enregistrées
            </span>
          }
          actions={
            <div className="flex items-center gap-2">
              <Link
                href={`/app/${storeSlug}/commandes/recus`}
                id="btn-goto-receipts"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] transition-all shadow-2xs cursor-pointer"
              >
                <ReceiptIcon className="h-3.5 w-3.5 text-emerald-600" />
                <span>Reçus</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                  2
                </span>
              </Link>
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] transition-all shadow-2xs cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Exporter (CSV)</span>
              </button>
              <Link
                href={`/app/${storeSlug}/commandes/rapide`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] transition-all shadow-2xs cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Commande rapide (IA)</span>
              </Link>
              <Link
                href={`/app/${storeSlug}/commandes/nouvelle`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111111] text-xs font-bold text-[#FAF8F5] hover:bg-black transition-all shadow-2xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nouvelle commande</span>
              </Link>
            </div>
          }
        />
      </ScrollReveal>

      {/* Bannière RLS Mode Closeuse */}
      {activeRole === "closer" && (
        <div className="p-3.5 rounded-2xl bg-blue-50/90 border border-blue-200 text-xs text-blue-950 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <p>
              <strong>Vue Closeuse active :</strong> Vous visualisez uniquement vos commandes assignées ou de votre pays ({filteredOrders.length} affichée(s)). Conformément aux politiques RLS, les données de prix de revient et les commandes d'autres closeuses sont masquées, et le statut « Livrée » est réservé aux livreurs.
            </p>
          </div>
        </div>
      )}

      {/* Onglets de Statut avec compteurs */}
      <ScrollReveal delay={50}>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none",
                  isActive
                    ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                    : "bg-[#FAF8F5] border border-black/[0.08] text-[#555550] hover:text-[#111111] hover:bg-white"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                    isActive
                      ? "bg-[#FAF8F5] text-[#111111]"
                      : tab.color || "bg-black/[0.06] text-[#111111]"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </ScrollReveal>

      {/* Barre de Recherche et Filtres avec Calendrier intégré au niveau du filtre */}
      <ScrollReveal delay={100} className="relative z-30">
        <div className="rounded-2xl border border-black/[0.08] bg-[#FAF8F5] p-3 shadow-2xs space-y-3 relative z-30">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Barre de recherche */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888880]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom client, téléphone, ville, produit ou N° commande..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] placeholder:text-[#888880] focus:outline-none focus:ring-2 focus:ring-black/[0.12] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#888880] hover:text-[#111111]"
                  title="Effacer la recherche"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Option Calendrier universelle au niveau du filtre */}
            <div className="shrink-0">
              <DateRangePicker
                preset={selectedPreset}
                range={selectedRange}
                onChange={(preset, range) => {
                  setSelectedPreset(preset);
                  setSelectedRange(range);
                }}
                syncWithUrl={true}
                showPrefix={true}
                align="right"
              />
            </div>

            {/* Bouton Toggle Filtres avancés */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap",
                showFilters || hasActiveFilters
                  ? "bg-[#111111] text-[#FAF8F5] border-[#111111]"
                  : "bg-white text-[#111111] border-black/[0.08] hover:bg-[#F3EFE6]"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filtres</span>
              {hasActiveFilters && (
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              )}
            </button>
          </div>

          {/* Tiroir de filtres déroulant */}
          {showFilters && (
            <div className="pt-3 border-t border-black/[0.06] space-y-3 animate-in fade-in slide-in-from-top-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Option Calendrier / Date dans le tiroir */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666660] mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-[#111111]" />
                    <span>Période / Calendrier</span>
                  </label>
                  <select
                    value={selectedPreset}
                    onChange={(e) => {
                      const p = e.target.value as PeriodPreset;
                      setSelectedPreset(p);
                      setSelectedRange(presetRange(p, new Date()));
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                  >
                    <option value="allTime">Tout le temps (toutes les dates)</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="yesterday">Hier</option>
                    <option value="thisWeek">Cette semaine</option>
                    <option value="lastWeek">Semaine dernière</option>
                    <option value="last7">7 derniers jours</option>
                    <option value="last30">30 derniers jours</option>
                    <option value="thisMonth">Ce mois-ci</option>
                    <option value="lastMonth">Le mois dernier</option>
                  </select>
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    {[
                      { id: "allTime" as const, label: "Toutes" },
                      { id: "today" as const, label: "Aujourd'hui" },
                      { id: "yesterday" as const, label: "Hier" },
                      { id: "last7" as const, label: "7j" },
                      { id: "thisMonth" as const, label: "Mois" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPreset(p.id);
                          setSelectedRange(presetRange(p.id, new Date()));
                        }}
                        className={cn(
                          "px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors",
                          selectedPreset === p.id
                            ? "bg-[#111111] text-[#FAF8F5] border-[#111111]"
                            : "bg-white text-[#555550] border-black/[0.08] hover:bg-black/5"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtre Pays */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666660] mb-1">
                    Pays
                  </label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                  >
                    <option value="all">Tous les pays</option>
                    <option value="TG">🇹🇬 Togo</option>
                    <option value="CI">🇨🇮 Côte d'Ivoire</option>
                    <option value="SN">🇸🇳 Sénégal</option>
                    <option value="BJ">🇧🇯 Bénin</option>
                  </select>
                </div>

                {/* Filtre Closeuse */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666660] mb-1">
                    Closeuse
                  </label>
                  <select
                    value={selectedCloser}
                    onChange={(e) => setSelectedCloser(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                  >
                    <option value="all">Toutes les closeuses</option>
                    <option value="cls_01">Aïcha Diallo</option>
                    <option value="cls_02">Esther Lawson</option>
                  </select>
                </div>

                {/* Filtre Livreur */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666660] mb-1">
                    Livreur
                  </label>
                  <select
                    value={selectedRider}
                    onChange={(e) => setSelectedRider(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                  >
                    <option value="all">Tous les livreurs</option>
                    <option value="rdr_01">Mamadou Express (Abidjan)</option>
                    <option value="rdr_02">Koffi Moto-Course (Lomé)</option>
                    <option value="rdr_03">Ibrahima Colis (Dakar)</option>
                    <option value="rdr_04">Parfait Express (Cotonou)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Bandeau des filtres actifs avec tags et bouton Réinitialiser */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-[#666660]">Filtres appliqués :</span>
                {activePeriodLabel && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#111111] text-[#FAF8F5]">
                    <Calendar className="h-3 w-3 text-emerald-400" />
                    <span>Période : {activePeriodLabel}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPreset("allTime");
                        setSelectedRange(presetRange("allTime", new Date()));
                      }}
                      className="p-0.5 rounded-full hover:bg-white/20 text-[#FAF8F5]"
                      title="Effacer le filtre de date"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedCountry !== "all" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-black/[0.08] text-[#111111]">
                    <span>Pays : {selectedCountry}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCountry("all")}
                      className="p-0.5 rounded-full hover:bg-black/10 text-[#666660]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedCloser !== "all" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-black/[0.08] text-[#111111]">
                    <span>Closeuse sélectionnée</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCloser("all")}
                      className="p-0.5 rounded-full hover:bg-black/10 text-[#666660]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedRider !== "all" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-black/[0.08] text-[#111111]">
                    <span>Livreur sélectionné</span>
                    <button
                      type="button"
                      onClick={() => setSelectedRider("all")}
                      className="p-0.5 rounded-full hover:bg-black/10 text-[#666660]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-black/[0.08] text-[#111111]">
                    <span>Recherche : &ldquo;{searchQuery}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="p-0.5 rounded-full hover:bg-black/10 text-[#666660]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-[#888880]">
                  {filteredOrders.length} commande(s) trouvée(s)
                </span>
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Réinitialiser tout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Tableau ou Cartes Mobile des Commandes */}
      <ScrollReveal delay={150}>
        <DataTable
          columns={columns}
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          onRowClick={(item) => router.push(`/app/${storeSlug}/commandes/${item.orderNumber}`)}
          renderMobileCard={renderMobileCard}
          emptyTitle={orders.length === 0 ? "Aucune commande pour le moment" : "Aucune commande trouvée"}
          emptyDescription={
            orders.length === 0
              ? "Votre boutique n'a pas encore reçu de commande. Partagez le lien de votre vitrine ou créez votre première commande manuelle."
              : "Aucune commande ne correspond aux filtres ou à la recherche sélectionnés."
          }
        />
      </ScrollReveal>
    </div>
  );
}
