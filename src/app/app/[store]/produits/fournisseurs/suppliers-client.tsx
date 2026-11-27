"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Package,
  TrendingUp,
  ShieldAlert,
  Edit,
  ExternalLink,
  MessageCircle,
  X,
  FileText,
} from "lucide-react";
import { MOCK_SUPPLIERS } from "@/mock-data/suppliers";
import { Supplier, SupplierProduct } from "@/server/data/types";
import { formatFcfa } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/layout/app-shell";
import { ProductsNavTabs } from "@/components/products/products-nav-tabs";

interface SuppliersClientProps {
  storeSlug: string;
}

export function SuppliersClient({ storeSlug }: SuppliersClientProps) {
  const { activeRole } = useApp();
  const isCloser = activeRole === "closer";
  const isRider = activeRole === "rider";
  const isRestricted = isCloser || isRider;

  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(MOCK_SUPPLIERS[0] || null);

  // Modal d'ajout / modification
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [country, setCountry] = useState("Chine 🇨🇳");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState<"XOF" | "USD" | "EUR" | "CNY">("USD");
  const [leadTimeDays, setLeadTimeDays] = useState<number>(15);
  const [moq, setMoq] = useState<number>(50);
  const [paymentTerms, setPaymentTerms] = useState("");
  const [notes, setNotes] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Liste des pays uniques
  const uniqueCountries = useMemo(() => {
    return Array.from(new Set(suppliers.map((s) => s.country)));
  }, [suppliers]);

  // Filtrage
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchSearch =
        searchQuery === "" ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.productsSupplied || []).some((p) => p.productName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCountry = countryFilter === "all" || s.country === countryFilter;
      return matchSearch && matchCountry;
    });
  }, [suppliers, searchQuery, countryFilter]);

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
              Les fiches fournisseurs, contrats d'approvisionnement et prix d'achat unitaires sont réservés aux administrateurs et au propriétaire de la boutique.
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

  // Ouvrir modal création
  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setName("");
    setCountry("Chine 🇨🇳");
    setContactName("");
    setPhone("");
    setEmail("");
    setCurrency("USD");
    setLeadTimeDays(15);
    setMoq(50);
    setPaymentTerms("30% acompte, 70% à l'expédition");
    setNotes("");
    setIsModalOpen(true);
  };

  // Ouvrir modal édition
  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setName(sup.name);
    setCountry(sup.country);
    setContactName(sup.contactName);
    setPhone(sup.phone);
    setEmail(sup.email);
    setCurrency(sup.currency);
    setLeadTimeDays(sup.leadTimeDays);
    setMoq(sup.moq);
    setPaymentTerms(sup.paymentTerms);
    setNotes(sup.notes || "");
    setIsModalOpen(true);
  };

  // Enregistrer fournisseur
  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSupplier) {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === editingSupplier.id
            ? {
                ...s,
                name,
                country,
                contactName,
                phone,
                email,
                currency,
                leadTimeDays,
                moq,
                paymentTerms,
                notes,
              }
            : s
        )
      );
      if (selectedSupplier?.id === editingSupplier.id) {
        setSelectedSupplier((prev) =>
          prev
            ? {
                ...prev,
                name,
                country,
                contactName,
                phone,
                email,
                currency,
                leadTimeDays,
                moq,
                paymentTerms,
                notes,
              }
            : null
        );
      }
      showToast(`Fournisseur "${name}" mis à jour`);
    } else {
      const newSup: Supplier = {
        id: `sup_${Date.now()}`,
        name,
        country,
        countryCode: country.includes("Chine") ? "CN" : country.includes("Ivoire") ? "CI" : "TG",
        contactName,
        phone,
        email,
        currency,
        leadTimeDays,
        moq,
        paymentTerms,
        notes,
        scorecard: {
          actualLeadTimeDays: leadTimeDays,
          defectRatePercent: 0,
          totalOrdersCount: 0,
          lastPurchaseDate: "Nouveau",
        },
        productsSupplied: [],
      };
      setSuppliers((prev) => [newSup, ...prev]);
      setSelectedSupplier(newSup);
      showToast(`Fournisseur "${name}" ajouté avec succès`);
    }

    setIsModalOpen(false);
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
              Approvisionnement & Sourcing
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#1F3A26]/[0.05] text-[#111111]">
              {suppliers.length} fournisseurs actifs
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            Fournisseurs
          </h1>
          <p className="text-xs text-[#666660] mt-0.5">
            Répertoire d'usines et grossistes, délais annoncés vs réels, taux de défauts et négociation des prix d'achat.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F3A26] text-[#FAF8F5] text-xs font-bold hover:bg-[#162B1C] transition-all shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau fournisseur</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DISPOSITION EN 2 COLONNES : LISTE GAUCHE (1/3) + FICHE DÉTAILLÉE DROITE (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ======================================================== */}
        {/* COLONNE GAUCHE : RECHERCHE ET LISTE DES FOURNISSEURS */}
        {/* ======================================================== */}
        <div className="space-y-3">
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-3 shadow-2xs space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#888880]" />
              <input
                type="text"
                placeholder="Rechercher par nom, pays..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
              />
            </div>

            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-1.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
            >
              <option value="all">Tous les pays d'origine</option>
              {uniqueCountries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2.5">
            {filteredSuppliers.map((sup) => {
              const isSelected = selectedSupplier?.id === sup.id;
              return (
                <div
                  key={sup.id}
                  onClick={() => setSelectedSupplier(sup)}
                  className={cn(
                    "rounded-[20px] border p-4 cursor-pointer transition-all flex flex-col justify-between space-y-2.5 shadow-2xs",
                    isSelected
                      ? "bg-[#1F3A26] text-white border-black"
                      : "bg-[#FAF8F5] text-[#111111] border-black/[0.08] hover:bg-white"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs line-clamp-1">{sup.name}</span>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap",
                        isSelected ? "bg-white/20 text-white" : "bg-black/[0.05] text-[#666660]"
                      )}
                    >
                      {sup.country}
                    </span>
                  </div>

                  <div className="text-[11px] opacity-80 flex items-center justify-between">
                    <span>Contact : {sup.contactName}</span>
                    <span className="font-mono font-bold">{sup.leadTimeDays}j délai</span>
                  </div>

                  <div
                    className={cn(
                      "pt-2 border-t text-[10px] flex items-center justify-between",
                      isSelected ? "border-white/10 text-white/70" : "border-black/[0.06] text-[#888880]"
                    )}
                  >
                    <span>{(sup.productsSupplied || []).length} article(s)</span>
                    <span>Taux défaut : {sup.scorecard.defectRatePercent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLONNE DROITE : FICHE DU FOURNISSEUR SÉLECTIONNÉ */}
        {/* ======================================================== */}
        <div className="lg:col-span-2">
          {selectedSupplier ? (
            <div className="space-y-5">
              {/* Carte Principale */}
              <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-black/[0.08] pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{selectedSupplier.country}</span>
                      <h2 className="text-xl font-black text-[#111111]">
                        {selectedSupplier.name}
                      </h2>
                    </div>
                    <p className="text-xs text-[#666660] mt-1">
                      Contact référent : <span className="font-bold text-[#111111]">{selectedSupplier.contactName}</span> · Devise : {selectedSupplier.currency}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Lien WhatsApp direct */}
                    <a
                      href={`https://wa.me/${selectedSupplier.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
                      title="Ouvrir la conversation WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp direct</span>
                    </a>

                    <button
                      onClick={() => handleOpenEdit(selectedSupplier)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-black/[0.03] transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Modifier</span>
                    </button>
                  </div>
                </div>

                {/* Scorecard de performance */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#666660] mb-3">
                    Tableau de Bord & Performance Réelle
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-black/[0.06] bg-white p-3">
                      <span className="text-[10px] text-[#888880] font-bold block">Délai Annoncé</span>
                      <span className="text-lg font-black text-[#111111]">{selectedSupplier.leadTimeDays} jours</span>
                      <span className="text-[10px] text-[#888880] block">contractuel</span>
                    </div>

                    <div className="rounded-xl border border-black/[0.06] bg-white p-3">
                      <span className="text-[10px] text-[#888880] font-bold block">Délai Réel Moyen</span>
                      <span
                        className={cn(
                          "text-lg font-black",
                          selectedSupplier.scorecard.actualLeadTimeDays > selectedSupplier.leadTimeDays
                            ? "text-amber-700"
                            : "text-emerald-700"
                        )}
                      >
                        {selectedSupplier.scorecard.actualLeadTimeDays} jours
                      </span>
                      <span className="text-[10px] text-[#888880] block">constaté à Lomé</span>
                    </div>

                    <div className="rounded-xl border border-black/[0.06] bg-white p-3">
                      <span className="text-[10px] text-[#888880] font-bold block">Taux de Défauts</span>
                      <span
                        className={cn(
                          "text-lg font-black",
                          selectedSupplier.scorecard.defectRatePercent > 2 ? "text-rose-600" : "text-emerald-700"
                        )}
                      >
                        {selectedSupplier.scorecard.defectRatePercent}%
                      </span>
                      <span className="text-[10px] text-[#888880] block">&lt; 2% toléré</span>
                    </div>

                    <div className="rounded-xl border border-black/[0.06] bg-white p-3">
                      <span className="text-[10px] text-[#888880] font-bold block">Total Commandes</span>
                      <span className="text-lg font-black text-[#111111]">
                        {selectedSupplier.scorecard.totalOrdersCount}
                      </span>
                      <span className="text-[10px] text-[#888880] block">depuis l'ouverture</span>
                    </div>
                  </div>
                </div>

                {/* Coordonnées & Conditions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl border border-black/[0.06] bg-white p-4 space-y-2">
                    <span className="text-[11px] font-bold text-[#111111] block mb-1">
                      Coordonnées & Modalités
                    </span>
                    <div className="flex items-center gap-2 text-[#666660]">
                      <Phone className="w-3.5 h-3.5 text-[#888880]" />
                      <span className="font-mono text-[#111111]">{selectedSupplier.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#666660]">
                      <Mail className="w-3.5 h-3.5 text-[#888880]" />
                      <span className="text-[#111111]">{selectedSupplier.email}</span>
                    </div>
                    <div className="pt-2 border-t border-black/[0.05] text-[#666660]">
                      <span className="font-bold text-[#111111] block">Quantité Minimale (MOQ) :</span>
                      <span>{selectedSupplier.moq} unités par commande</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-black/[0.06] bg-white p-4 space-y-2">
                    <span className="text-[11px] font-bold text-[#111111] block mb-1">
                      Conditions de Paiement & Expédition
                    </span>
                    <p className="text-[#666660] text-xs">
                      {selectedSupplier.paymentTerms}
                    </p>
                    <div className="pt-2 border-t border-black/[0.05] text-[#666660]">
                      <span className="font-bold text-[#111111] block">Notes logistiques :</span>
                      <span className="text-[11px]">{selectedSupplier.notes}</span>
                    </div>
                  </div>
                </div>

                {/* Tableau des articles fournis */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#666660]">
                      Articles Fournis ({(selectedSupplier.productsSupplied || []).length})
                    </h3>
                    <Link
                      href={`/app/${storeSlug}/produits/achats?action=new&supplier=${selectedSupplier.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1F3A26] text-white text-xs font-bold hover:bg-[#162B1C] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Commander à ce fournisseur</span>
                    </Link>
                  </div>

                  <div className="rounded-xl border border-black/[0.08] bg-white overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-black/[0.08] bg-black/[0.02] text-[10px] font-bold uppercase tracking-wider text-[#666660]">
                          <th className="py-2.5 pl-4 pr-2">Article</th>
                          <th className="py-2.5 px-3">Prix d'Achat Unitaire</th>
                          <th className="py-2.5 pr-4 pl-2 text-right">MOQ Produit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.05]">
                        {(selectedSupplier.productsSupplied || []).map((prod) => (
                          <tr key={prod.productId} className="hover:bg-black/[0.015]">
                            <td className="py-2.5 pl-4 pr-2 font-bold text-[#111111]">
                              {prod.productName}
                            </td>
                            <td className="py-2.5 px-3 font-black text-emerald-800">
                              {formatFcfa(prod.unitCost)}
                            </td>
                            <td className="py-2.5 pr-4 pl-2 text-right text-[#666660] font-semibold">
                              {prod.moq} pièces
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-12 text-center text-[#666660]">
              Sélectionnez un fournisseur pour afficher sa fiche complète.
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL CRÉATION / ÉDITION FOURNISSEUR */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-black/[0.08] pb-3">
              <h3 className="text-base font-black text-[#111111]">
                {editingSupplier ? "Modifier le fournisseur" : "Nouveau fournisseur"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#888880] hover:text-[#111111]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Nom de l'entreprise fournisseur <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Laboratoires Cosmétiques Internationaux"
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Pays d'origine
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] font-semibold focus:outline-none"
                  >
                    <option value="Chine 🇨🇳">Chine 🇨🇳</option>
                    <option value="Côte d'Ivoire 🇨🇮">Côte d'Ivoire 🇨🇮</option>
                    <option value="Togo 🇹🇬">Togo 🇹🇬</option>
                    <option value="Bénin 🇧🇯">Bénin 🇧🇯</option>
                    <option value="Sénégal 🇸🇳">Sénégal 🇸🇳</option>
                    <option value="Turquie 🇹🇷">Turquie 🇹🇷</option>
                    <option value="France 🇫🇷">France 🇫🇷</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Devise de paiement
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] font-semibold focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="XOF">FCFA (XOF)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Nom du contact
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ex: Kevin Zhang"
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Téléphone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+8613800138000"
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Délai annoncé (jours)
                  </label>
                  <input
                    type="number"
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Quantité minimale (MOQ)
                  </label>
                  <input
                    type="number"
                    value={moq}
                    onChange={(e) => setMoq(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Conditions de paiement
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="Ex: 30% acompte, 70% avant embarquement maritime"
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Notes / Remarques d'expédition
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Port de chargement, transitaire habituel..."
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-black/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-black/[0.08] bg-white text-[#666660] font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1F3A26] text-white font-bold hover:bg-[#162B1C]"
                >
                  {editingSupplier ? "Mettre à jour" : "Créer le fournisseur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
