"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ShoppingCart,
  Plus,
  Search,
  Truck,
  Ship,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  X,
  PackageCheck,
  Calendar,
  Building,
  RotateCcw,
  Boxes,
  TrendingDown,
  Download,
  Globe,
  Paperclip,
} from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { MOCK_PURCHASE_ORDERS } from "@/mock-data/purchase-orders";
import { MOCK_SUPPLIERS } from "@/mock-data/suppliers";
import { MOCK_PRODUCTS } from "@/mock-data/products";
import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  PURCHASE_ORDER_STATUS_LABELS,
} from "@/server/data/types";
import { formatFcfa } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/layout/app-shell";
import { ProductsNavTabs } from "@/components/products/products-nav-tabs";

interface PurchaseOrdersClientProps {
  storeSlug: string;
}

export function PurchaseOrdersClient({ storeSlug }: PurchaseOrdersClientProps) {
  const searchParams = useSearchParams();
  const { activeRole } = useApp();
  const isCloser = activeRole === "closer";
  const isRider = activeRole === "rider";
  const isRestricted = isCloser || isRider;

  const [orders, setOrders] = useState<PurchaseOrder[]>(MOCK_PURCHASE_ORDERS);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(MOCK_PURCHASE_ORDERS[0] || null);

  // Modal Nouveau Bon
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newSupplierId, setNewSupplierId] = useState("sup_01");
  const [newDestination, setNewDestination] = useState("Entrepôt Principal Lomé (Zone Portuaire)");
  const [newEstimatedArrival, setNewEstimatedArrival] = useState("25/11/2026");
  const [newCarrier, setNewCarrier] = useState("Maersk Line");
  const [newTracking, setNewTracking] = useState("");
  const [newShippingCost, setNewShippingCost] = useState<number>(200000);
  const [newCustomsCost, setNewCustomsCost] = useState<number>(80000);
  const [newAgentFee, setNewAgentFee] = useState<number>(25000);

  // Lignes d'articles du nouveau bon
  const [newItems, setNewItems] = useState<
    Array<{ productId: string; productName: string; quantity: number; unitCost: number }>
  >([
    {
      productId: "prod_01",
      productName: "Café Bio Champignon Vitality",
      quantity: 150,
      unitCost: 4500,
    },
  ]);

  // Modal de Réception
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);
  const [receiveInputs, setReceiveInputs] = useState<
    Record<string, { received: number; defective: number }>
  >({});

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Pré-remplissage depuis URL (ex: ?action=new&supplier=...&product=...&qty=...)
  useEffect(() => {
    const action = searchParams.get("action");
    const supplierParam = searchParams.get("supplier");
    const productParam = searchParams.get("product");
    const qtyParam = searchParams.get("qty");

    if (action === "new") {
      if (supplierParam) setNewSupplierId(supplierParam);
      if (productParam && qtyParam) {
        const prod = MOCK_PRODUCTS.find((p) => p.id === productParam);
        if (prod) {
          setNewItems([
            {
              productId: prod.id,
              productName: prod.name,
              quantity: Number(qtyParam) || 100,
              unitCost: prod.costPrice || 3500,
            },
          ]);
        }
      }
      setIsNewModalOpen(true);
    }
  }, [searchParams]);

  // Filtrage des bons
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      const matchSearch =
        searchQuery === "" ||
        o.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        o.items.some((i) => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchStatus && matchSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  const handleExportCsv = () => {
    const headers = "N° PO,Fournisseur,Pays,Statut,Articles,Cout_Articles_FCFA,Frais_Approche_FCFA,Cout_Total_FCFA,ETA\n";
    const rows = filteredOrders
      .map(
        (o) =>
          `"${o.poNumber}","${o.supplierName}","${o.supplierCountry}","${PURCHASE_ORDER_STATUS_LABELS[o.status]}",${o.items.length},${o.totalItemsCost},${o.landedCosts.totalLanded},${o.totalCostWithLanded},"${o.estimatedArrivalDate || ""}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sourcing_achats_${storeSlug}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast("Export CSV du sourcing téléchargé !");
  };

  // 5 Compteurs Sourcing (Section C1)
  const sourcingCounters = useMemo(() => {
    const totalPhysicalStock = MOCK_PRODUCTS.reduce((sum, p) => sum + (p.stock || 0), 0);
    const awaitingSupplierCount = orders.filter((o) => o.status === "draft").length;
    const orderedCount = orders.filter((o) => o.status === "ordered").length;
    const shippedCount = orders.filter((o) => o.status === "shipped").length;
    const totalSourcingCost = orders.reduce((sum, o) => sum + o.totalCostWithLanded, 0);

    return {
      totalPhysicalStock,
      awaitingSupplierCount,
      orderedCount,
      shippedCount,
      totalSourcingCost,
    };
  }, [orders]);

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status === "ordered" || o.status === "shipped"),
    [orders]
  );
  const totalInTransitValue = useMemo(
    () => activeOrders.reduce((acc, curr) => acc + curr.totalCostWithLanded, 0),
    [activeOrders]
  );
  const totalLandedAll = useMemo(
    () => orders.reduce((acc, curr) => acc + curr.landedCosts.totalLanded, 0),
    [orders]
  );

  // Si l'utilisateur est closeuse ou livreur : écran d'accès restreint RLS
  if (isRestricted) {
    return (
      <div className="space-y-6 pb-20">
        <ProductsNavTabs storeSlug={storeSlug} />
        <div className="rounded-[24px] border border-rose-200 bg-rose-50/50 p-12 text-center shadow-2xs space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-black text-rose-950">Accès Restreint par Politique RLS</h3>
            <p className="text-xs text-rose-800 max-w-md mx-auto mt-1">
              Les bons d'achats fournisseurs, frais de dédouanement maritimes et coûts moyens pondérés (PUMP) sont strictement confidentiels.
            </p>
          </div>
          <Link
            href={`/app/${storeSlug}/produits`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F3A26] text-white text-xs font-bold hover:bg-[#162B1C] transition-all shadow-sm"
          >
            <span>Retour au Catalogue</span>
          </Link>
        </div>
      </div>
    );
  }

  // Ouvrir modal réception
  const handleOpenReceive = (order: PurchaseOrder) => {
    setReceivingOrder(order);
    const initialInputs: Record<string, { received: number; defective: number }> = {};
    order.items.forEach((item) => {
      initialInputs[item.id] = {
        received: item.quantityOrdered - (item.quantityReceived || 0),
        defective: 0,
      };
    });
    setReceiveInputs(initialInputs);
    setIsReceiveModalOpen(true);
  };

  // Valider réception (Calcul automatique PUMP + incrément stock physique + finances)
  const handleConfirmReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingOrder) return;

    let totalRec = 0;
    let totalDef = 0;

    const updatedItems = receivingOrder.items.map((item) => {
      const input = receiveInputs[item.id] || { received: 0, defective: 0 };
      totalRec += input.received;
      totalDef += input.defective;
      return {
        ...item,
        quantityReceived: item.quantityReceived + input.received,
        quantityDefective: item.quantityDefective + input.defective,
      };
    });

    const isFullyReceived = updatedItems.every(
      (it) => it.quantityReceived + it.quantityDefective >= it.quantityOrdered
    );
    const newStatus: PurchaseOrderStatus = isFullyReceived ? "received" : "partially_received";

    const newEvent = {
      id: `poe_${Date.now()}`,
      date: new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: newStatus,
      description: `Réception enregistrée : ${totalRec} unités conformes intégrées au stock physique, ${totalDef} défectueuses. PUMP recalculé automatiquement.`,
      author: "Promises Bedi",
    };

    const updatedOrder: PurchaseOrder = {
      ...receivingOrder,
      status: newStatus,
      actualArrivalDate: new Date().toLocaleDateString("fr-FR"),
      items: updatedItems,
      events: [...receivingOrder.events, newEvent],
    };

    setOrders((prev) => prev.map((o) => (o.id === receivingOrder.id ? updatedOrder : o)));
    setSelectedOrder(updatedOrder);
    setIsReceiveModalOpen(false);

    showToast(
      `Réception confirmée sur ${receivingOrder.poNumber} ! Stock physique augmenté de ${totalRec} unités.`
    );
  };

  // Créer un nouveau bon de commande avec calcul automatique quote-part approche
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = MOCK_SUPPLIERS.find((s) => s.id === newSupplierId) || MOCK_SUPPLIERS[0];

    const totalItemsCost = newItems.reduce((sum, it) => sum + it.quantity * it.unitCost, 0);
    const totalLanded = newShippingCost + newCustomsCost + newAgentFee;
    const totalCostWithLanded = totalItemsCost + totalLanded;

    // Prorata des frais d'approche
    const orderItems: PurchaseOrderItem[] = newItems.map((it, idx) => {
      const itemCost = it.quantity * it.unitCost;
      const share = totalItemsCost > 0 ? (itemCost / totalItemsCost) * totalLanded : 0;
      const unitShare = it.quantity > 0 ? Math.round(share / it.quantity) : 0;
      const finalUnitLandedCost = it.unitCost + unitShare;

      return {
        id: `poi_${Date.now()}_${idx}`,
        productId: it.productId,
        productName: it.productName,
        sku: `SKU-${it.productId}`,
        quantityOrdered: it.quantity,
        quantityReceived: 0,
        quantityDefective: 0,
        unitCost: it.unitCost,
        landedCostShare: unitShare,
        finalUnitLandedCost,
      };
    });

    const newPO: PurchaseOrder = {
      id: `po_${Date.now()}`,
      poNumber: `PO-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, "0")}`,
      supplierId: sup.id,
      supplierName: sup.name,
      supplierCountry: sup.country,
      status: "ordered",
      createdAt: new Date().toLocaleDateString("fr-FR"),
      estimatedArrivalDate: newEstimatedArrival,
      trackingNumber: newTracking || undefined,
      carrier: newCarrier,
      destinationLocation: newDestination,
      items: orderItems,
      landedCosts: {
        shipping: newShippingCost,
        customs: newCustomsCost,
        agentFee: newAgentFee,
        totalLanded,
      },
      totalItemsCost,
      totalCostWithLanded,
      notes: "Bon de commande généré depuis le module Achats Fournisseurs.",
      events: [
        {
          id: `poe_${Date.now()}`,
          date: new Date().toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "ordered",
          description: "Bon de commande transmis au fournisseur.",
          author: "Promises Bedi",
        },
      ],
    };

    setOrders((prev) => [newPO, ...prev]);
    setSelectedOrder(newPO);
    setIsNewModalOpen(false);
    showToast(`Bon de commande ${newPO.poNumber} créé avec succès !`);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Navigation 5 Onglets */}
      <ProductsNavTabs storeSlug={storeSlug} />

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
              Approvisionnements & Importations
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#1F3A26]/[0.05] text-[#111111]">
              {orders.length} bons d'achat
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            Achats Fournisseurs
          </h1>
          <p className="text-xs text-[#666660] mt-0.5">
            Suivi des cargaisons maritimes et aériennes, répartition des frais d'approche (fret, douane, transitaire) et calcul automatique du PUMP.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker align="right" />
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] transition-all shadow-2xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exporter (CSV)</span>
          </button>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1F3A26] text-[#FAF8F5] text-xs font-bold hover:bg-[#162B1C] transition-all shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Sourcer un produit</span>
          </button>
        </div>
      </div>

      {/* 5 COMPTEURS SOURCING (Section C1 : En stock, En attente, Commandés, Expédiés, Coût total) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#666660] block">
            En stock
          </span>
          <div className="mt-1 text-xl font-black text-[#111111]">
            {sourcingCounters.totalPhysicalStock} pcs
          </div>
          <span className="text-[10px] text-[#888880]">Unités en entrepôt</span>
        </div>

        <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#666660] block">
            En attente du fournisseur
          </span>
          <div className="mt-1 text-xl font-black text-amber-700">
            {sourcingCounters.awaitingSupplierCount} bons
          </div>
          <span className="text-[10px] text-[#888880]">Devis & Proforma</span>
        </div>

        <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#666660] block">
            Commandés
          </span>
          <div className="mt-1 text-xl font-black text-blue-700">
            {sourcingCounters.orderedCount} bons
          </div>
          <span className="text-[10px] text-[#888880]">En fabrication</span>
        </div>

        <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#666660] block">
            Expédiés
          </span>
          <div className="mt-1 text-xl font-black text-purple-700">
            {sourcingCounters.shippedCount} bons
          </div>
          <span className="text-[10px] text-[#888880]">En transit maritime/fret</span>
        </div>

        <div className="rounded-2xl border border-black/[0.08] bg-[#FAF8F5] p-3.5 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#666660] block">
            Coût total
          </span>
          <div className="mt-1 text-xl font-black text-[#111111]">
            {formatFcfa(sourcingCounters.totalSourcingCost)}
          </div>
          <span className="text-[10px] text-[#888880]">Frais d'approche inclus</span>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* INDICATEURS EN HAUT */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#666660] block">
            Commandes en Transit / Cours
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#111111]">{activeOrders.length}</span>
            <span className="text-xs font-bold text-blue-700">en mer / route</span>
          </div>
          <span className="text-[11px] text-[#888880] mt-1 block">
            Valeur engagée : {formatFcfa(totalInTransitValue)}
          </span>
        </div>

        <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#666660] block">
            Total Frais d'Approche
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#111111]">{formatFcfa(totalLandedAll)}</span>
          </div>
          <span className="text-[11px] text-[#888880] mt-1 block">
            Fret maritime, douane Cotonou/Lomé, transitaires
          </span>
        </div>

        <div className="rounded-[20px] border border-black/[0.08] bg-emerald-50/70 border-emerald-200/60 p-5 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
            Règle de Réception & PUMP
          </span>
          <div className="mt-2 text-xs font-bold text-emerald-950">
            Augmentation instantanée du stock
          </div>
          <p className="text-[11px] text-emerald-800 mt-1">
            À la réception : stock physique incrémenté, PUMP recalculé avec les frais d'approche et dépense débitée des Finances.
          </p>
        </div>
      </div>

      {/* Barre de filtres et recherche */}
      <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888880]" />
          <input
            type="text"
            placeholder="Rechercher par N° PO, fournisseur, N° suivi ou article..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {["all", "draft", "ordered", "shipped", "partially_received", "received"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                statusFilter === st
                  ? "bg-[#1F3A26] text-white shadow-xs"
                  : "bg-white border border-black/[0.06] text-[#666660] hover:text-[#111111]"
              )}
            >
              {st === "all" ? "Tous" : PURCHASE_ORDER_STATUS_LABELS[st as PurchaseOrderStatus]}
            </button>
          ))}
        </div>
      </div>

      {/* DISPOSITION EN 2 COLONNES : LISTE DES BONS (1/3) + DÉTAIL DU BON SÉLECTIONNÉ (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ======================================================== */}
        {/* COLONNE GAUCHE : LISTE DES BONS */}
        {/* ======================================================== */}
        <div className="space-y-3">
          {filteredOrders.map((po) => {
            const isSelected = selectedOrder?.id === po.id;
            return (
              <div
                key={po.id}
                onClick={() => setSelectedOrder(po)}
                className={cn(
                  "rounded-[20px] border p-4 cursor-pointer transition-all flex flex-col justify-between space-y-2.5 shadow-2xs",
                  isSelected
                    ? "bg-[#1F3A26] text-white border-black"
                    : "bg-[#FAF8F5] text-[#111111] border-black/[0.08] hover:bg-white"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-black text-xs">{po.poNumber}</span>
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold",
                      isSelected
                        ? "bg-white/20 text-white"
                        : po.status === "received"
                          ? "bg-emerald-100 text-emerald-800"
                          : po.status === "shipped"
                            ? "bg-blue-100 text-blue-800"
                            : po.status === "ordered"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-stone-200 text-stone-700"
                    )}
                  >
                    {PURCHASE_ORDER_STATUS_LABELS[po.status]}
                  </span>
                </div>

                <div>
                  <span className="font-bold text-xs block line-clamp-1">{po.supplierName}</span>
                  <span className="text-[10px] opacity-75">{po.supplierCountry}</span>
                </div>

                <div
                  className={cn(
                    "pt-2 border-t text-[11px] flex items-center justify-between",
                    isSelected ? "border-white/10 text-white/80" : "border-black/[0.06] text-[#666660]"
                  )}
                >
                  <span className="font-bold">{formatFcfa(po.totalCostWithLanded)}</span>
                  <span>{po.items.reduce((s, i) => s + i.quantityOrdered, 0)} pièces</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* COLONNE DROITE : DÉTAIL COMPLET DU BON */}
        {/* ======================================================== */}
        <div className="lg:col-span-2">
          {selectedOrder ? (
            <div className="space-y-5">
              <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xs space-y-5">
                {/* Header du Bon */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-black/[0.08] pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-[#111111]">
                        {selectedOrder.poNumber}
                      </h2>
                      <span
                        className={cn(
                          "text-xs px-2.5 py-0.5 rounded-full font-black",
                          selectedOrder.status === "received"
                            ? "bg-emerald-100 text-emerald-800"
                            : selectedOrder.status === "shipped"
                              ? "bg-blue-100 text-blue-800"
                              : selectedOrder.status === "ordered"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-stone-200 text-stone-700"
                        )}
                      >
                        {PURCHASE_ORDER_STATUS_LABELS[selectedOrder.status]}
                      </span>
                    </div>
                    <p className="text-xs text-[#666660] mt-1">
                      Fournisseur : <span className="font-bold text-[#111111]">{selectedOrder.supplierName}</span> ({selectedOrder.supplierCountry})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedOrder.status !== "received" && (
                      <button
                        onClick={() => handleOpenReceive(selectedOrder)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>Réceptionner le bon</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Métadonnées Expédition & Transit */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-xl border border-black/[0.06] bg-white p-3 space-y-1">
                    <span className="text-[10px] text-[#888880] font-bold block">Date Estimée d'Arrivée</span>
                    <span className="font-bold text-[#111111] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      {selectedOrder.estimatedArrivalDate}
                    </span>
                    {selectedOrder.actualArrivalDate && (
                      <span className="text-[10px] text-emerald-700 font-semibold block">
                        Reçu le : {selectedOrder.actualArrivalDate}
                      </span>
                    )}
                  </div>

                  <div className="rounded-xl border border-black/[0.06] bg-white p-3 space-y-1">
                    <span className="text-[10px] text-[#888880] font-bold block">Transporteur & Suivi</span>
                    <span className="font-bold text-[#111111] flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      {selectedOrder.carrier || "Non spécifié"}
                    </span>
                    {selectedOrder.trackingNumber && (
                      <span className="text-[10px] font-mono text-[#666660] block truncate">
                        N° {selectedOrder.trackingNumber}
                      </span>
                    )}
                  </div>

                  <div className="rounded-xl border border-black/[0.06] bg-white p-3 space-y-1">
                    <span className="text-[10px] text-[#888880] font-bold block">Entrepôt de Destination</span>
                    <span className="font-bold text-[#111111] flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#888880]" />
                      {selectedOrder.destinationLocation}
                    </span>
                  </div>
                </div>

                {/* Bloc Sourcing : Devise Fournisseur, Taux Figé, Agent de Sourcing & Pièces Jointes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-xl border border-black/[0.06] bg-white p-3 space-y-1">
                    <span className="text-[10px] text-[#888880] font-bold block">Devise Fournisseur & Taux</span>
                    <span className="font-bold text-[#111111] flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-purple-600" />
                      CNY (¥) • Taux figé : 1 CNY = 85.5 FCFA
                    </span>
                  </div>

                  <div className="rounded-xl border border-black/[0.06] bg-white p-3 space-y-1">
                    <span className="text-[10px] text-[#888880] font-bold block">Agent de Sourcing Partenaire</span>
                    <span className="font-bold text-[#111111]">
                      {selectedOrder.carrier || "Agent de sourcing non spécifié"}
                    </span>
                  </div>

                  <div className="rounded-xl border border-black/[0.06] bg-white p-3 space-y-1">
                    <span className="text-[10px] text-[#888880] font-bold block">Pièces Jointes & Justificatifs</span>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-blue-600">
                      <span className="flex items-center gap-1 hover:underline cursor-pointer">
                        <Paperclip className="h-3 w-3" />
                        <span>Proforma.pdf</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 hover:underline cursor-pointer">
                        <Paperclip className="h-3 w-3" />
                        <span>SWIFT.pdf</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tableau des Articles & Prorata Frais d'Approche */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#666660] mb-2.5">
                    Articles Commandés & Coût Réel Rendu (PUMP)
                  </h3>

                  <div className="rounded-xl border border-black/[0.08] bg-white overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-black/[0.08] bg-black/[0.02] text-[10px] font-bold uppercase tracking-wider text-[#666660]">
                          <th className="py-2.5 pl-4 pr-2">Article</th>
                          <th className="py-2.5 px-3">Qté Cmd / Reçue</th>
                          <th className="py-2.5 px-3">Coût Brut</th>
                          <th className="py-2.5 px-3 text-blue-800">Part Frais Approche</th>
                          <th className="py-2.5 pr-4 pl-3 text-right font-black text-[#111111]">
                            Coût Unitaire Rendu (PUMP)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.05]">
                        {selectedOrder.items.map((item) => {
                          return (
                            <tr key={item.id} className="hover:bg-black/[0.015]">
                              <td className="py-2.5 pl-4 pr-2">
                                <span className="font-bold text-[#111111] block">{item.productName}</span>
                                <span className="text-[10px] text-[#888880]">{item.sku}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-semibold text-[#111111]">
                                  {item.quantityOrdered} unités
                                </span>
                                {item.quantityReceived > 0 && (
                                  <span className="text-[10px] text-emerald-700 block font-bold">
                                    Reçues : {item.quantityReceived}
                                    {item.quantityDefective > 0 && ` (${item.quantityDefective} défect.)`}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-[#666660]">
                                {formatFcfa(item.unitCost)}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-blue-700">
                                +{formatFcfa(item.landedCostShare)} / un.
                              </td>
                              <td className="py-2.5 pr-4 pl-3 text-right font-black text-emerald-800 text-sm">
                                {formatFcfa(item.finalUnitLandedCost)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Décomposition des Frais d'Approche (Transport, Douane, Transitaire) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl border border-black/[0.06] bg-white p-4 space-y-2">
                    <span className="text-[11px] font-bold text-[#111111] block mb-1">
                      Frais d'Approche Répartis au Prorata
                    </span>
                    <div className="flex justify-between text-[#666660]">
                      <span>Fret maritime / aérien :</span>
                      <span className="font-bold text-[#111111]">
                        {formatFcfa(selectedOrder.landedCosts.shipping)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#666660]">
                      <span>Droits de douane & taxes portuaires :</span>
                      <span className="font-bold text-[#111111]">
                        {formatFcfa(selectedOrder.landedCosts.customs)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#666660]">
                      <span>Commission transitaire / agent d'achat :</span>
                      <span className="font-bold text-[#111111]">
                        {formatFcfa(selectedOrder.landedCosts.agentFee)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-black/[0.06] flex justify-between font-black text-[#111111]">
                      <span>Total frais d'approche :</span>
                      <span className="text-blue-800">
                        {formatFcfa(selectedOrder.landedCosts.totalLanded)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-black/[0.06] bg-[#1F3A26] text-white p-4 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-white/70 block mb-1">
                        Montant Total Engagé
                      </span>
                      <div className="text-2xl font-black text-white">
                        {formatFcfa(selectedOrder.totalCostWithLanded)}
                      </div>
                      <span className="text-[11px] text-white/70 mt-1 block">
                        Dont {formatFcfa(selectedOrder.totalItemsCost)} marchandises brutes.
                      </span>
                    </div>

                    <div className="text-[10px] text-white/60 bg-white/10 p-2 rounded-lg">
                      Enregistré automatiquement dans le journal des sorties Finances COD.
                    </div>
                  </div>
                </div>

                {/* Historique des événements du bon */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#666660] mb-2.5">
                    Historique & Événements
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.events.map((ev) => (
                      <div
                        key={ev.id}
                        className="rounded-xl border border-black/[0.06] bg-white p-3 flex items-start gap-3 text-xs"
                      >
                        <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#111111]">{ev.description}</span>
                            <span className="text-[10px] text-[#888880] font-mono">{ev.date}</span>
                          </div>
                          <span className="text-[10px] text-[#888880]">Par {ev.author}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-12 text-center text-[#666660]">
              Sélectionnez un bon de commande pour afficher ses détails.
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL DE RÉCEPTION DE COMMANDE (PARTIELLE OU TOTALE) */}
      {/* ======================================================== */}
      {isReceiveModalOpen && receivingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-black/[0.08] pb-3">
              <div>
                <h3 className="text-base font-black text-[#111111]">
                  Réceptionner la commande {receivingOrder.poNumber}
                </h3>
                <p className="text-xs text-[#666660] mt-0.5">
                  Déclarez les unités conformes et signalez les éventuels défauts ou casses.
                </p>
              </div>
              <button
                onClick={() => setIsReceiveModalOpen(false)}
                className="p-1 rounded-lg text-[#888880] hover:text-[#111111]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReceipt} className="space-y-4 text-xs">
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {receivingOrder.items.map((item) => {
                  const input = receiveInputs[item.id] || { received: 0, defective: 0 };
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-black/[0.08] bg-white p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#111111]">{item.productName}</span>
                        <span className="text-[10px] text-[#888880] font-mono">
                          Commandé : {item.quantityOrdered}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                            Unités conformes reçues
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={item.quantityOrdered}
                            value={input.received}
                            onChange={(e) =>
                              setReceiveInputs((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...input,
                                  received: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-full px-3 py-1.5 rounded-lg border border-black/[0.08] text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-rose-700 mb-1">
                            Unités défectueuses / cassées
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={input.defective}
                            onChange={(e) =>
                              setReceiveInputs((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...input,
                                  defective: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-full px-3 py-1.5 rounded-lg border border-black/[0.08] text-xs font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Simulation automatique */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-[11px] text-emerald-900 space-y-1">
                <span className="font-bold block">Conséquences automatiques :</span>
                <div>• Stock physique augmenté des unités conformes.</div>
                <div>• Recalcul immédiat du coût moyen pondéré (PUMP) avec frais d'approche.</div>
                <div>• Dépense définitive imputée au module Finances COD.</div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-black/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-black/[0.08] bg-white text-[#666660] font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1F3A26] text-white font-bold hover:bg-[#162B1C]"
                >
                  Valider la réception
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CRÉATION NOUVEAU BON DE COMMANDE */}
      {/* ======================================================== */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/[0.08] pb-3">
              <h3 className="text-base font-black text-[#111111]">
                Nouveau bon de commande fournisseur
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-lg text-[#888880] hover:text-[#111111]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Fournisseur <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newSupplierId}
                    onChange={(e) => setNewSupplierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] font-semibold focus:outline-none"
                  >
                    {MOCK_SUPPLIERS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.country})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Date estimée d'arrivée
                  </label>
                  <input
                    type="text"
                    value={newEstimatedArrival}
                    onChange={(e) => setNewEstimatedArrival(e.target.value)}
                    placeholder="JJ/MM/AAAA"
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Entrepôt de livraison
                </label>
                <select
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] font-semibold focus:outline-none"
                >
                  <option value="Entrepôt Principal Lomé (Zone Portuaire)">
                    Entrepôt Principal Lomé (Zone Portuaire)
                  </option>
                  <option value="Hub Logistique Abidjan (Treichville)">
                    Hub Logistique Abidjan (Treichville)
                  </option>
                  <option value="Hub Cotonou (Haie Vive)">Hub Cotonou (Haie Vive)</option>
                  <option value="Hub Dakar (Yoff)">Hub Dakar (Yoff)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Transporteur / Ligne maritime
                  </label>
                  <input
                    type="text"
                    value={newCarrier}
                    onChange={(e) => setNewCarrier(e.target.value)}
                    placeholder="Ex: Maersk Line, DHL Express"
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    N° de Suivi / B/L
                  </label>
                  <input
                    type="text"
                    value={newTracking}
                    onChange={(e) => setNewTracking(e.target.value)}
                    placeholder="Ex: MSKU90823412"
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Frais d'approche */}
              <div>
                <span className="block text-xs font-bold text-[#111111] mb-2">
                  Frais d'Approche Prévisionnels (FCFA)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-[#888880] block mb-0.5">Fret maritime/air</label>
                    <input
                      type="number"
                      value={newShippingCost}
                      onChange={(e) => setNewShippingCost(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg border border-black/[0.08] text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#888880] block mb-0.5">Douane & Taxes</label>
                    <input
                      type="number"
                      value={newCustomsCost}
                      onChange={(e) => setNewCustomsCost(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg border border-black/[0.08] text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#888880] block mb-0.5">Commission Transitaire</label>
                    <input
                      type="number"
                      value={newAgentFee}
                      onChange={(e) => setNewAgentFee(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg border border-black/[0.08] text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Articles à commander */}
              <div>
                <span className="block text-xs font-bold text-[#111111] mb-2">
                  Articles inclus
                </span>
                <div className="space-y-2">
                  {newItems.map((it, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-black/[0.08] bg-white p-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 font-bold text-[#111111]">{it.productName}</div>
                      <div className="w-24">
                        <label className="text-[10px] text-[#888880] block">Quantité</label>
                        <input
                          type="number"
                          value={it.quantity}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setNewItems((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, quantity: val } : item))
                            );
                          }}
                          className="w-full px-2 py-1 rounded border border-black/[0.08] font-bold text-xs"
                        />
                      </div>
                      <div className="w-28">
                        <label className="text-[10px] text-[#888880] block">Coût unitaire</label>
                        <input
                          type="number"
                          value={it.unitCost}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setNewItems((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, unitCost: val } : item))
                            );
                          }}
                          className="w-full px-2 py-1 rounded border border-black/[0.08] font-bold text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-black/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-black/[0.08] bg-white text-[#666660] font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1F3A26] text-white font-bold hover:bg-[#162B1C]"
                >
                  Créer et Valider le Bon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
