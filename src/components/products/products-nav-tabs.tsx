"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Boxes, Truck, ShoppingCart, FolderTree, AlertTriangle } from "lucide-react";
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

  // Counts
  const totalProducts = MOCK_PRODUCTS.length;
  const reorderAlertsCount = MOCK_REORDER_ITEMS.length;
  const suppliersCount = MOCK_SUPPLIERS.length;
  const activeOrdersCount = MOCK_PURCHASE_ORDERS.filter(
    (po) => po.status === "ordered" || po.status === "shipped"
  ).length;
  const collectionsCount = MOCK_COLLECTIONS.length;

  const tabs = [
    {
      id: "products",
      label: "Produits",
      href: `/app/${storeSlug}/produits`,
      exact: true,
      icon: Package,
      badge: totalProducts,
      badgeColor: "bg-[#EAE4D9] text-[#111111]",
    },
    {
      id: "stock",
      label: "Stock",
      href: `/app/${storeSlug}/produits/stock`,
      aliases: [`/app/${storeSlug}/stock`],
      icon: Boxes,
      badge: reorderAlertsCount > 0 ? `${reorderAlertsCount} à renouveler` : undefined,
      badgeColor: "bg-amber-100 text-amber-800",
      badgeIcon: AlertTriangle,
    },
    ...(!isRestricted
      ? [
        {
          id: "suppliers",
          label: "Fournisseurs",
          href: `/app/${storeSlug}/produits/fournisseurs`,
          icon: Truck,
          badge: suppliersCount,
          badgeColor: "bg-[#EAE4D9] text-[#111111]",
        },
        {
          id: "purchase-orders",
          label: "Achats fournisseurs",
          href: `/app/${storeSlug}/produits/achats`,
          aliases: [`/app/${storeSlug}/sourcing`, `/app/${storeSlug}/produits/sourcing`],
          icon: ShoppingCart,
          badge: activeOrdersCount > 0 ? `${activeOrdersCount} en cours` : `${MOCK_PURCHASE_ORDERS.length}`,
          badgeColor: activeOrdersCount > 0 ? "bg-blue-100 text-blue-800" : "bg-[#EAE4D9] text-[#111111]",
        },
      ]
      : []),
    {
      id: "collections",
      label: "Collections",
      href: `/app/${storeSlug}/produits/collections`,
      aliases: [`/app/${storeSlug}/collections`],
      icon: FolderTree,
      badge: collectionsCount,
      badgeColor: "bg-[#EAE4D9] text-[#111111]",
    },
  ];

  const isTabActive = (tab: (typeof tabs)[number]) => {
    if (tab.exact) {
      return (
        pathname === tab.href ||
        (pathname.startsWith(`/app/${storeSlug}/produits/`) &&
          !pathname.includes("/stock") &&
          !pathname.includes("/fournisseurs") &&
          !pathname.includes("/achats") &&
          !pathname.includes("/collections"))
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
