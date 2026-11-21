"use client";

import React, { useState } from "react";
import { X, Save, Check, Trash2, Plus, Sparkles, Layers } from "lucide-react";
import { PageSection } from "@/server/data/storefront-types";

interface SectionEditorDrawerProps {
  section: PageSection | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSection: PageSection) => void;
}

export function SectionEditorDrawer({
  section,
  isOpen,
  onClose,
  onSave,
}: SectionEditorDrawerProps) {
  if (!isOpen || !section) return null;

  return (
    <SectionEditorDrawerContent
      key={section.id}
      section={section}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function SectionEditorDrawerContent({
  section,
  onClose,
  onSave,
}: {
  section: PageSection;
  onClose: () => void;
  onSave: (updatedSection: PageSection) => void;
}) {
  const [formData, setFormData] = useState<Record<string, any>>(section.content || {});
  const [isVisible, setIsVisible] = useState(section.isVisible);

  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave({
      ...section,
      isVisible,
      content: formData,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
        {/* En-tête du panneau */}
        <div className="p-5 border-b border-black/[0.08] flex items-center justify-between bg-[#FAF8F5]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              Mode Édition Admin
            </span>
            <h2 className="text-base font-black text-[#111111] mt-1">{section.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#888880] hover:text-[#111111] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps des champs selon le type de section */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Interrupteur Afficher / Masquer cette section */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-black/[0.06] flex items-center justify-between">
            <div>
              <span className="font-bold text-[#111111] block">Afficher cette section</span>
              <span className="text-[10px] text-[#888880]">
                {isVisible ? "Visible pour le public" : "Masquée pour le public"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsVisible(!isVisible)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                isVisible ? "bg-emerald-600" : "bg-stone-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  isVisible ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Formulaire Hero */}
          {section.type === "hero" && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#111111] mb-1">Titre d'accroche (Headline) *</label>
                <input
                  type="text"
                  value={formData.headline || ""}
                  onChange={(e) => handleFieldChange("headline", e.target.value)}
                  placeholder="Ex: Commandez vos produits d'exception en 1 clic"
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-[#111111] mb-1">Sous-titre explicatif</label>
                <textarea
                  rows={3}
                  value={formData.subheadline || ""}
                  onChange={(e) => handleFieldChange("subheadline", e.target.value)}
                  placeholder="Ex: Payez en espèces au livreur après vérification."
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-[#111111] mb-1">Texte du bouton CTA</label>
                <input
                  type="text"
                  value={formData.ctaText || "Commander maintenant"}
                  onChange={(e) => handleFieldChange("ctaText", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-[#111111] mb-1">Badge rassurant (au-dessus du titre)</label>
                <input
                  type="text"
                  value={formData.badgeText || ""}
                  onChange={(e) => handleFieldChange("badgeText", e.target.value)}
                  placeholder="Ex: 🌿 Ingrédients 100% naturels"
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs font-semibold"
                />
              </div>
            </div>
          )}

          {/* Formulaire Réassurance (Benefits) */}
          {section.type === "benefits" && (
            <div className="space-y-3">
              <p className="text-[11px] text-[#666660]">
                Configurez les 4 piliers de réassurance affichés à vos clients.
              </p>
              {(formData.items || []).map((item: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl border border-black/[0.08] bg-stone-50 space-y-2">
                  <span className="font-bold text-[#111111] block">Pilier {idx + 1}</span>
                  <input
                    type="text"
                    value={item.title || ""}
                    onChange={(e) => {
                      const updated = [...(formData.items || [])];
                      updated[idx] = { ...updated[idx], title: e.target.value };
                      handleFieldChange("items", updated);
                    }}
                    placeholder="Titre du pilier"
                    className="w-full px-2.5 py-1.5 rounded-lg border bg-white font-semibold"
                  />
                  <textarea
                    rows={2}
                    value={item.description || ""}
                    onChange={(e) => {
                      const updated = [...(formData.items || [])];
                      updated[idx] = { ...updated[idx], description: e.target.value };
                      handleFieldChange("items", updated);
                    }}
                    placeholder="Description rassurante"
                    className="w-full px-2.5 py-1.5 rounded-lg border bg-white text-[11px]"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Formulaire Histoire de la marque & À propos */}
          {section.type === "brand_story" && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#111111] mb-1">Titre de la section</label>
                <input
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  placeholder="Notre mission"
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-[#111111] mb-1">Texte de présentation authentique</label>
                <textarea
                  rows={4}
                  value={formData.text || ""}
                  onChange={(e) => handleFieldChange("text", e.target.value)}
                  placeholder="Racontez la genèse de votre boutique..."
                  className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs"
                />
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border space-y-1">
                <label className="flex items-center gap-2 font-bold text-[#111111] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.showDeliveredCount)}
                    onChange={(e) => handleFieldChange("showDeliveredCount", e.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  <span>Afficher le nombre de colis livrés réels</span>
                </label>
                <p className="text-[10px] text-[#888880] pl-6">
                  Le chiffre sera calculé automatiquement depuis vos commandes réelles livrées.
                  Aucun chiffre inventé ne sera affiché.
                </p>
              </div>
            </div>
          )}

          {/* Formulaire FAQ */}
          {section.type === "faq" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#111111]">Questions & Réponses</span>
                <button
                  type="button"
                  onClick={() => {
                    const questions = formData.questions || [];
                    handleFieldChange("questions", [
                      ...questions,
                      { q: "Nouvelle question ?", a: "Réponse claire pour vos clients." },
                    ]);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg"
                >
                  <Plus className="w-3 h-3" />
                  <span>Ajouter une question</span>
                </button>
              </div>

              {(formData.questions || []).map((qItem: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl border border-black/[0.08] bg-stone-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-[#111111]">Q{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (formData.questions || []).filter((_: any, i: number) => i !== idx);
                        handleFieldChange("questions", updated);
                      }}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={qItem.q || ""}
                    onChange={(e) => {
                      const updated = [...(formData.questions || [])];
                      updated[idx] = { ...updated[idx], q: e.target.value };
                      handleFieldChange("questions", updated);
                    }}
                    placeholder="Question posée par les clients"
                    className="w-full px-2.5 py-1.5 rounded-lg border bg-white font-semibold text-xs"
                  />
                  <textarea
                    rows={2}
                    value={qItem.a || ""}
                    onChange={(e) => {
                      const updated = [...(formData.questions || [])];
                      updated[idx] = { ...updated[idx], a: e.target.value };
                      handleFieldChange("questions", updated);
                    }}
                    placeholder="Réponse apportée"
                    className="w-full px-2.5 py-1.5 rounded-lg border bg-white text-[11px]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pied de page du panneau */}
        <div className="p-4 border-t border-black/[0.08] bg-[#FAF8F5] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-black/15 text-xs font-bold text-[#666660] hover:text-[#111111] transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Enregistrer les modifications</span>
          </button>
        </div>
      </div>
    </div>
  );
}
