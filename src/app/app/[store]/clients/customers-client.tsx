"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle2,
  Edit,
  Trash2,
  ShoppingBag,
  ExternalLink,
  Crown,
  History,
} from "lucide-react";
import { MOCK_CUSTOMERS } from "@/mock-data/customers";
import { Customer } from "@/server/data/types";
import { formatFcfa } from "@/lib/money";
import { whatsappLink } from "@/lib/phone";
import { cn } from "@/lib/utils";

interface CustomersClientProps {
  storeSlug: string;
}

export function CustomersClient({ storeSlug }: CustomersClientProps) {
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "vip" | "regular" | "new">("all");

  // Modale client (Ajout / Modification)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<"TG" | "CI" | "SN" | "BJ">("CI");
  const [city, setCity] = useState("Abidjan");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Modale Historique des commandes d'un client
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<Customer | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredCustomers = customers.filter((c) => {
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchSearch =
      searchQuery === "" ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalRevenue = customers.reduce((acc, c) => acc + c.totalSpent, 0);

  const handleOpenAdd = () => {
    setEditingCustomerId(null);
    setName("");
    setPhone("");
    setCountry("CI");
    setCity("Abidjan");
    setAddress("");
    setNotes("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomerId(c.id);
    setName(c.name);
    setPhone(c.phone);
    setCountry(c.country);
    setCity(c.city);
    setAddress(c.address);
    setNotes(c.notes || "");
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer ce client du carnet d'adresses ?")) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      showToast("Client supprimé avec succès.");
    }
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      alert("Veuillez remplir le nom, le téléphone et l'adresse.");
      return;
    }

    if (editingCustomerId) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === editingCustomerId
            ? {
                ...c,
                name,
                phone,
                country,
                city,
                address,
                notes,
              }
            : c
        )
      );
      showToast("Coordonnées du client mises à jour !");
    } else {
      const newCust: Customer = {
        id: `cst_${Date.now()}`,
        name,
        phone,
        country,
        city,
        address,
        ordersCount: 0,
        totalSpent: 0,
        lastOrderDate: "Aujourd'hui",
        status: "new",
        notes,
      };
      setCustomers((prev) => [newCust, ...prev]);
      showToast("Nouveau client ajouté au carnet d'adresses !");
    }

    setIsModalOpen(false);
  };

  const statusBadge = (status: "vip" | "regular" | "new") => {
    switch (status) {
      case "vip":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
            <Crown className="h-3 w-3 text-amber-700" />
            <span>VIP</span>
          </span>
        );
      case "regular":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900">
            Fidèle
          </span>
        );
      case "new":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">
            Nouveau
          </span>
        );
    }
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
              Base de Données Vendeur
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            Clients & Carnet d'Adresses
          </h1>
          <p className="text-xs text-[#666660] mt-0.5">
            Historique des commandes, fidélité clients, coordonnées précises et adresses de livraison.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau client</span>
        </button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                statusFilter === "all" ? "bg-[#111111] text-[#FAF8F5]" : "bg-white text-[#666660] border border-black/[0.06]"
              )}
            >
              Tous ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("vip")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                statusFilter === "vip" ? "bg-amber-600 text-white" : "bg-white text-[#666660] border border-black/[0.06]"
              )}
            >
              VIP ({customers.filter((c) => c.status === "vip").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("regular")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                statusFilter === "regular" ? "bg-blue-600 text-white" : "bg-white text-[#666660] border border-black/[0.06]"
              )}
            >
              Fidèles ({customers.filter((c) => c.status === "regular").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("new")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                statusFilter === "new" ? "bg-emerald-600 text-white" : "bg-white text-[#666660] border border-black/[0.06]"
              )}
            >
              Nouveaux ({customers.filter((c) => c.status === "new").length})
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#888880]" />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone, ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Tableau des clients */}
      <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black/[0.08] bg-black/[0.02] text-[10px] font-bold uppercase tracking-wider text-[#666660]">
                <th className="py-3.5 pl-6 pr-3">Client</th>
                <th className="py-3.5 px-3">Localisation & Adresse</th>
                <th className="py-3.5 px-3">Commandes</th>
                <th className="py-3.5 px-3">Total Dépensé</th>
                <th className="py-3.5 px-3">Dernière Commande</th>
                <th className="py-3.5 px-3">Statut</th>
                <th className="py-3.5 pr-6 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {filteredCustomers.map((cust) => {
                const waUrl = whatsappLink(cust.phone, `Bonjour ${cust.name}, merci pour votre confiance envers notre boutique !`);

                return (
                  <tr key={cust.id} className="hover:bg-black/[0.015] transition-colors">
                    {/* Nom + Tél */}
                    <td className="py-3.5 pl-6 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[#111111] text-[#FAF8F5] flex items-center justify-center font-bold text-xs shrink-0">
                          {cust.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-[#111111] block">{cust.name}</span>
                          <span className="font-mono text-[11px] text-[#666660]">{cust.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* Localisation */}
                    <td className="py-3.5 px-3">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#111111] block">{cust.city}</span>
                        <span className="text-[11px] text-[#888880] block truncate max-w-xs">{cust.address}</span>
                      </div>
                    </td>

                    {/* Commandes */}
                    <td className="py-3.5 px-3">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomerHistory(cust)}
                        className="inline-flex items-center gap-1 font-black text-[#111111] hover:underline cursor-pointer"
                      >
                        <ShoppingBag className="h-3 w-3 text-[#666660]" />
                        <span>{cust.ordersCount} cmd</span>
                      </button>
                    </td>

                    {/* Total Dépensé */}
                    <td className="py-3.5 px-3 font-black text-[#111111]">
                      {formatFcfa(cust.totalSpent)}
                    </td>

                    {/* Dernière Commande */}
                    <td className="py-3.5 px-3 text-[#666660]">
                      {cust.lastOrderDate}
                    </td>

                    {/* Statut */}
                    <td className="py-3.5 px-3">
                      {statusBadge(cust.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pr-6 pl-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-black/[0.08] bg-white text-emerald-700 hover:bg-emerald-50 transition-colors shadow-2xs"
                          title="WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>

                        <a
                          href={`tel:${cust.phone}`}
                          className="p-1.5 rounded-lg border border-black/[0.08] bg-white text-[#111111] hover:bg-[#FAF8F5] transition-colors shadow-2xs"
                          title="Appeler"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cust)}
                          className="p-1.5 rounded-lg border border-black/[0.08] bg-white text-[#111111] hover:bg-[#FAF8F5] transition-colors shadow-2xs"
                          title="Modifier"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(cust.id)}
                          className="p-1.5 rounded-lg border border-black/[0.08] bg-white text-rose-600 hover:bg-rose-50 transition-colors shadow-2xs"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALE HISTORIQUE DES COMMANDES D'UN CLIENT */}
      {selectedCustomerHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <History className="h-5 w-5 text-[#111111]" />
                <h3 className="text-sm font-black text-[#111111]">
                  Historique de {selectedCustomerHistory.name}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#888880]">
                {selectedCustomerHistory.phone}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-black/[0.06] flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-[#888880] block">Total cumulé dépensé</span>
                <span className="text-base font-black text-emerald-700">
                  {formatFcfa(selectedCustomerHistory.totalSpent)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#888880] block">Commandes passées</span>
                <span className="font-black text-[#111111]">{selectedCustomerHistory.ordersCount} commandes</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-bold text-[#888880] uppercase block">
                Dernières commandes enregistrées :
              </span>
              <div className="p-4 rounded-xl bg-white border border-black/[0.06] text-center text-[#888880]">
                <p className="text-xs">Aucun historique de commande pour ce client.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => setSelectedCustomerHistory(null)}
                className="px-4 py-2 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE AJOUT / MODIF CLIENT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-[#111111]">
              {editingCustomerId ? "Modifier les coordonnées client" : "Ajouter un client au carnet"}
            </h3>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  Nom complet <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Prénom Nom"
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  Téléphone avec indicatif <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+22507000000 ou +22890000000"
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white font-mono text-[#111111] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#111111] mb-1">Pays</label>
                  <select
                    value={country}
                    onChange={(e: any) => setCountry(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                  >
                    <option value="CI">🇨🇮 Côte d'Ivoire</option>
                    <option value="TG">🇹🇬 Togo</option>
                    <option value="SN">🇸🇳 Sénégal</option>
                    <option value="BJ">🇧🇯 Bénin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#111111] mb-1">Ville</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Abidjan (Cocody)"
                    className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  Adresse précise de livraison <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Rue des Jardins, Immeuble Bâtiment B, Porte 4"
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">Notes internes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Préférence de livraison, heures de disponibilité..."
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black"
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
