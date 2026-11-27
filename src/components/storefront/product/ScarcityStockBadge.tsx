"use client";

import React from "react";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

interface ScarcityStockBadgeProps {
  realStock: number; // Stock réel du catalogue de la boutique
}

/**
 * RÈGLE STRICTE PROMPT 12 :
 * Bloc d'urgence : uniquement s'il repose sur le stock réel
 * (« Plus que X en stock » quand le stock est faible <= 10).
 * AUCUN compte à rebours fictif, AUCUN inventaire inventé.
 */
export function ScarcityStockBadge({ realStock }: ScarcityStockBadgeProps) {
  // Produit épuisé : aucun badge sur la fiche (le formulaire reste désactivé)
  if (realStock <= 0) return null;

  // Stock faible authentique (1 à 10 unités)
  if (realStock <= 10) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-black animate-pulse">
        <Clock className="w-4 h-4 text-amber-600" />
        <span>Plus que {realStock} unité{realStock > 1 ? "s" : ""} en stock à ce tarif</span>
      </div>
    );
  }

  // Stock normal confortable
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      <span>En stock — Prêt à être expédié aujourd'hui</span>
    </div>
  );
}
