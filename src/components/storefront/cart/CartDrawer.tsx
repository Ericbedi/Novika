"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
} from "lucide-react";
import {
  CartItem,
  getCart,
  updateCartItemQuantity,
  removeFromCart,
  getCartSubtotal,
  getCartTotalCount,
  closeCartDrawer,
} from "@/lib/cart-store";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatFcfa } from "@/lib/money";

interface CartDrawerProps {
  storeSlug: string;
}

export function CartDrawer({ storeSlug }: CartDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);

  // Synchronisation des éléments du panier
  const refreshCart = useCallback(() => {
    setItems(getCart(storeSlug));
  }, [storeSlug]);

  useEffect(() => {
    refreshCart();

    const handleOpen = (e: Event) => {
      const custom = e as CustomEvent<{ storeSlug: string }>;
      if (!custom.detail || custom.detail.storeSlug === storeSlug) {
        refreshCart();
        setIsOpen(true);
      }
    };

    const handleClose = (e: Event) => {
      const custom = e as CustomEvent<{ storeSlug: string }>;
      if (!custom.detail || custom.detail.storeSlug === storeSlug) {
        setIsOpen(false);
      }
    };

    const handleUpdated = (e: Event) => {
      const custom = e as CustomEvent<{ storeSlug: string; items: CartItem[] }>;
      if (!custom.detail || custom.detail.storeSlug === storeSlug) {
        if (custom.detail?.items) {
          setItems(custom.detail.items);
        } else {
          refreshCart();
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("novika:open_cart_drawer", handleOpen);
    window.addEventListener("novika:close_cart_drawer", handleClose);
    window.addEventListener("novika:cart_updated", handleUpdated);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("novika:open_cart_drawer", handleOpen);
      window.removeEventListener("novika:close_cart_drawer", handleClose);
      window.removeEventListener("novika:cart_updated", handleUpdated);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [storeSlug, refreshCart]);

  // Verrouillage du scroll en arrière-plan lorsque le tiroir est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const totalCount = getCartTotalCount(items);
  const subtotal = getCartSubtotal(items);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tiroir du panier"
      className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200"
    >
      {/* Fond estompé cliquable */}
      <div
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      {/* Panneau latéral coulissant */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* En-tête du tiroir */}
        <div className="px-5 py-4 border-b border-black/[0.08] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#111111] text-white flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#111111] uppercase tracking-wide">
                Mon Panier
              </h2>
              <span className="text-[11px] font-semibold text-[#666660]">
                {totalCount} {totalCount > 1 ? "articles" : "article"} sélectionné{totalCount > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Fermer le panier"
            className="p-2 rounded-xl text-[#666660] hover:text-[#111111] hover:bg-black/[0.05] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps : Liste des articles ou état vide */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-black/[0.06] flex items-center justify-center text-[#888880]">
                <ShoppingBag className="w-8 h-8 opacity-60" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-[#111111]">
                  Votre panier est actuellement vide
                </p>
                <p className="text-xs text-[#666660] max-w-[240px]">
                  Découvrez nos pépites sélectionnées et commandez avec paiement à la livraison.
                </p>
              </div>
              <Link
                href={`/boutique/${storeSlug}/catalogue`}
                onClick={() => setIsOpen(false)}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all shadow-xs cursor-pointer"
              >
                <span>Explorer le catalogue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] flex items-center gap-3 relative group"
                >
                  {/* Miniature produit */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-black/[0.06] shrink-0 relative">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Infos article */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs font-black text-[#111111] truncate" title={item.name}>
                      {item.name}
                    </p>
                    {item.variantName && (
                      <span className="inline-block text-[10px] font-semibold text-[#666660] bg-white px-2 py-0.5 rounded-md border border-black/[0.06]">
                        {item.variantName}
                      </span>
                    )}
                    <p className="text-xs font-black text-[#C2410C]">
                      {formatFcfa(item.unitPrice * item.quantity)}
                    </p>
                  </div>

                  {/* Contrôles de quantité */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => removeFromCart(storeSlug, item.id)}
                      className="text-[#888880] hover:text-rose-600 transition-colors p-1"
                      title="Supprimer l'article"
                      aria-label={`Supprimer ${item.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center border border-black/[0.12] rounded-lg bg-white overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartItemQuantity(storeSlug, item.id, item.quantity - 1)
                        }
                        className="px-2 py-1 text-[#444440] hover:bg-black/[0.05] transition-colors"
                        aria-label="Diminuer la quantité"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-black text-[#111111] min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCartItemQuantity(storeSlug, item.id, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.stock}
                        className="px-2 py-1 text-[#444440] hover:bg-black/[0.05] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        aria-label="Augmenter la quantité"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pied : Récapitulatif et CTA de commande COD */}
        {items.length > 0 && (
          <div className="p-5 border-t border-black/[0.08] bg-white space-y-4 shadow-lg">
            {/* Détails financiers COD */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#666660]">
                <span>Sous-total</span>
                <span className="font-bold text-[#111111]">{formatFcfa(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#666660]">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Livraison COD</span>
                </span>
                <span className="font-bold text-emerald-700">Offerte (0 FCFA)</span>
              </div>
              <div className="pt-2 border-t border-black/[0.06] flex justify-between items-baseline">
                <span className="text-sm font-black text-[#111111]">Total à la livraison</span>
                <span className="text-base font-black text-[#C2410C]">
                  {formatFcfa(subtotal)}
                </span>
              </div>
            </div>

            {/* Réassurance COD */}
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center gap-2 text-[11px] text-emerald-900 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Règlement en espèces ou Mobile Money lors de la réception</span>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Link
                href={`/boutique/${storeSlug}/panier`}
                onClick={() => setIsOpen(false)}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-[#C2410C] hover:bg-[#a83609] text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span>Commander maintenant (Paiement à la livraison)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-2 text-center text-xs font-bold text-[#666660] hover:text-[#111111] transition-colors cursor-pointer"
              >
                Continuer mes achats
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
