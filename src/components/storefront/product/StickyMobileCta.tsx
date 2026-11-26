"use client";

import React from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { formatFcfa } from "@/lib/money";

interface StickyMobileCtaProps {
  price: number;
  productTitle: string;
  targetFormId?: string;
  isOutOfStock?: boolean;
  /** Si fourni (mode pop-up), le bouton ouvre le formulaire au lieu de défiler vers la page */
  onOrderClick?: () => void;
}

export function StickyMobileCta({
  price,
  productTitle,
  targetFormId = "cod-order-form",
  isOutOfStock = false,
  onOrderClick,
}: StickyMobileCtaProps) {
  const handleScrollToForm = () => {
    if (onOrderClick) {
      onOrderClick();
      return;
    }
    const el = document.getElementById(targetFormId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div
      id="sticky-mobile-cta"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-black/[0.08] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-2xl block sm:hidden"
    >
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold text-[#666660] truncate">
            {productTitle}
          </span>
          <span className="text-sm font-black text-[#111111]">
            {formatFcfa(price)}
          </span>
        </div>

        {isOutOfStock ? (
          <button
            type="button"
            disabled
            className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-gray-200 text-gray-500 text-xs font-black shrink-0 cursor-not-allowed"
          >
            <span>Rupture de stock</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleScrollToForm}
            className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#C2410C] text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 shrink-0 active:scale-95 transition-transform cursor-pointer"
          >
            <span>Commander · {formatFcfa(price)}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
