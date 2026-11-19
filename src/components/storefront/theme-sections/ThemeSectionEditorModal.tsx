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
} from "lucide-react";
import { ThemeSection, ThemePaletteId, ThemeColorPalette } from "@/lib/theme-engine/types";
import { SECTION_SCHEMAS, validateComparisonParity } from "@/lib/theme-engine/schemas";
import { cn } from "@/lib/utils";

interface ThemeSectionEditorModalProps {
  section: ThemeSection | null;
  isOpen: boolean;
  palettes: ThemeColorPalette[];
  onClose: () => void;
  onSave: (updatedSection: ThemeSection) => void;
  onDelete?: (sectionId: string) => void;
}

export function ThemeSectionEditorModal({
  section,
  isOpen,
  palettes = [],
  onClose,
  onSave,
  onDelete,
}: ThemeSectionEditorModalProps) {
  if (!isOpen || !section) return null;

  const [settings, setSettings] = useState<Record<string, any>>(section.settings || {});
  const [isVisible, setIsVisible] = useState(section.isVisible);
  const [paletteId, setPaletteId] = useState<ThemePaletteId>(section.paletteId || "palette-1");
  const [name, setName] = useState(section.name || "");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFieldChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setValidationError(null);

    // Validation Zod de la section
    const schema = SECTION_SCHEMAS[section.type];
    if (schema) {
      const result = schema.safeParse(settings);
      if (!result.success) {
        setValidationError(result.error.issues?.[0]?.message || (result.error as any).errors?.[0]?.message || "Erreur de validation des champs");
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
                Édition Thème Novika
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
              <span className="font-bold text-[#111111] block">Visibilité sur la boutique</span>
              <span className="text-[10px] text-[#888880]">
                {isVisible ? "Affiché si du contenu est renseigné" : "Masqué pour le public"}
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

          {/* FORMULAIRES SPÉCIFIQUES SELON TYPE */}

          {/* 1. Hero Banner */}
          {section.type === "hero_banner" && (
            <div className="space-y-3.5">
              <div>
                <label className="block font-bold text-[#111111] mb-1">Titre d'accroche principal (Headline)</label>
                <input
                  type="text"
                  value={settings.headline || ""}
                  onChange={(e) => handleFieldChange("headline", e.target.value)}
                  placeholder="Ex: Soins naturels d'Afrique de l'Ouest"
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-[#111111] mb-1">Sous-titre d'accompagnement</label>
                <textarea
                  rows={2}
                  value={settings.subheadline || ""}
                  onChange={(e) => handleFieldChange("subheadline", e.target.value)}
                  placeholder="Ex: Commandez aujourd'hui et payez en espèces à la livraison..."
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#111111] mb-1">Badge d'accroche</label>
                  <input
                    type="text"
                    value={settings.badgeText || ""}
                    onChange={(e) => handleFieldChange("badgeText", e.target.value)}
                    placeholder="Ex: Nouveau COD"
                    className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#111111] mb-1">Hauteur de bannière</label>
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
                    placeholder="Commander maintenant"
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

              <div>
                <label className="block font-bold text-[#111111] mb-1">
                  Calque d'assombrissement ({settings.overlayOpacity ?? 30}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={settings.overlayOpacity ?? 30}
                  onChange={(e) => handleFieldChange("overlayOpacity", Number(e.target.value))}
                  className="w-full"
                />
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

          {/* 3. Comparison Table */}
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
              <label className="block font-bold">Lignes du tableau comparatif</label>
              {(settings.rows || []).map((row: any, idx: number) => (
                <div key={row.id || idx} className="p-3 rounded-xl border bg-stone-50 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={row.criterion || ""}
                      onChange={(e) => {
                        const updated = [...(settings.rows || [])];
                        updated[idx] = { ...row, criterion: e.target.value };
                        handleFieldChange("rows", updated);
                      }}
                      placeholder="Critère (ex: Paiement à la livraison)"
                      className="flex-1 px-2.5 py-1.5 rounded-lg border text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (settings.rows || []).filter((_: any, i: number) => i !== idx);
                        handleFieldChange("rows", updated);
                      }}
                      className="text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-4 text-[11px] font-bold">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={row.ourShopValue === true}
                        onChange={(e) => {
                          const updated = [...(settings.rows || [])];
                          updated[idx] = { ...row, ourShopValue: e.target.checked };
                          handleFieldChange("rows", updated);
                        }}
                      />
                      <span>Nous (Oui)</span>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={row.competitorValue === true}
                        onChange={(e) => {
                          const updated = [...(settings.rows || [])];
                          updated[idx] = { ...row, competitorValue: e.target.checked };
                          handleFieldChange("rows", updated);
                        }}
                      />
                      <span>Eux (Oui)</span>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={row.isParity === true}
                        onChange={(e) => {
                          const updated = [...(settings.rows || [])];
                          updated[idx] = { ...row, isParity: e.target.checked };
                          handleFieldChange("rows", updated);
                        }}
                      />
                      <span className="text-amber-700">Point d'égalité</span>
                    </label>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const updated = [
                    ...(settings.rows || []),
                    {
                      id: Math.random().toString(36).slice(2, 7),
                      criterion: "",
                      ourShopValue: true,
                      competitorValue: false,
                      isParity: false,
                    },
                  ];
                  handleFieldChange("rows", updated);
                }}
                className="px-3 py-1.5 rounded-xl border border-dashed border-black/20 text-xs font-bold hover:bg-black/5"
              >
                + Ajouter une ligne de critère
              </button>
            </div>
          )}

          {/* 4. FAQ */}
          {section.type === "faq" && (
            <div className="space-y-3">
              <label className="block font-bold">Questions / Réponses</label>
              {(settings.items || []).map((faq: any, idx: number) => (
                <div key={faq.id || idx} className="p-3 rounded-xl border bg-stone-50 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={faq.question || ""}
                      onChange={(e) => {
                        const updated = [...(settings.items || [])];
                        updated[idx] = { ...faq, question: e.target.value };
                        handleFieldChange("items", updated);
                      }}
                      placeholder="Question..."
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
                  <textarea
                    rows={2}
                    value={faq.answer || ""}
                    onChange={(e) => {
                      const updated = [...(settings.items || [])];
                      updated[idx] = { ...faq, answer: e.target.value };
                      handleFieldChange("items", updated);
                    }}
                    placeholder="Réponse..."
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const updated = [
                    ...(settings.items || []),
                    { id: Math.random().toString(36).slice(2, 7), question: "", answer: "" },
                  ];
                  handleFieldChange("items", updated);
                }}
                className="px-3 py-1.5 rounded-xl border border-dashed border-black/20 text-xs font-bold hover:bg-black/5"
              >
                + Ajouter une question
              </button>
            </div>
          )}

          {/* 5. WhatsApp Block */}
          {section.type === "whatsapp_block" && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold mb-1">Numéro WhatsApp (avec indicatif pays)</label>
                <input
                  type="text"
                  value={settings.phoneNumber || ""}
                  onChange={(e) => handleFieldChange("phoneNumber", e.target.value)}
                  placeholder="Ex: +22890000000 ou +22507000000"
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Message d'accueil pré-rempli</label>
                <input
                  type="text"
                  value={settings.defaultMessage || ""}
                  onChange={(e) => handleFieldChange("defaultMessage", e.target.value)}
                  placeholder="Bonjour, j'aimerais commander..."
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pied du panneau : Enregistrer & Supprimer */}
        <div className="p-4 sm:p-5 border-t border-black/[0.08] flex items-center justify-between bg-[#FAF8F5]">
          {onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Supprimer définitivement cette section "${name}" ?`)) {
                  onDelete(section.id);
                  onClose();
                }
              }}
              className="px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer</span>
            </button>
          ) : <div />}

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
