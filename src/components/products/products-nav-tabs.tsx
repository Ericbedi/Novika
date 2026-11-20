"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  Boxes,
  Truck,
  ShoppingCart,
  FolderTree,
  AlertTriangle,
  ArrowUpDown,
  TrendingUp,
  Image as ImageIcon,
} from "lucide-react";
import { useApp } from "@/components/layout/app-shell";
import { MOCK_PRODUCTS, MOCK_SUPPLIERS, MOCK_PURCHASE_ORDERS, MOCK_COLLECTIONS, MOCK_REORDER_ITEMS } from "@/mock-data";

interface ProductsNavTabsProps {
  storeSlug: string;
}

export function ProductsNavTabs({ storeSlug }: ProductsNavTabsProps) {
  const pathname = usePathname();
  const { activeRole } = useApp();

  const isCloser = activeRole === "closer";
  const isRider = activeRole === "rider";
  const isAgency = activeRole === "agency";
  const isRestricted = isCloser || isRider || isAgency;

  const isFounderDemoStore = storeSlug === "lome-glow";

  const [tabCounts, setTabCounts] = useState({
    products: isFounderDemoStore ? MOCK_PRODUCTS.length : 0,
    reorderAlerts: isFounderDemoStore ? MOCK_REORDER_ITEMS.length : 0,
    suppliers: isFounderDemoStore ? MOCK_SUPPLIERS.length : 0,
    activeOrders: isFounderDemoStore
      ? MOCK_PURCHASE_ORDERS.filter((po) => po.status === "ordered" || po.status === "shipped").length
      : 0,
    collections: isFounderDemoStore ? MOCK_COLLECTIONS.length : 0,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isFounderDemoStore) {
        setTabCounts({
          products: MOCK_PRODUCTS.length,
          reorderAlerts: MOCK_REORDER_ITEMS.length,
          suppliers: MOCK_SUPPLIERS.length,
          activeOrders: MOCK_PURCHASE_ORDERS.filter((po) => po.status === "ordered" || po.status === "shipped").length,
          collections: MOCK_COLLECTIONS.length,
        });
      } else {
        const safeParseArray = (raw: string | null): any[] => {
          if (!raw) return [];
          try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        };

        const parsedProds = safeParseArray(localStorage.getItem(`novika_store_products_${storeSlug}`));
        const parsedSuppliers = safeParseArray(localStorage.getItem(`novika_store_suppliers_${storeSlug}`));
        const parsedPos = safeParseArray(localStorage.getItem(`novika_store_pos_${storeSlug}`));
        const parsedCollections = safeParseArray(localStorage.getItem(`novika_store_collections_${storeSlug}`));

        const reorders = parsedProds.filter((p: any) => (p?.stock || 0) <= (p?.lowStockThreshold || 10)).length;

        setTabCounts({
          products: parsedProds.length,
          reorderAlerts: reorders,
          suppliers: parsedSuppliers.length,
          activeOrders: parsedPos.filter((po: any) => po?.status === "ordered" || po?.status === "shipped").length,
          collections: parsedCollections.length,
        });
      }
    }
  }, [storeSlug, isFounderDemoStore]);

  const tabs = [
    {
      id: "products",
      label: "Produits",
      href: `/app/${storeSlug}/produits`,
      exact: true,
      icon: Package,
      badge: tabCounts.products,
      badgeColor: "bg-[#EAE4D9] text-[#111111]",
    },
    {
      id: "collections",
      label: "Collections",
      href: `/app/${storeSlug}/produits/collections`,
      aliases: [`/app/${storeSlug}/collections`],
      icon: FolderTree,
      badge: tabCounts.collections,
      badgeColor: "bg-[#EAE4D9] text-[#111111]",
    },
    {
      id: "stock",
      label: "Inventaire",
      href: `/app/${storeSlug}/produits/stock`,
      aliases: [`/app/${storeSlug}/stock`],
      icon: Boxes,
      badge: tabCounts.reorderAlerts > 0 ? `${tabCounts.reorderAlerts} à renouveler` : undefined,
      badgeColor: "bg-amber-100 text-amber-800",
      badgeIcon: AlertTriangle,
    },
    {
      id: "import-export",
      label: "Import / Export",
      href: `/app/${storeSlug}/produits/import-export`,
      icon: ArrowUpDown,
    },
    {
      id: "performance",
      label: "Performance produit",
      href: `/app/${storeSlug}/produits/performance`,
      icon: TrendingUp,
    },
    {
      id: "mediatheque",
      label: "Médiathèque",
      href: `/app/${storeSlug}/mediatheque`,
      icon: ImageIcon,
    },
    ...(!isRestricted
      ? [
        {
          id: "suppliers",
          label: "Fournisseurs",
          href: `/app/${storeSlug}/produits/fournisseurs`,
          icon: Truck,
          badge: tabCounts.suppliers,
          badgeColor: "bg-[#EAE4D9] text-[#111111]",
        },
        {
          id: "purchase-orders",
          label: "Achats fournisseurs",
          href: `/app/${storeSlug}/produits/achats`,
          aliases: [`/app/${storeSlug}/sourcing`, `/app/${storeSlug}/produits/sourcing`],
          icon: ShoppingCart,
          badge: tabCounts.activeOrders > 0 ? `${tabCounts.activeOrders} en cours` : `${tabCounts.activeOrders}`,
          badgeColor: tabCounts.activeOrders > 0 ? "bg-blue-100 text-blue-800" : "bg-[#EAE4D9] text-[#111111]",
        },
      ]
      : []),
  ];

  const isTabActive = (tab: (typeof tabs)[number]) => {
    if (tab.exact) {
      return (
        pathname === tab.href ||
        (pathname.startsWith(`/app/${storeSlug}/produits/`) &&
          !pathname.includes("/stock") &&
          !pathname.includes("/fournisseurs") &&
          !pathname.includes("/achats") &&
          !pathname.includes("/collections") &&
          !pathname.includes("/import-export") &&
          !pathname.includes("/performance"))
      );
    }
    if (pathname === tab.href || tab.aliases?.some((a) => pathname === a || pathname.startsWith(a))) {
      return true;
    }
    return pathname.startsWith(tab.href);
  };

  return (
    <div className="w-full border-b border-[#E6E0D4] bg-[#FAF8F5]/80 backdrop-blur-sm -mt-2 mb-6 pt-2">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3">
        {tabs.map((tab) => {
          const active = isTabActive(tab);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap shadow-xs ${active
                ? "bg-[#111111] text-white shadow-sm"
                : "bg-white text-[#4A4A4A] hover:text-[#111111] hover:bg-[#F3EFE6] border border-[#E6E0D4]"
                }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${active ? "text-white" : "text-[#7A7A7A] group-hover:text-[#111111]"
                  }`}
              />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${active ? "bg-white/20 text-white" : tab.badgeColor
                    }`}
                >
                  {tab.badgeIcon && <tab.badgeIcon className="w-3 h-3 text-amber-600" />}
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
