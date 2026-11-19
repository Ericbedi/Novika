"use client";

import React from "react";
import { ThemeColorPalette, PageWidthOption, SectionSpacingOption, BorderRadiusOption } from "@/lib/theme-engine/types";
import { cn } from "@/lib/utils";

interface SectionWrapperProps {
  id?: string;
  palette: ThemeColorPalette;
  pageWidth?: PageWidthOption;
  spacing?: SectionSpacingOption;
  cardRadius?: BorderRadiusOption;
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
  isEditMode?: boolean;
  isEmpty?: boolean;
  onEdit?: () => void;
  sectionName?: string;
}

export function SectionWrapper({
  id,
  palette,
  pageWidth = "standard",
  spacing = "normal",
  cardRadius = "md",
  className,
  innerClassName,
  children,
  isEditMode = false,
  isEmpty = false,
  onEdit,
  sectionName,
}: SectionWrapperProps) {
  // Déterminer la largeur du conteneur
  const maxWidthClass =
    pageWidth === "narrow"
      ? "max-w-4xl"
      : pageWidth === "standard"
      ? "max-w-6xl"
      : pageWidth === "wide"
      ? "max-w-7xl"
      : "max-w-full";

  // Espacement vertical de section
  const spacingClass =
    spacing === "compact"
      ? "py-6 sm:py-8"
      : spacing === "spacious"
      ? "py-16 sm:py-24"
      : "py-10 sm:py-16";

  // Si la section est vide et qu'on n'est PAS en mode édition, on ne rend RIEN (Prompt 08 / Prompt 12)
  if (isEmpty && !isEditMode) {
    return null;
  }

  // Si la section est vide et qu'on est en mode édition, afficher le bloc d'invitation avec bordure pointillée
  if (isEmpty && isEditMode) {
    return (
      <section
        id={id}
        className={cn("px-4 sm:px-6 relative group", spacingClass, className)}
        style={{ backgroundColor: palette.background, color: palette.text }}
      >
        <div className={cn("mx-auto", maxWidthClass)}>
          <div
            onClick={onEdit}
            className="border-2 border-dashed border-amber-400/80 bg-amber-50/50 rounded-3xl p-8 text-center space-y-2 cursor-pointer hover:bg-amber-100/50 transition-all shadow-xs"
          >
            <div className="text-xs font-black text-amber-900 uppercase tracking-wider">
              + Configurer {sectionName || "cette section"}
            </div>
            <p className="text-xs text-amber-800/90 max-w-md mx-auto">
              Cette section est actuellement vide et donc masquée pour les visiteurs publics. Cliquez ici pour ajouter son contenu.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id={id}
      className={cn("relative group transition-colors", spacingClass, className)}
      style={{
        backgroundColor: palette.background,
        color: palette.text,
      }}
    >
      {/* Bouton d'édition flottant en mode administrateur */}
      {isEditMode && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="absolute top-4 right-4 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black shadow-lg hover:bg-amber-400 transition-all cursor-pointer opacity-90 group-hover:opacity-100"
          title={`Modifier ${sectionName || "la section"}`}
        >
          <span>Modifier {sectionName || "la section"}</span>
        </button>
      )}

      <div className={cn("mx-auto px-4 sm:px-6", maxWidthClass, innerClassName)}>
        {children}
      </div>
    </section>
  );
}
