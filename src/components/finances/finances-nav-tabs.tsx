"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wallet,
  CreditCard,
  Megaphone,
  ArrowDownLeft,
  BookOpen,
  PieChart,
} from "lucide-react";
import { useApp } from "@/components/layout/app-shell";
import { MOCK_ACCOUNTS, MOCK_EXPENSES_ADVANCED } from "@/mock-data/advanced-finances";
import { cn } from "@/lib/utils";

interface FinancesNavTabsProps {
  storeSlug: string;
}

export function FinancesNavTabs({ storeSlug }: FinancesNavTabsProps) {
  const pathname = usePathname();
  const { activeRole } = useApp();

  const isRestricted = activeRole === "closer" || activeRole === "rider";

  if (isRestricted) {
    return null;
  }

  const activeAccountsCount = MOCK_ACCOUNTS.filter((a) => !a.isArchived).length;
  const pendingApprovalsCount = MOCK_EXPENSES_ADVANCED.filter(
    (e) => e.status === "pending_approval"
  ).length;

  const tabs = [
    {
      id: "overview",
      label: "Livre des comptes",
      href: `/app/${storeSlug}/finances`,
      exact: true,
      aliases: [`/app/${storeSlug}/finances/livre-de-compte`],
      icon: BookOpen,
    },
    {
      id: "caisse",
      label: "Caisses & Comptes",
      href: `/app/${storeSlug}/finances/caisse`,
      icon: Wallet,
      badge: activeAccountsCount,
      badgeColor: "bg-[#EAE4D9] text-[#111111]",
    },
    {
      id: "depenses",
      label: "Dépenses & Revenus",
      href: `/app/${storeSlug}/finances/depenses`,
      icon: CreditCard,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} en attente` : undefined,
      badgeColor: "bg-amber-100 text-amber-900",
    },
    {
      id: "publicite",
      label: "Publicités & CPA réel",
      href: `/app/${storeSlug}/finances/publicite`,
      icon: Megaphone,
    },
    {
      id: "reversements",
      label: "Point & Reversements",
      href: `/app/${storeSlug}/finances/reversements`,
      icon: ArrowDownLeft,
    },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-black/[0.08] mb-6">
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href || tab.aliases?.some((a) => pathname === a)
          : pathname.startsWith(tab.href);

        const Icon = tab.icon;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none",
              isActive
                ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                : "bg-[#FAF8F5] border border-black/[0.08] text-[#555550] hover:text-[#111111] hover:bg-white"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                  isActive
                    ? "bg-[#FAF8F5] text-[#111111]"
                    : tab.badgeColor || "bg-black/[0.06] text-[#111111]"
                )}
              >
                {tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
