"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Eye } from "lucide-react";
import { Order } from "@/server/data/types";
import { Money } from "@/components/app/money";
import { StatusBadge } from "@/components/app/status-badge";
import { CountryChip, InitialsAvatar, ProductThumb } from "@/components/app/bits";
import { PhoneActions } from "@/components/app/phone-actions";
import { DataTable, Column } from "@/components/app/data-table";
import { cn } from "@/lib/utils";

interface RecentOrdersTableProps {
  orders: Order[];
  storeSlug: string;
  className?: string;
}

export function RecentOrdersTable({
  orders,
  storeSlug,
  className,
}: RecentOrdersTableProps) {
  const columns: Column<Order>[] = [
    {
      key: "orderNumber",
      header: "N° Commande",
      className: "w-32",
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
          <div>
            <p className="font-semibold text-xs text-[#111111]">
              {order.customerName}
            </p>
            <p className="font-mono text-[11px] text-[#666660]">
              {order.customerPhone}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "product",
      header: "Produit(s)",
      render: (order) => {
        const item = order.items[0];
        const hasMore = order.items.length > 1;
        return (
          <div className="flex items-center gap-2.5 max-w-[240px]">
            <ProductThumb src={item?.image} alt={item?.productName} size={36} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#111111] truncate">
                {item?.productName}
              </p>
              <p className="text-[11px] text-[#666660]">
                Qté: {item?.quantity} {item?.variant ? `(${item?.variant})` : ""}
                {hasMore && ` +${order.items.length - 1} autre`}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "location",
      header: "Ville & Pays",
      render: (order) => (
        <div className="space-y-1">
          <p className="text-xs font-medium text-[#111111]">
            {order.city}
          </p>
          <CountryChip code={order.country} showName={false} />
        </div>
      ),
    },
    {
      key: "amount",
      header: "Montant",
      className: "text-right",
      render: (order) => (
        <div className="text-right">
          <div className="text-xs font-black text-[#111111]">
            <Money value={order.totalAmount} />
          </div>
          <p className="text-[10px] text-[#666660]">Paiement livraison</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      className: "w-36",
      render: (order) => <StatusBadge status={order.status} size="sm" />,
    },
    {
      key: "date",
      header: "Date de réception",
      className: "text-xs text-[#666660] tabular-nums",
      render: (order) => order.createdAt,
    },
    {
      key: "actions",
      header: "Actions rapides",
      className: "text-right w-36",
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
            title="Voir le détail de la commande"
            className="p-1.5 rounded-lg border border-black/[0.08] bg-white text-[#111111] hover:bg-black hover:text-[#FAF8F5] transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
          </Link>
        </div>
      ),
    },
  ];

  const renderMobileCard = (order: Order) => (
    <div className="rounded-2xl border border-black/[0.08] bg-white p-4 shadow-sm space-y-3">
      {/* Ligne 1 : Numéro, Statut et Date */}
      <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#111111]">
            {order.orderNumber}
          </span>
          <CountryChip code={order.country} showName={false} />
        </div>
        <StatusBadge status={order.status} size="sm" />
      </div>

      {/* Ligne 2 : Client & Ville */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <InitialsAvatar name={order.customerName} size="md" />
          <div>
            <p className="text-sm font-bold text-[#111111]">
              {order.customerName}
            </p>
            <p className="text-xs text-[#666660]">
              {order.city}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-black text-[#111111]">
            <Money value={order.totalAmount} />
          </div>
          <span className="text-[10px] text-[#666660]">À encaisser</span>
        </div>
      </div>

      {/* Ligne 3 : Produits commandés */}
      <div className="bg-[#F3EFE6]/60 border border-black/[0.06] rounded-xl p-2.5 flex items-center gap-2.5">
        <ProductThumb src={order.items[0]?.image} alt={order.items[0]?.productName} size={36} />
        <div className="min-w-0 text-xs">
          <p className="font-medium text-[#111111] truncate">
            {order.items[0]?.productName}
          </p>
          <p className="text-[11px] text-[#666660]">
            Qté : {order.items[0]?.quantity}
            {order.items.length > 1 && ` (+${order.items.length - 1} autre produit)`}
          </p>
        </div>
      </div>

      {/* Ligne 4 : Actions Tactiles Larges (min 44px) pour Closeuse & Livreur */}
      <div className="pt-1 flex items-center gap-2">
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
          className="h-11 min-h-[44px] px-3.5 rounded-lg border border-black/[0.08] bg-[#111111] flex items-center justify-center text-xs font-bold text-[#FAF8F5] hover:bg-black transition-colors"
        >
          Détail
        </Link>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "rounded-2xl border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-[0_2px_12px_rgba(17,17,17,0.03)]",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-[#111111]">
            Dernières commandes
          </h3>
          <p className="text-xs text-[#666660]">
            Commandes récentes en attente de confirmation ou livraison
          </p>
        </div>
        <Link
          href={`/app/${storeSlug}/commandes`}
          className="text-xs font-bold text-[#111111] hover:underline inline-flex items-center gap-1"
        >
          Toutes les commandes ({orders.length}) <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        keyExtractor={(item) => item.id}
        renderMobileCard={renderMobileCard}
      />
    </div>
  );
}
