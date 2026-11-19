"use client";

import React, { useState, useEffect } from "react";
import { ShoppingBag } from "lucide-react";
import { getCart, getCartTotalCount, openCartDrawer, CartItem } from "@/lib/cart-store";

interface HeaderCartButtonProps {
  storeSlug: string;
}

export function HeaderCartButton({ storeSlug }: HeaderCartButtonProps) {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    // Initial fetch
    const current = getCart(storeSlug);
    setCount(getCartTotalCount(current));

    const handleUpdated = (e: Event) => {
      const custom = e as CustomEvent<{ storeSlug: string; items: CartItem[] }>;
      if (!custom.detail || custom.detail.storeSlug === storeSlug) {
        if (custom.detail?.items) {
          setCount(getCartTotalCount(custom.detail.items));
        } else {
          setCount(getCartTotalCount(getCart(storeSlug)));
        }
      }
    };

    window.addEventListener("novika:cart_updated", handleUpdated);
    return () => {
      window.removeEventListener("novika:cart_updated", handleUpdated);
    };
  }, [storeSlug]);

  return (
    <button
      type="button"
      onClick={() => openCartDrawer(storeSlug)}
      aria-label={`Panier (${count} articles)`}
      className="relative p-1.5 sm:p-2 rounded-xl text-[#666660] hover:text-[#111111] hover:bg-black/[0.04] transition-colors shrink-0 cursor-pointer"
      title="Mon Panier"
    >
      <ShoppingBag className="h-4 w-4" />
      {count > 0 && (
        <span
          data-testid="header-cart-badge"
          className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-[#C2410C] text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-in zoom-in"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
