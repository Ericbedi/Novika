"use client";

import React, { useState } from "react";
import {
  X,
  Save,
  Trash2,
  Plus,
  Sparkles,
  Palette,
  AlertTriangle,
  HelpCircle,
  Eye,
  EyeOff,
  RotateCcw,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { ThemeSection, ThemePaletteId, ThemeColorPalette } from "@/lib/theme-engine/types";
import { SECTION_SCHEMAS, validateComparisonParity } from "@/lib/theme-engine/schemas";
import { getSectionDefaultSettings } from "@/lib/theme-engine/novika-simple";
import { ImagePicker, SelectedImageData } from "@/components/media/ImagePicker";
import { cn } from "@/lib/utils";

interface ThemeSectionEditorModalProps {
  section: ThemeSection | null;
  isOpen: boolean;
  palettes: ThemeColorPalette[];
  storeSlug?: string;
  onClose: () => void;
  onSave: (updatedSection: ThemeSection) => void;
  onDelete?: (sectionId: string) => void;
}

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  storeSlug?: string;
  helpText?: string;
}

function ImageFieldWithPicker({ label, value, onChange, storeSlug = "lome-glow", helpText }: ImageFieldProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <label className="block font-bold text-[#111111] text-xs">{label}</label>
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E6E0D4]">
        {value ? (
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/5 border border-black/10 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={label} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-xl border border-dashed border-[#CCCCCC] flex flex-col items-center justify-center text-[#888880] shrink-0 bg-white">
            <ImageIcon className="h-5 w-5" />
            <span className="text-[9px] font-bold mt-1">Aucune</span>
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111111] text-white text-[11px] font-bold hover:bg-black transition-colors"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>{value ? "Remplacer l'image" : "Choisir une image"}</span>
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-bold transition-colors"
              >
                Supprimer
              </button>
            )}
          </div>
          {helpText && <p className="text-[10px] text-[#666660] leading-tight">{helpText}</p>}
        </div>
      </div>

      <ImagePicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        storeSlug={storeSlug}
        context="theme"
        onSelectImage={(data: SelectedImageData) => {
          onChange(data.url);
          setIsPickerOpen(false);
        }}
      />
    </div>
  );
}

interface ThemeSectionEditorContentProps {
  section: ThemeSection;
  palettes: ThemeColorPalette[];
  storeSlug?: string;
  onClose: () => void;
  onSave: (updatedSection: ThemeSection) => void;
  onDelete?: (sectionId: string) => void;
}

function ThemeSectionEditorContent({
  section,
  palettes = [],
  storeSlug = "lome-glow",
  onClose,
  onSave,
  onDelete,
}: ThemeSectionEditorContentProps) {
  const [settings, setSettings] = useState<Record<string, any>>(section.settings || {});
  const [isVisible, setIsVisible] = useState(section.isVisible);
  const [paletteId, setPaletteId] = useState<ThemePaletteId>(section.paletteId || "palette-1");
  const [name, setName] = useState(section.name || "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [restoredNotification, setRestoredNotification] = useState(false);

  const handleFieldChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleRestoreDefaults = () => {
    const defaults = getSectionDefaultSettings(section.type);
    if (defaults) {
      setSettings(defaults);
      setRestoredNotification(true);
      setTimeout(() => setRestoredNotification(false), 3000);
    }
  };

  const handleSave = () => {
    setValidationError(null);

    // Validation Zod de la section
    const schema = SECTION_SCHEMAS[section.type];
    if (schema) {
      const result = schema.safeParse(settings);
      if (!result.success) {
        setValidationError(
          result.error.issues?.[0]?.message ||
            (result.error as any).errors?.[0]?.message ||
            "Erreur de validation des champs"
        );
        return;
      }
    }

    onSave({
      ...section,
      name,
      isVisible,
      paletteId,
      settings,
    });
    onClose();
  };

  // Alerte de parité si section tableau comparatif
  const parityWarning =
    section.type === "comparison_table"
      ? validateComparisonParity(settings.rows || []).warning
      : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
        {/* En-tête */}
        <div className="p-4 sm:p-5 border-b border-black/[0.08] flex items-center justify-between bg-[#FAF8F5]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">
                Édition Thème Novika Simple
              </span>
              <span className="text-[10px] font-mono opacity-50">{section.type}</span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-[#111111]">
              {name || section.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#888880] hover:text-[#111111] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps des réglages */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {restoredNotification && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Contenu d'origine du modèle « Novika Simple » restauré !</span>
            </div>
          )}

          {/* Choix de la Palette de couleurs (1 à 5) */}
          <div className="space-y-2">
            <label className="font-black text-[#111111] flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>Palette de couleurs appliquée à cette section :</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {palettes.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPaletteId(p.id)}
                  className={cn(
                    "p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1",
                    paletteId === p.id
                      ? "border-[#111111] ring-2 ring-black/10 shadow-xs"
                      : "border-black/[0.08] hover:border-black/20"
                  )}
                  style={{ backgroundColor: p.background }}
                >
                  <div className="flex gap-0.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.text }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.button }} />
                  </div>
                  <span
                    className="text-[9px] font-black truncate max-w-full"
                    style={{ color: p.text }}
                  >
                    {p.name.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Visibilité publique */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-black/[0.06] flex items-center justify-between">
            <div>
              <span className="font-bold text-[#111111] block">Visibilité sur la vitrine</span>
              <span className="text-[10px] text-[#888880]">
                {isVisible ? "Visible (masquage automatique si vide)" : "Masquée manuellement"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsVisible(!isVisible)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5",
                isVisible ? "bg-emerald-600 text-white" : "bg-stone-200 text-stone-700"
              )}
            >
              {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{isVisible ? "Visible" : "Masquée"}</span>
            </button>
          </div>

          {/* ========================================================== */}
          {/* FORMULAIRES DES 8 SECTIONS « NOVIKA SIMPLE »              */}
          {/* ========================================================== */}

          {/* 1. Hero Banner */}
          {section.type === "hero_banner" && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-[#111111] mb-1">Titre d'accroche principal</label>
                <input
                  type="text"
                  value={settings.headline || ""}
                  onChange={(e) => handleFieldChange("headline", e.target.value)}
                  placeholder="Ex: Découvrez notre sélection exclusive"
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-[#111111] mb-1">Sous-titre d'accompagnement</label>
                <textarea
                  rows={2}
                  value={settings.subheadline || ""}
                  onChange={(e) => handleFieldChange("subheadline", e.target.value)}
                  placeholder="Ex: Commandez en ligne en 30 secondes et payez en espèces à la livraison..."
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs font-medium"
                />
              </div>

              <ImageFieldWithPicker
                label="Image de fond (Ordinateur)"
                value={settings.desktopImage || ""}
                onChange={(url) => handleFieldChange("desktopImage", url)}
                storeSlug={storeSlug}
                helpText="Recommandé : 1920×1080 px en format WebP ou JPEG."
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#111111] mb-1">Badge d'accroche</label>
                  <input
                    type="text"
                    value={settings.badgeText || ""}
                    onChange={(e) => handleFieldChange("badgeText", e.target.value)}
                    placeholder="Ex: Nouveauté COD"
                    className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#111111] mb-1">Hauteur</label>
                  <select
                    value={settings.height || "medium"}
                    onChange={(e) => handleFieldChange("height", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs font-bold"
                  >
                    <option value="small">Compacte (340px)</option>
                    <option value="medium">Standard (440px)</option>
                    <option value="large">Spacieuse (560px)</option>
                    <option value="full">Plein écran</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#111111] mb-1">Bouton 1 (Texte)</label>
                  <input
                    type="text"
                    value={settings.button1Text || ""}
                    onChange={(e) => handleFieldChange("button1Text", e.target.value)}
                    placeholder="Voir les produits"
                    className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#111111] mb-1">Bouton 1 (Lien)</label>
                  <input
                    type="text"
                    value={settings.button1Link || ""}
                    onChange={(e) => handleFieldChange("button1Link", e.target.value)}
                    placeholder="#catalog-section"
                    className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Announcement Bar */}
          {section.type === "announcement_bar" && (
            <div className="space-y-3">
              <label className="block font-bold text-[#111111]">Messages du bandeau (1 à 5)</label>
              {(settings.messages || []).map((msg: any, idx: number) => (
                <div key={msg.id || idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={msg.text || ""}
                    onChange={(e) => {
                      const updated = [...(settings.messages || [])];
                      updated[idx] = { ...msg, text: e.target.value };
                      handleFieldChange("messages", updated);
                    }}
                    placeholder={`Message ${idx + 1}`}
                    className="flex-1 px-3 py-2 rounded-xl border border-black/15 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (settings.messages || []).filter((_: any, i: number) => i !== idx);
                      handleFieldChange("messages", updated);
                    }}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {(settings.messages || []).length < 5 && (
                <button
                  type="button"
                  onClick={() => {
                    const updated = [
                      ...(settings.messages || []),
                      { id: Math.random().toString(36).slice(2, 7), text: "", linkUrl: "" },
                    ];
                    handleFieldChange("messages", updated);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-dashed border-black/20 text-xs font-bold hover:bg-black/5"
                >
                  + Ajouter un message
                </button>
              )}
            </div>
          )}

          {/* 3. Coups de cœur (Featured Products) */}
          {section.type === "featured_products" && (
            <div className="space-y-3.5">
              <div>
                <label className="block font-bold text-[#111111] mb-1">Titre de la section</label>
                <input
                  type="text"
                  value={settings.title || ""}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  placeholder="Nos Coups de Cœur"
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-[#111111] mb-1">Sous-titre explicatif</label>
                <input
                  type="text"
                  value={settings.subtitle || ""}
                  onChange={(e) => handleFieldChange("subtitle", e.target.value)}
                  placeholder="Les produits les plus demandés..."
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Nombre max de produits</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={settings.maxProducts ?? 4}
                    onChange={(e) => handleFieldChange("maxProducts", Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Colonnes (Ordinateur)</label>
                  <select
                    value={settings.columnsDesktop ?? 4}
                    onChange={(e) => handleFieldChange("columnsDesktop", Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs font-bold"
                  >
                    <option value={2}>2 colonnes</option>
                    <option value={3}>3 colonnes</option>
                    <option value={4}>4 colonnes</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 4. Bannière promotionnelle (Image with text) */}
          {section.type === "image_with_text" && (
            <div className="space-y-3.5">
              <div>
                <label className="block font-bold text-[#111111] mb-1">Titre de la bannière</label>
                <input
                  type="text"
                  value={settings.title || ""}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  placeholder="Offre Spéciale du Moment"
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-[#111111] mb-1">Badge d'accroche</label>
                <input
                  type="text"
                  value={settings.badge || ""}
                  onChange={(e) => handleFieldChange("badge", e.target.value)}
                  placeholder="Livraison Offerte"
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#111111] mb-1">Description / Argumentaire</label>
                <textarea
                  rows={3}
                  value={settings.bodyText || ""}
                  onChange={(e) => handleFieldChange("bodyText", e.target.value)}
                  placeholder="Détaillez votre offre ou votre promesse..."
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs"
                />
              </div>

              <ImageFieldWithPicker
                label="Image de l'offre"
                value={settings.imageUrl || ""}
                onChange={(url) => handleFieldChange("imageUrl", url)}
                storeSlug={storeSlug}
                helpText="Choisissez une photo valorisante de votre produit ou pack."
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#111111] mb-1">Bouton d'action</label>
                  <input
                    type="text"
                    value={settings.buttonText || ""}
                    onChange={(e) => handleFieldChange("buttonText", e.target.value)}
                    placeholder="Commander maintenant"
                    className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#111111] mb-1">Position de l'image</label>
                  <select
                    value={settings.imagePosition || "right"}
                    onChange={(e) => handleFieldChange("imagePosition", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs font-bold"
                  >
                    <option value="left">Image à gauche</option>
                    <option value="right">Image à droite</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 5. Notre histoire (Rich text) */}
          {section.type === "rich_text" && (
            <div className="space-y-3.5">
              <div>
                <label className="block font-bold text-[#111111] mb-1">Titre</label>
                <input
                  type="text"
                  value={settings.title || ""}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  placeholder="Notre Engagement & Notre Histoire"
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-[#111111] mb-1">Sous-titre</label>
                <input
                  type="text"
                  value={settings.subtitle || ""}
                  onChange={(e) => handleFieldChange("subtitle", e.target.value)}
                  placeholder="La qualité au meilleur prix..."
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-[#111111] mb-1">Texte de présentation</label>
                <textarea
                  rows={4}
                  value={settings.content || ""}
                  onChange={(e) => handleFieldChange("content", e.target.value)}
                  placeholder="Racontez votre histoire et vos engagements de paiement à la réception..."
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs"
                />
              </div>
            </div>
          )}

          {/* 6. Pourquoi nous choisir (Reassurance) */}
          {section.type === "reassurance" && (
            <div className="space-y-3.5">
              <div>
                <label className="block font-bold text-[#111111] mb-1">Titre de la réassurance</label>
                <input
                  type="text"
                  value={settings.title || ""}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  placeholder="Pourquoi nous choisir"
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs font-bold"
                />
              </div>
              <label className="block font-bold text-[#111111]">Points de confiance (3 recommandés)</label>
              {(settings.items || []).map((item: any, idx: number) => (
                <div key={item.id || idx} className="p-3 rounded-xl bg-stone-50 border border-black/10 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={item.title || ""}
                      onChange={(e) => {
                        const updated = [...(settings.items || [])];
                        updated[idx] = { ...item, title: e.target.value };
                        handleFieldChange("items", updated);
                      }}
                      placeholder="Titre (ex: Paiement à la Livraison)"
                      className="flex-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (settings.items || []).filter((_: any, i: number) => i !== idx);
                        handleFieldChange("items", updated);
                      }}
                      className="text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.description || ""}
                    onChange={(e) => {
                      const updated = [...(settings.items || [])];
                      updated[idx] = { ...item, description: e.target.value };
                      handleFieldChange("items", updated);
                    }}
                    placeholder="Description courte..."
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const updated = [
                    ...(settings.items || []),
                    { id: Math.random().toString(36).slice(2, 7), iconName: "ShieldCheck", title: "", description: "" },
                  ];
                  handleFieldChange("items", updated);
                }}
                className="px-3 py-1.5 rounded-xl border border-dashed border-black/20 text-xs font-bold hover:bg-black/5"
              >
                + Ajouter un point fort
              </button>
            </div>
          )}

          {/* 7. Avis réels (Verified reviews) */}
          {section.type === "verified_reviews" && (
            <div className="space-y-3.5">
              <div>
                <label className="block font-bold text-[#111111] mb-1">Titre de la section avis</label>
                <input
                  type="text"
                  value={settings.title || ""}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  placeholder="Avis Clients Vérifiés"
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs font-bold"
                />
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
                <p className="font-bold">Intégrité & Transparence Novika</p>
                <p className="text-[11px] leading-relaxed">
                  Cette section affiche automatiquement les retours d'expérience et notes réelles des commandes livrées par vos livreurs ou agences.
                </p>
              </div>
            </div>
          )}

          {/* 8. WhatsApp Block (Appel final) */}
          {section.type === "whatsapp_block" && (
            <div className="space-y-3.5">
              <div>
                <label className="block font-bold mb-1">Numéro WhatsApp (avec indicatif pays)</label>
                <input
                  type="text"
                  value={settings.phoneNumber || ""}
                  onChange={(e) => handleFieldChange("phoneNumber", e.target.value)}
                  placeholder="Ex: +22890001122"
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Message pré-rempli</label>
                <input
                  type="text"
                  value={settings.defaultMessage || ""}
                  onChange={(e) => handleFieldChange("defaultMessage", e.target.value)}
                  placeholder="Bonjour, je souhaite commander un article..."
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Libellé du bouton</label>
                <input
                  type="text"
                  value={settings.buttonLabel || ""}
                  onChange={(e) => handleFieldChange("buttonLabel", e.target.value)}
                  placeholder="Commander sur WhatsApp"
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs"
                />
              </div>
            </div>
          )}

          {/* Tableau comparatif */}
          {section.type === "comparison_table" && (
            <div className="space-y-4">
              {parityWarning && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{parityWarning}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Nom notre boutique</label>
                  <input
                    type="text"
                    value={settings.ourLabel || ""}
                    onChange={(e) => handleFieldChange("ourLabel", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Nom concurrence</label>
                  <input
                    type="text"
                    value={settings.competitorLabel || ""}
                    onChange={(e) => handleFieldChange("competitorLabel", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pied du panneau : Restaurer le contenu d'origine, Annuler, Enregistrer */}
        <div className="p-4 sm:p-5 border-t border-black/[0.08] flex items-center justify-between bg-[#FAF8F5] gap-2 flex-wrap">
          <button
            type="button"
            id="btn-restore-section-defaults"
            onClick={handleRestoreDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6E0D4] bg-white hover:bg-black/5 text-xs font-bold text-[#666660] hover:text-[#111111] transition-colors cursor-pointer"
            title="Restaurer le texte et les réglages initiaux de cette section"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurer l'original</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-black/15 text-xs font-bold hover:bg-black/5 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              id="btn-save-theme-section"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-[#111111] text-white text-xs font-black hover:bg-black/80 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ThemeSectionEditorModal(props: ThemeSectionEditorModalProps) {
  if (!props.isOpen || !props.section) return null;
  return <ThemeSectionEditorContent {...props} section={props.section} />;
}
