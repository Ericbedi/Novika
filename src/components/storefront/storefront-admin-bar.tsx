"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Edit3,
  Eye,
  CheckCircle2,
  ArrowLeft,
  Settings,
  Sparkles,
  Layers,
  Globe,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StorefrontAdminBarProps {
  storeSlug: string;
  isPublished: boolean;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onTogglePublish: () => void;
}

export function StorefrontAdminBar({
  storeSlug,
  isPublished,
  isEditMode,
  onToggleEditMode,
  onTogglePublish,
}: StorefrontAdminBarProps) {
  return (
    <aside
      aria-label="Barre d'administration de la vitrine"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] max-w-xl w-[92%] sm:w-auto bg-[#111111]/95 text-white backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3"
    >
      {/* Badge Propriétaire */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <div className="hidden sm:block">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 block">
            Mode Admin
          </span>
          <span className="text-[10px] text-white/70 block">
            {isPublished ? "Vitrine Publiée" : "Vitrine en Brouillon"}
          </span>
        </div>
      </div>

      <div className="h-6 w-px bg-white/15 hidden sm:block" />

      {/* Bouton Bascule Mode Édition */}
      <button
        type="button"
        id="btn-toggle-edit-mode"
        onClick={onToggleEditMode}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
          isEditMode
            ? "bg-amber-500 text-black shadow-xs"
            : "bg-white/10 hover:bg-white/20 text-white"
        )}
      >
        <Edit3 className="w-3.5 h-3.5" />
        <span>{isEditMode ? "Mode Édition Actif" : "Activer Mode Édition"}</span>
      </button>

      {/* Bascule Publier / Dépublier */}
      <button
        type="button"
        id="btn-toggle-publish-storefront"
        onClick={onTogglePublish}
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
          isPublished
            ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
            : "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
        )}
      >
        {isPublished ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
        <span>{isPublished ? "Publiée" : "Publier"}</span>
      </button>

      <div className="h-6 w-px bg-white/15" />

      {/* Revenir au tableau de bord */}
      <Link
        href={`/app/${storeSlug}`}
        id="btn-back-to-dashboard"
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Tableau de bord</span>
      </Link>
    </aside>
  );
}
