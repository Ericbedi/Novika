"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Truck,
  Plus,
  Search,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  UserCheck,
  Edit,
  DollarSign,
  ChevronRight,
  ShieldAlert,
  Building2,
  ExternalLink,
  Wallet,
  Coins,
  Check,
  X,
  Send,
  Navigation,
} from "lucide-react";
import { MOCK_DELIVERIES, MOCK_RIDERS } from "@/mock-data/deliveries";
import { Delivery, Rider, DeliveryStatus, DELIVERY_STATUS_LABELS } from "@/server/data/types";
import { formatFcfa } from "@/lib/money";
import { whatsappLink } from "@/lib/phone";
import { useApp } from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";

interface DeliveriesClientProps {
  storeSlug: string;
}

export function DeliveriesClient({ storeSlug }: DeliveriesClientProps) {
  const { activeRole } = useApp();
  const [activeTab, setActiveTab] = useState<"deliveries" | "riders">("deliveries");
  const [deliveries, setDeliveries] = useState<Delivery[]>(MOCK_DELIVERIES);
  const [riders, setRiders] = useState<Rider[]>(MOCK_RIDERS);

  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pour le mode Livreur : choix du profil livreur (ex: profil actif)
  const [activeRiderId, setActiveRiderId] = useState<string>("rdr_02");

  // Modale statut échec/retour
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [targetStatus, setTargetStatus] = useState<DeliveryStatus>("delivered");
  const [failureReasonInput, setFailureReasonInput] = useState("");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Modale ajout / modif livreur
  const [isRiderModalOpen, setIsRiderModalOpen] = useState(false);
  const [editingRiderId, setEditingRiderId] = useState<string | null>(null);
  const [riderName, setRiderName] = useState("");
  const [riderPhone, setRiderPhone] = useState("");
  const [riderCity, setRiderCity] = useState("Lomé");
  const [riderZones, setRiderZones] = useState("Agoè, Tokoin, Bè");
  const [riderFee, setRiderFee] = useState<number>(1500);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtrage des livraisons selon la recherche et le statut
  const filteredDeliveries = deliveries.filter((del) => {
    const matchesStatus = statusFilter === "all" || del.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      del.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      del.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      del.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      del.riderName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Livraisons spécifiques pour le Livreur actif
  const currentRider = riders.find((r) => r.id === activeRiderId) || riders[0] || {
    id: "",
    name: "Aucun livreur",
    city: "",
    phone: "",
    country: "TG" as const,
    zonesCovered: [],
    defaultFee: 0,
    activeDeliveriesCount: 0,
    completedDeliveriesCount: 0,
    rating: 5,
    active: false,
  };
  const riderDeliveries = deliveries.filter(
    (d) => d.riderId === activeRiderId || d.riderName === currentRider.name
  );
  const filteredRiderDeliveries = riderDeliveries.filter((del) => {
    return statusFilter === "all" || del.status === statusFilter;
  });

  // Calcul du cash à reverser pour le coursier
  const cashCollectedToRemit = riderDeliveries
    .filter((d) => d.status === "delivered")
    .reduce((sum, d) => sum + d.amountToCollect, 0);

  const cashRemainingToCollect = riderDeliveries
    .filter((d) => d.status === "in_progress" || d.status === "pending")
    .reduce((sum, d) => sum + d.amountToCollect, 0);

  // Groupement par livreur pour la vue complète
  const groupedByRider = riders.map((rider) => ({
    rider,
    items: filteredDeliveries.filter((d) => d.riderId === rider.id),
  }));

  const openStatusModal = (del: Delivery, newStatus: DeliveryStatus) => {
    setSelectedDelivery(del);
    setTargetStatus(newStatus);
    setFailureReasonInput(del.failureReason || "");
    if (newStatus === "failed" || newStatus === "returned") {
      setIsStatusModalOpen(true);
    } else {
      updateDeliveryStatus(del.id, newStatus, undefined);
    }
  };

  const updateDeliveryStatus = (deliveryId: string, status: DeliveryStatus, reason?: string) => {
    const nowTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              status,
              failureReason: reason,
              completedAt: status === "delivered" ? `${nowTime}` : d.completedAt,
            }
          : d
      )
    );
    setIsStatusModalOpen(false);
    showToast(
      status === "delivered"
        ? `Colis marqué LIVRÉ ! Espèces ajoutées au total à reverser.`
        : `Statut mis à jour : ${DELIVERY_STATUS_LABELS[status]}`
    );
  };

  const handleUpdateShippingFee = (deliveryId: string, newFee: number) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === deliveryId ? { ...d, shippingFeePaid: newFee } : d))
    );
    showToast("Frais de livraison ajustés");
  };

  // Dispatch de livraison vers un livreur de l'agence
  const handleDispatchDelivery = (deliveryId: string, newRiderId: string) => {
    const targetRider = riders.find((r) => r.id === newRiderId);
    if (!targetRider) return;
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              riderId: targetRider.id,
              riderName: targetRider.name,
              status: "in_progress",
            }
          : d
      )
    );
    showToast(`Course assignée à ${targetRider.name}`);
  };

  // Gestion des livreurs
  const handleOpenAddRider = () => {
    setEditingRiderId(null);
    setRiderName("");
    setRiderPhone("");
    setRiderCity("Lomé");
    setRiderZones("Agoè, Tokoin, Bè");
    setRiderFee(1500);
    setIsRiderModalOpen(true);
  };

  const handleOpenEditRider = (r: Rider) => {
    setEditingRiderId(r.id);
    setRiderName(r.name);
    setRiderPhone(r.phone);
    setRiderCity(r.city);
    setRiderZones(r.zonesCovered.join(", "));
    setRiderFee(r.defaultFee);
    setIsRiderModalOpen(true);
  };

  const handleSaveRider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!riderName.trim() || !riderPhone.trim()) {
      alert("Veuillez renseigner le nom et le téléphone du livreur.");
      return;
    }

    const zonesArray = riderZones.split(",").map((s) => s.trim()).filter(Boolean);

    if (editingRiderId) {
      setRiders((prev) =>
        prev.map((r) =>
          r.id === editingRiderId
            ? {
                ...r,
                name: riderName,
                phone: riderPhone,
                city: riderCity,
                zonesCovered: zonesArray,
                defaultFee: riderFee,
              }
            : r
        )
      );
      showToast("Livreur mis à jour avec succès !");
    } else {
      const newRider: Rider = {
        id: `rdr_${Date.now()}`,
        name: riderName,
        phone: riderPhone,
        city: riderCity,
        country: riderCity === "Abidjan" ? "CI" : riderCity === "Dakar" ? "SN" : riderCity === "Cotonou" ? "BJ" : "TG",
        zonesCovered: zonesArray,
        defaultFee: riderFee,
        activeDeliveriesCount: 0,
        completedDeliveriesCount: 0,
        rating: 5.0,
        active: true,
      };
      setRiders((prev) => [...prev, newRider]);
      showToast("Nouveau livreur partenaire ajouté !");
    }

    setIsRiderModalOpen(false);
  };

  const statusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case "pending":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">En attente</span>;
      case "in_progress":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 animate-pulse">En cours</span>;
      case "delivered":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Livrée</span>;
      case "failed":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Échec</span>;
      case "returned":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Retour</span>;
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#111111] text-[#FAF8F5] px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. CAS PARTICULIER : VUE MOBILE-FIRST LIVREUR */}
      {/* ======================================================== */}
      {activeRole === "rider" ? (
        <div className="space-y-5 max-w-xl mx-auto">
          {/* Header simplifié Livreur */}
          <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-[#111111] text-[#FAF8F5] flex items-center justify-center font-black text-base shadow-xs">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-black text-[#111111]">{currentRider.name}</h1>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      En Tournée
                    </span>
                  </div>
                  <p className="text-xs text-[#666660]">
                    {currentRider.city} · {currentRider.phone}
                  </p>
                </div>
              </div>

              {/* Sélecteur de profil livreur */}
              <select
                value={activeRiderId}
                onChange={(e) => setActiveRiderId(e.target.value)}
                className="text-xs p-1.5 rounded-xl border border-black/[0.1] bg-white text-[#111111] font-semibold"
                title="Sélectionner un profil coursier"
              >
                {riders.length > 0 ? (
                  riders.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.city})
                    </option>
                  ))
                ) : (
                  <option value="">Aucun livreur</option>
                )}
              </select>
            </div>

            {/* GRANDE CARTE DU CASH À REVERSER */}
            <div className="rounded-2xl bg-[#111111] text-[#FAF8F5] p-5 space-y-2 shadow-md">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                  <Coins className="h-4 w-4 text-amber-400" />
                  Total Espèces Encaissées à Reverser
                </span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-semibold">
                  Tournée du jour
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">
                {formatFcfa(cashCollectedToRemit)}
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10 text-white/80">
                <span>
                  Livrées : {riderDeliveries.filter((d) => d.status === "delivered").length} colis
                </span>
                <span>
                  Restant à encaisser : {formatFcfa(cashRemainingToCollect)} ({riderDeliveries.filter((d) => d.status !== "delivered").length} courses)
                </span>
              </div>
            </div>

            {/* Filtres rapides mobile */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all",
                  statusFilter === "all" ? "bg-[#111111] text-[#FAF8F5]" : "bg-white text-[#666660] border border-black/[0.08]"
                )}
              >
                Toutes ({riderDeliveries.length})
              </button>
              <button
                onClick={() => setStatusFilter("in_progress")}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all",
                  statusFilter === "in_progress" ? "bg-amber-600 text-white" : "bg-white text-[#666660] border border-black/[0.08]"
                )}
              >
                À livrer ({riderDeliveries.filter((d) => d.status === "in_progress" || d.status === "pending").length})
              </button>
              <button
                onClick={() => setStatusFilter("delivered")}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all",
                  statusFilter === "delivered" ? "bg-emerald-600 text-white" : "bg-white text-[#666660] border border-black/[0.08]"
                )}
              >
                Livrées ({riderDeliveries.filter((d) => d.status === "delivered").length})
              </button>
              <button
                onClick={() => setStatusFilter("failed")}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all",
                  statusFilter === "failed" ? "bg-rose-600 text-white" : "bg-white text-[#666660] border border-black/[0.08]"
                )}
              >
                Échecs ({riderDeliveries.filter((d) => d.status === "failed").length})
              </button>
            </div>
          </div>

          {/* LISTE DES CARTES TACTILES DU LIVREUR */}
          <div className="space-y-4">
            {filteredRiderDeliveries.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#FAF8F5] border border-black/[0.06] text-xs text-[#666660]">
                Aucune livraison dans cette catégorie.
              </div>
            ) : (
              filteredRiderDeliveries.map((del) => {
                const waMsg = `Bonjour ${del.customerName}, c'est votre coursier ${del.riderName}. Je suis en route avec votre commande ${del.orderNumber} d'un montant de ${formatFcfa(del.amountToCollect)}. Êtes-vous bien à ${del.deliveryAddress} ?`;
                const waUrl = whatsappLink(del.customerPhone, waMsg);

                return (
                  <div
                    key={del.id}
                    className="rounded-2xl border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4"
                  >
                    {/* Header de la carte */}
                    <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-[#111111]">
                          {del.orderNumber}
                        </span>
                        {statusBadge(del.status)}
                      </div>
                      <span className="text-[11px] font-semibold text-[#888880] flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {del.scheduledTime}
                      </span>
                    </div>

                    {/* Infos Client & Adresse */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-black text-[#111111]">{del.customerName}</h3>
                        <span className="font-mono text-xs font-bold text-[#666660]">{del.customerPhone}</span>
                      </div>
                      <p className="text-xs text-[#111111] font-semibold flex items-start gap-1.5 bg-white p-2.5 rounded-xl border border-black/[0.06]">
                        <MapPin className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                        <span>{del.city} — {del.deliveryAddress}</span>
                      </p>
                      <p className="text-xs text-[#666660] font-medium pt-1">
                        📦 {del.itemsSummary}
                      </p>
                    </div>

                    {/* BLOC MONTANT À ENCAISSER */}
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-950 uppercase">
                        Montant à encaisser (Espèces) :
                      </span>
                      <span className="text-lg font-black text-amber-900">
                        {formatFcfa(del.amountToCollect)}
                      </span>
                    </div>

                    {del.failureReason && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>Motif d'échec : {del.failureReason}</span>
                      </div>
                    )}

                    {/* GROS BOUTONS D'APPEL ET WHATSAPP */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>WhatsApp</span>
                      </a>
                      <a
                        href={`tel:${del.customerPhone}`}
                        className="py-3 px-4 rounded-xl bg-[#111111] hover:bg-black text-[#FAF8F5] font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        <span>Appeler</span>
                      </a>
                    </div>

                    {/* BOUTONS DE VALIDATION DU STATUT */}
                    {del.status !== "delivered" ? (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-black/[0.06]">
                        <button
                          type="button"
                          onClick={() => updateDeliveryStatus(del.id, "delivered")}
                          className="py-3 px-4 rounded-xl bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                          <span>Livrée (Cash Reçu)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDelivery(del);
                            setTargetStatus("failed");
                            setFailureReasonInput("");
                            setIsStatusModalOpen(true);
                          }}
                          className="py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <XCircle className="h-4 w-4 text-rose-600" />
                          <span>Échec de livraison</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Colis livré avec succès ({del.completedAt || "Aujourd'hui"})
                        </span>
                        <span className="text-[11px] text-emerald-800">Espèces sécurisées</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* 2. VUE COMPLÈTE (PROPRIÉTAIRE, ADMIN OU AGENCE) */
        /* ======================================================== */
        <div className="space-y-6">
          {/* Bannière RLS Mode Agence de livraison */}
          {activeRole === "agency" && (
            <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-blue-950">
                      Espace Agence Partenaire — Flash Colis Express
                    </h2>
                    <p className="text-xs text-blue-800">
                      Gérez les colis confiés par les boutiques partenaires, répartissez les tournées à vos coursiers et validez vos reversements.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/app/${storeSlug}/finances/reversements`}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    <span>Mes Reversements</span>
                  </Link>
                  <Link
                    href={`/app/${storeSlug}/livraisons/tarifs`}
                    className="px-3.5 py-1.5 rounded-xl border border-blue-300 bg-white text-blue-900 text-xs font-bold hover:bg-blue-50 transition-colors flex items-center gap-1.5"
                  >
                    <span>Grille Tarifaire</span>
                  </Link>
                </div>
              </div>

              {/* 4 KPIs Agence */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-blue-200/60 text-xs">
                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100">
                  <span className="text-[10px] text-blue-800 uppercase block font-semibold">Taux de livraison</span>
                  <span className="text-base font-black text-blue-950">88.5%</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100">
                  <span className="text-[10px] text-blue-800 uppercase block font-semibold">Frais dus à l'agence</span>
                  <span className="text-base font-black text-blue-950">125 000 FCFA</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100">
                  <span className="text-[10px] text-blue-800 uppercase block font-semibold">Espèces à reverser</span>
                  <span className="text-base font-black text-amber-700">1 450 000 FCFA</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100">
                  <span className="text-[10px] text-blue-800 uppercase block font-semibold">Livreurs affiliés</span>
                  <span className="text-base font-black text-blue-950">8 coursiers</span>
                </div>
              </div>
            </div>
          )}

          {/* En-tête standard */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
                  Logistique COD Afrique de l'Ouest
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
                Livraisons & Tournées
              </h1>
              <p className="text-xs text-[#666660] mt-0.5">
                Suivez les courses du jour groupées par livreur, gérez les zones et encaissez le cash en temps réel.
              </p>
            </div>

            {/* Onglets et Liens de navigation logistique */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-black/[0.08] bg-[#FAF8F5] p-1 shadow-2xs self-start sm:self-auto">
              <button
                onClick={() => setActiveTab("deliveries")}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === "deliveries"
                    ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                    : "text-[#666660] hover:text-[#111111]"
                )}
              >
                <Truck className="h-3.5 w-3.5" />
                <span>Tournées & Livraisons ({deliveries.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("riders")}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === "riders"
                    ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                    : "text-[#666660] hover:text-[#111111]"
                )}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Livreurs & Tarifs ({riders.length})</span>
              </button>
              <Link
                href={`/app/${storeSlug}/livraisons/tarifs`}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#666660] hover:text-[#111111] hover:bg-black/[0.04] transition-all flex items-center gap-1"
                title="Consulter et ajuster la grille tarifaire par pays et agence"
              >
                <span>Tarifs</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link
                href={`/app/${storeSlug}/finances/reversements`}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#666660] hover:text-[#111111] hover:bg-black/[0.04] transition-all flex items-center gap-1"
                title="Consulter et valider les reversements d'espèces"
              >
                <span>Reversements</span>
                <Coins className="h-3 w-3 text-amber-600" />
              </Link>
            </div>
          </div>

          {/* VUE 1 : TOURNÉES & LIVRAISONS DU JOUR */}
          {activeTab === "deliveries" && (
            <div className="space-y-6">
              {/* Barre de filtres et recherche */}
              <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-3 sm:p-4 shadow-2xs space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    <button
                      onClick={() => setStatusFilter("all")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                        statusFilter === "all" ? "bg-[#111111] text-[#FAF8F5]" : "bg-white text-[#666660] border border-black/[0.06]"
                      )}
                    >
                      Toutes ({deliveries.length})
                    </button>
                    <button
                      onClick={() => setStatusFilter("in_progress")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                        statusFilter === "in_progress" ? "bg-amber-600 text-white" : "bg-white text-[#666660] border border-black/[0.06]"
                      )}
                    >
                      En cours ({deliveries.filter((d) => d.status === "in_progress").length})
                    </button>
                    <button
                      onClick={() => setStatusFilter("delivered")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                        statusFilter === "delivered" ? "bg-emerald-600 text-white" : "bg-white text-[#666660] border border-black/[0.06]"
                      )}
                    >
                      Livrées ({deliveries.filter((d) => d.status === "delivered").length})
                    </button>
                    <button
                      onClick={() => setStatusFilter("failed")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                        statusFilter === "failed" ? "bg-rose-600 text-white" : "bg-white text-[#666660] border border-black/[0.06]"
                      )}
                    >
                      Échecs ({deliveries.filter((d) => d.status === "failed").length})
                    </button>
                    <button
                      onClick={() => setStatusFilter("returned")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                        statusFilter === "returned" ? "bg-purple-600 text-white" : "bg-white text-[#666660] border border-black/[0.06]"
                      )}
                    >
                      Retours ({deliveries.filter((d) => d.status === "returned").length})
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#888880]" />
                    <input
                      type="text"
                      placeholder="Rechercher livraison, client, ville..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none w-full sm:w-64"
                    />
                  </div>
                </div>
              </div>

              {/* LISTE DES LIVRAISONS GROUPÉES PAR LIVREUR */}
              <div className="space-y-6">
                {deliveries.length === 0 ? (
                  <div className="p-12 text-center rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] text-xs text-[#888880] space-y-2">
                    <p className="font-bold text-[#111111]">Aucune course ni tournée en cours.</p>
                    <p>Vos commandes prêtes à livrer apparaîtront ici dès leur expédition.</p>
                  </div>
                ) : (
                  groupedByRider.map(({ rider, items }) => {
                  if (items.length === 0 && searchQuery !== "") return null;

                  const totalToCollect = items
                    .filter((i) => i.status !== "failed" && i.status !== "returned")
                    .reduce((acc, curr) => acc + curr.amountToCollect, 0);

                  const deliveredAmount = items
                    .filter((i) => i.status === "delivered")
                    .reduce((acc, curr) => acc + curr.amountToCollect, 0);

                  return (
                    <div
                      key={rider.id}
                      className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4"
                    >
                      {/* En-tête du groupe Livreur */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.06]">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-[#111111] text-[#FAF8F5] flex items-center justify-center font-bold text-sm">
                            <Truck className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-sm text-[#111111]">{rider.name}</h3>
                              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-black/[0.05] text-[#111111]">
                                {rider.city} ({items.length} colis)
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-[#888880] mt-0.5">
                              <span>Tél : {rider.phone}</span>
                              <span>• Forfait : {formatFcfa(rider.defaultFee)} / course</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <div className="text-right text-xs">
                            <span className="text-[10px] text-[#888880] uppercase block">Espèces encaissées</span>
                            <span className="font-black text-emerald-700">{formatFcfa(deliveredAmount)}</span>
                          </div>
                          <div className="text-right text-xs border-l border-black/[0.08] pl-3">
                            <span className="text-[10px] text-[#888880] uppercase block">Total attendu</span>
                            <span className="font-black text-[#111111]">{formatFcfa(totalToCollect)}</span>
                          </div>
                          <a
                            href={`tel:${rider.phone}`}
                            className="p-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] hover:bg-[#FAF8F5] transition-all"
                            title="Appeler le coursier"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Lignes de livraisons pour ce coursier */}
                      {items.length === 0 ? (
                        <div className="py-6 text-center text-xs text-[#888880] italic">
                          Aucune livraison en cours pour {rider.name} dans ce filtre.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {items.map((del) => {
                            const waMsg = `Bonjour ${del.customerName}, le livreur ${del.riderName} est en route avec votre colis ${del.orderNumber} d'un montant de ${formatFcfa(del.amountToCollect)}. Êtes-vous bien disponible à ${del.deliveryAddress} ?`;
                            const waUrl = whatsappLink(del.customerPhone, waMsg);

                            return (
                              <div
                                key={del.id}
                                className="p-4 rounded-2xl bg-white border border-black/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-black/[0.15] transition-all"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2.5">
                                    <span className="font-mono text-xs font-black text-[#111111]">
                                      {del.orderNumber}
                                    </span>
                                    {statusBadge(del.status)}
                                    <span className="text-[11px] text-[#888880] flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {del.scheduledTime}
                                    </span>
                                  </div>

                                  <div className="text-xs">
                                    <span className="font-bold text-[#111111]">{del.customerName}</span>
                                    <span className="text-[#666660]"> ({del.customerPhone})</span>
                                    <p className="text-[11px] text-[#888880] flex items-center gap-1 mt-0.5">
                                      <MapPin className="h-3 w-3 shrink-0" />
                                      {del.city} — {del.deliveryAddress}
                                    </p>
                                    <p className="text-[11px] font-medium text-[#111111] mt-0.5">
                                      {del.itemsSummary}
                                    </p>
                                  </div>

                                  {del.failureReason && (
                                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-medium flex items-center gap-1.5 mt-1">
                                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                      <span>Motif d'échec : {del.failureReason}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col md:items-end justify-between gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-black/[0.06]">
                                  <div className="text-right">
                                    <span className="text-[10px] text-[#888880] block">À encaisser (Espèces)</span>
                                    <span className="text-sm font-black text-[#111111]">
                                      {formatFcfa(del.amountToCollect)}
                                    </span>
                                  </div>

                                  {/* Frais de livraison payés */}
                                  <div className="flex items-center gap-1.5 text-[10px] text-[#888880]">
                                    <span>Frais coursier :</span>
                                    <input
                                      type="number"
                                      step="500"
                                      value={del.shippingFeePaid}
                                      onChange={(e) => handleUpdateShippingFee(del.id, Number(e.target.value) || 0)}
                                      className="w-16 p-1 text-right font-mono font-bold rounded-lg border border-black/[0.08] text-[#111111] focus:outline-none"
                                    />
                                    <span>FCFA</span>
                                  </div>

                                  {/* Actions Agence / Propriétaire */}
                                  <div className="flex items-center gap-1.5">
                                    {/* Dispatch agence : réassigner à un autre coursier */}
                                    {activeRole === "agency" && (
                                      <select
                                        value={del.riderId}
                                        onChange={(e) => handleDispatchDelivery(del.id, e.target.value)}
                                        className="p-1 text-[11px] rounded-lg border border-blue-200 bg-blue-50 text-blue-900 font-bold focus:outline-none"
                                        title="Réassigner à un autre livreur de l'agence"
                                      >
                                        {riders.map((r) => (
                                          <option key={r.id} value={r.id}>
                                            Transférer à {r.name.split(" ")[0]}
                                          </option>
                                        ))}
                                      </select>
                                    )}

                                    <a
                                      href={waUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg border border-black/[0.08] bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
                                      title="WhatsApp Client"
                                    >
                                      <MessageCircle className="h-3.5 w-3.5" />
                                    </a>

                                    <a
                                      href={`tel:${del.customerPhone}`}
                                      className="p-1.5 rounded-lg border border-black/[0.08] bg-white text-[#111111] hover:bg-[#FAF8F5] transition-colors"
                                      title="Appeler Client"
                                    >
                                      <Phone className="h-3.5 w-3.5" />
                                    </a>

                                    <select
                                      value={del.status}
                                      onChange={(e) => openStatusModal(del, e.target.value as DeliveryStatus)}
                                      className="p-1.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] font-bold focus:outline-none cursor-pointer"
                                    >
                                      <option value="pending">En attente</option>
                                      <option value="in_progress">En cours</option>
                                      <option value="delivered">Livrée (Espèces reçues)</option>
                                      <option value="failed">Échec de livraison</option>
                                      <option value="returned">Retour expéditeur</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              </div>
            </div>
          )}

          {/* VUE 2 : LIVREURS, AGENCES & FLOTTE */}
          {activeTab === "riders" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-[#666660]">
                  Gérez vos coursiers internes et agences logistiques partenaires par pays et par zone.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddRider}
                  className="px-3.5 py-2 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Ajouter un livreur</span>
                </button>
              </div>

              {riders.length === 0 ? (
                <div className="p-12 text-center rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] text-xs text-[#888880] space-y-2">
                  <p className="font-bold text-[#111111]">Aucun livreur partenaire enregistré.</p>
                  <p>Ajoutez vos coursiers ou connectez vos agences logistiques pour distribuer vos commandes.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {riders.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-[22px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4 hover:border-black/[0.15] transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-[#111111] text-[#FAF8F5] flex items-center justify-center font-black text-sm">
                          {r.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-[#111111]">{r.name}</h4>
                          <p className="text-xs text-[#666660]">{r.city} ({r.country}) · {r.phone}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenEditRider(r)}
                        className="p-1.5 rounded-lg border border-black/[0.08] bg-white text-[#111111] hover:bg-[#FAF8F5]"
                        title="Modifier le livreur"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/[0.06] text-center text-xs">
                      <div className="p-2 rounded-xl bg-white border border-black/[0.06]">
                        <span className="text-[10px] text-[#888880] block">Tarif / course</span>
                        <span className="font-black text-[#111111]">{formatFcfa(r.defaultFee)}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-black/[0.06]">
                        <span className="text-[10px] text-[#888880] block">En cours</span>
                        <span className="font-black text-amber-700">{r.activeDeliveriesCount} colis</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-black/[0.06]">
                        <span className="text-[10px] text-[#888880] block">Total livrés</span>
                        <span className="font-black text-emerald-700">{r.completedDeliveriesCount}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#888880] uppercase font-bold block mb-1">
                        Zones de livraison couvertes
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {r.zonesCovered.map((z, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white border border-black/[0.08] text-[#111111]"
                          >
                            {z}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE STATUT ÉCHEC AVEC MOTIF OBLIGATOIRE */}
      {/* ======================================================== */}
      {isStatusModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="h-10 w-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#111111]">
                  Déclarer un échec de livraison
                </h3>
                <p className="text-xs text-[#666660]">
                  Commande #{selectedDelivery.orderNumber} · {selectedDelivery.customerName}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#111111]">
                Motif obligatoire de non-livraison :
              </label>

              {/* Boutons de motifs fréquents COD Afrique */}
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  "Client injoignable après 3 appels répétés",
                  "Refus du colis au déballage / changement d'avis",
                  "Client absent au lieu de rendez-vous",
                  "Adresse erronée / zone inaccessible en moto",
                  "Client demande un report à demain",
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setFailureReasonInput(reason)}
                    className={cn(
                      "p-2.5 rounded-xl text-left text-xs font-medium border transition-all cursor-pointer",
                      failureReasonInput === reason
                        ? "bg-[#111111] text-[#FAF8F5] border-[#111111]"
                        : "bg-white text-[#333333] border-black/[0.08] hover:bg-black/[0.02]"
                    )}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                value={failureReasonInput}
                onChange={(e) => setFailureReasonInput(e.target.value)}
                placeholder="Précisez ou personnalisez le motif..."
                className="w-full p-2.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#666660]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!failureReasonInput.trim()) {
                    alert("Le motif est obligatoire pour documenter l'incident de livraison.");
                    return;
                  }
                  updateDeliveryStatus(selectedDelivery.id, targetStatus, failureReasonInput);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirmer l'échec
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE AJOUT / MODIF LIVREUR */}
      {/* ======================================================== */}
      {isRiderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-[#111111]">
              {editingRiderId ? "Modifier le livreur" : "Ajouter un livreur partenaire"}
            </h3>

            <form onSubmit={handleSaveRider} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  Nom du livreur ou de l'agence <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  placeholder="Ex: Nom du livreur"
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  Numéro de téléphone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={riderPhone}
                  onChange={(e) => setRiderPhone(e.target.value)}
                  placeholder="+22890556677"
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white font-mono text-[#111111] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#111111] mb-1">Ville</label>
                  <select
                    value={riderCity}
                    onChange={(e) => setRiderCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                  >
                    <option value="Lomé">Lomé (Togo)</option>
                    <option value="Abidjan">Abidjan (CI)</option>
                    <option value="Dakar">Dakar (Sénégal)</option>
                    <option value="Cotonou">Cotonou (Bénin)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#111111] mb-1">Tarif / course (FCFA)</label>
                  <input
                    type="number"
                    step="500"
                    required
                    value={riderFee}
                    onChange={(e) => setRiderFee(Number(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white font-bold text-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  Zones couvertes (séparées par des virgules)
                </label>
                <input
                  type="text"
                  value={riderZones}
                  onChange={(e) => setRiderZones(e.target.value)}
                  placeholder="Ex: Agoè, Tokoin, Bè, Adidogomé"
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsRiderModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black cursor-pointer shadow-2xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
