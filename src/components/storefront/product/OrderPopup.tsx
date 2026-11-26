"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface OrderPopupProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * Fenêtre pop-up de commande : feuille plein écran sur mobile, fenêtre centrée sur ordinateur.
 * Fermeture par la croix, un clic à l'extérieur ou la touche Échap ; la page derrière ne défile plus.
 */
export function OrderPopup({ open, onClose, title, children }: OrderPopupProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="order-popup-overlay"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || "Commander"}
        className="relative w-full sm:max-w-lg max-h-[94vh] sm:max-h-[90vh] overflow-y-auto overscroll-contain bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl"
        data-testid="order-popup"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-white px-4 pt-4 pb-2">
          <p className="text-base sm:text-lg font-black text-[#111111] leading-snug">
            {title || "Veuillez remplir le formulaire pour confirmer votre commande"}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-[#111111] hover:bg-black/[0.06] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">{children}</div>
      </div>
    </div>
  );
}
