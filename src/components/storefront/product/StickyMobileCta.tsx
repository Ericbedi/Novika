"use client";

import React from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { formatFcfa } from "@/lib/money";

interface StickyMobileCtaProps {
  price: number;
  productTitle: string;
  targetFormId?: string;
}

export function StickyMobileCta({
  price,
  productTitle,
  targetFormId = "cod-order-form",
}: StickyMobileCtaProps) {
  const handleScrollToForm = () => {
    const el = document.getElementById(targetFormId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-black/[0.08] p-3 shadow-2xl block sm:hidden">
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold text-[#666660] truncate">
            {productTitle}
          </span>
          <span className="text-sm font-black text-[#111111]">
            {formatFcfa(price)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleScrollToForm}
          className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#C2410C] text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 shrink-0 active:scale-95 transition-transform"
        >
          <span>Commander · {formatFcfa(price)}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
