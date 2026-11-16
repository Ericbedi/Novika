"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  ExternalLink,
  MessageCircle,
  Clock,
  Sparkles,
  FileText,
} from "lucide-react";
import { formatFcfa } from "@/lib/money";
import { Customer, Order } from "@/server/data/types";
import { StatusBadge } from "@/components/app/status-badge";

const COUNTRY_FLAGS: Record<string, string> = {
  TG: "🇹🇬 Togo",
  CI: "🇨🇮 Côte d'Ivoire",
  SN: "🇸🇳 Sénégal",
  BJ: "🇧🇯 Bénin",
};

export function CustomerDetailClient({
  customer,
  orders,
  storeSlug,
}: {
  customer: Customer;
  orders: Order[];
  storeSlug: string;
}) {
  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/app/${storeSlug}/clients`}
            className="p-2.5 rounded-xl border border-black/[0.08] bg-[#FAF8F5] hover:bg-black/5 text-[#111111] transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
                Fiche Client
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  customer.status === "vip"
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : customer.status === "regular"
                    ? "bg-blue-100 text-blue-900 border border-blue-200"
                    : "bg-neutral-200 text-neutral-800"
                }`}
              >
                {customer.status === "vip"
                  ? "★ Client VIP"
                  : customer.status === "regular"
                  ? "Client Régulier"
                  : "Nouveau Client"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
              {customer.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
              `Bonjour ${customer.name}, merci pour votre fidélité sur notre boutique !`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm"
          >
            <MessageCircle className="h-4 w-4" />
            <span>WhatsApp</span>
          </a>
          <a
            href={`tel:${customer.phone}`}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-[#FAF8F5] text-[#111111] text-xs font-bold hover:bg-black/5 transition-all"
          >
            <Phone className="h-4 w-4" />
            <span>Appeler</span>
          </a>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-[22px] border border-black/[0.08] bg-[#FAF8F5] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
            Total Dépensé (Espèces)
          </span>
          <div className="mt-2 text-2xl font-black text-[#111111]">
            {formatFcfa(customer.totalSpent)}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            Encaissé à la livraison
          </p>
        </div>

        <div className="p-5 rounded-[22px] border border-black/[0.08] bg-[#FAF8F5] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
            Commandes Passées
          </span>
          <div className="mt-2 text-2xl font-black text-[#111111]">
            {customer.ordersCount} commandes
          </div>
          <p className="text-[11px] text-[#666660] mt-1">
            Panier moyen : {formatFcfa(Math.round(customer.totalSpent / (customer.ordersCount || 1)))}
          </p>
        </div>

        <div className="p-5 rounded-[22px] border border-black/[0.08] bg-[#FAF8F5] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
            Dernière Commande
          </span>
          <div className="mt-2 text-2xl font-black text-[#111111]">
            {customer.lastOrderDate}
          </div>
          <p className="text-[11px] text-[#666660] mt-1">
            Activité récente enregistrée
          </p>
        </div>
      </div>

      {/* Info & Notes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] space-y-4">
          <h2 className="text-sm font-black text-[#111111] uppercase tracking-wider">
            Coordonnées & Localisation
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-[#888880] shrink-0" />
              <div>
                <span className="text-[#888880] block text-[10px]">Téléphone direct</span>
                <span className="font-bold text-[#111111]">{customer.phone}</span>
              </div>
            </div>

            {customer.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[#888880] shrink-0" />
                <div>
                  <span className="text-[#888880] block text-[10px]">Adresse email</span>
                  <span className="font-bold text-[#111111]">{customer.email}</span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-[#888880] shrink-0 mt-0.5" />
              <div>
                <span className="text-[#888880] block text-[10px]">Pays & Ville</span>
                <span className="font-bold text-[#111111]">
                  {COUNTRY_FLAGS[customer.country] || customer.country} — {customer.city}
                </span>
                <span className="block text-[#666660] mt-0.5">{customer.address}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 p-6 rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] space-y-4">
          <h2 className="text-sm font-black text-[#111111] uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#888880]" />
            <span>Notes Internes de la Boutique & Closing</span>
          </h2>
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-950 leading-relaxed">
            {customer.notes || "Aucune note particulière pour ce client pour le moment."}
          </div>
          <p className="text-[11px] text-[#888880]">
            Ces notes sont visibles uniquement par l'administrateur, les closeuses et les livreurs autorisés.
          </p>
        </div>
      </div>

      {/* Orders History */}
      <div className="p-6 rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-[#111111] uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            <span>Historique des Commandes COD ({orders.length})</span>
          </h2>
        </div>

        {orders.length === 0 ? (
          <p className="text-xs text-[#666660] py-4 text-center">
            Aucune commande liée à ce numéro de téléphone dans les archives actuelles.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/[0.08] text-[11px] font-bold text-[#666660] uppercase">
                  <th className="pb-3">Numéro</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Produits</th>
                  <th className="pb-3">Total à Encaisser</th>
                  <th className="pb-3">Statut</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-black/[0.02]">
                    <td className="py-3 font-bold text-[#111111]">{ord.orderNumber}</td>
                    <td className="py-3 text-[#666660]">{ord.createdAt}</td>
                    <td className="py-3">
                      {ord.items.map((it) => (
                        <div key={it.id} className="font-medium text-[#111111]">
                          {it.quantity}x {it.productName}
                        </div>
                      ))}
                    </td>
                    <td className="py-3 font-black text-[#111111]">
                      {formatFcfa(ord.totalAmount)}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={ord.status} />
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/app/${storeSlug}/commandes/${ord.orderNumber}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#111111] hover:underline"
                      >
                        <span>Détails</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
