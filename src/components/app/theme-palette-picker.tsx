"use client";

import React, { useState } from "react";
import {
  Check,
  Palette,
  Eye,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Smartphone,
  Monitor,
  ShoppingBag,
} from "lucide-react";
import {
  PRESET_THEME_PALETTES,
  ThemePalette,
  isValidHexColor,
  checkWcagAaCompliance,
  getBestTextColorForBackground,
} from "@/lib/theme-contrast";

interface ThemePalettePickerProps {
  initialPrimaryHex?: string;
  onSavePalette: (primaryHex: string) => void;
}

export function ThemePalettePicker({
  initialPrimaryHex = "#C2410C",
  onSavePalette,
}: ThemePalettePickerProps) {
  const [selectedHex, setSelectedHex] = useState(initialPrimaryHex);
  const [mode, setMode] = useState<"preset" | "product" | "custom">("preset");
  const [customInput, setCustomInput] = useState(initialPrimaryHex);
  const [previewTab, setPreviewTab] = useState<"home" | "catalog" | "product">(
    "home"
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Évaluation contraste par rapport au fond blanc standard et fond sombre
  const contrastOnWhite = checkWcagAaCompliance(selectedHex, "#FFFFFF");
  const buttonTextColor = getBestTextColorForBackground(selectedHex);

  const handleSelectPreset = (palette: ThemePalette) => {
    setSelectedHex(palette.primary);
    setCustomInput(palette.primary);
    setMode("preset");
  };

  const handleCustomChange = (val: string) => {
    let cleanVal = val.trim();
    if (!cleanVal.startsWith("#")) {
      cleanVal = "#" + cleanVal;
    }
    setCustomInput(cleanVal);
    if (isValidHexColor(cleanVal)) {
      setSelectedHex(cleanVal);
    }
  };

  const handleExtractFromProduct = () => {
    // Simulation extraction de couleur d'un produit populaire (ex: Karité or ou Baobab)
    const productColors = ["#B45309", "#0F766E", "#BE185D", "#166534"];
    const picked =
      productColors[Math.floor(Math.random() * productColors.length)];
    setSelectedHex(picked);
    setCustomInput(picked);
    setMode("product");
  };

  const handleSave = () => {
    if (!isValidHexColor(selectedHex)) return;
    onSavePalette(selectedHex);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Sélecteur de mode */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-black/[0.04] border border-black/[0.06] w-fit">
        <button
          type="button"
          onClick={() => setMode("preset")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mode === "preset"
              ? "bg-white text-[#111111] shadow-xs"
              : "text-[#666660] hover:text-[#111111]"
          }`}
        >
          10 Palettes recommandées
        </button>
        <button
          type="button"
          onClick={handleExtractFromProduct}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            mode === "product"
              ? "bg-white text-[#111111] shadow-xs"
              : "text-[#666660] hover:text-[#111111]"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-[#C2410C]" />
          <span>Couleur de mon produit</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            mode === "custom"
              ? "bg-white text-[#111111] shadow-xs"
              : "text-[#666660] hover:text-[#111111]"
          }`}
        >
          <Palette className="h-3.5 w-3.5 text-[#C2410C]" />
          <span>Personnalisée (#RRGGBB)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Colonne Gauche : Sélection & Validation (7 colonnes) */}
        <div className="lg:col-span-7 space-y-6">
          {mode === "preset" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_THEME_PALETTES.map((pal) => {
                const isSelected = selectedHex.toUpperCase() === pal.primary.toUpperCase();
                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => handleSelectPreset(pal)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex items-center gap-3.5 ${
                      isSelected
                        ? "border-[#111111] bg-white ring-2 ring-black/10 shadow-sm"
                        : "border-black/[0.08] bg-white/70 hover:bg-white hover:border-black/20"
                    }`}
                  >
                    <div
                      className="h-10 w-10 rounded-xl shrink-0 shadow-xs flex items-center justify-center"
                      style={{ backgroundColor: pal.primary }}
                    >
                      {isSelected && (
                        <Check className="h-5 w-5 text-white drop-shadow-sm" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-[#111111]">
                          {pal.name}
                        </span>
                        {pal.isPopular && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-orange-100 text-[#C2410C]">
                            Marque
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#666660] truncate mt-0.5">
                        {pal.description}
                      </p>
                      <code className="text-[10px] text-[#888880] font-mono">
                        {pal.primary}
                      </code>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {mode === "product" && (
            <div className="p-5 rounded-2xl bg-white border border-black/[0.08] space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-xl shadow-xs"
                  style={{ backgroundColor: selectedHex }}
                />
                <div>
                  <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                    Couleur extraite de votre photo produit
                  </h4>
                  <p className="text-xs text-[#666660]">
                    Harmonie automatique avec l'identité visuelle de votre produit vedette.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExtractFromProduct}
                className="px-3.5 py-2 rounded-xl border border-black/10 text-xs font-bold text-[#111111] bg-[#FAF8F5] hover:bg-white transition-colors"
              >
                Piocher une autre nuance de produit
              </button>
            </div>
          )}

          {mode === "custom" && (
            <div className="p-5 rounded-2xl bg-white border border-black/[0.08] space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                  Code couleur hexadécimal (#RRGGBB)
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl border border-black/10 shadow-xs shrink-0"
                    style={{
                      backgroundColor: isValidHexColor(customInput)
                        ? customInput
                        : "#FFFFFF",
                    }}
                  />
                  <input
                    type="text"
                    maxLength={7}
                    value={customInput}
                    onChange={(e) => handleCustomChange(e.target.value)}
                    placeholder="#C2410C"
                    className="font-mono text-sm px-3.5 py-2 rounded-xl border border-black/10 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]/30 focus:border-[#C2410C] w-48 uppercase"
                  />
                  {!isValidHexColor(customInput) && (
                    <span className="text-xs font-semibold text-red-600">
                      Format invalide (doit être #RRGGBB)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Contrôle de conformité d'accessibilité WCAG AA */}
          <div
            className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
              contrastOnWhite.isCompliant
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                : "bg-amber-50/80 border-amber-300 text-amber-950"
            }`}
          >
            {contrastOnWhite.isCompliant ? (
              <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">
                  Accessibilité & Lisibilité WCAG AA :
                </span>
                <span className="font-mono font-bold">
                  {contrastOnWhite.scoreText}
                </span>
              </div>
              <p className="text-[11px] mt-1 leading-snug">
                {contrastOnWhite.isCompliant
                  ? "Cette nuance garantit une parfaite visibilité des boutons d'achat et des titres pour tous les clients, même en plein soleil sur mobile."
                  : "Attention : Le contraste avec le fond blanc est inférieur au ratio légal recommandé de 4.5:1. Les boutons d'achat risquent d'être peu lisibles. AfriBuilder ajustera automatiquement la couleur du texte."}
              </p>
            </div>
          </div>

          {/* Enregistrement du jeton de couleur */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C2410C] text-white text-xs font-bold hover:bg-[#9A3412] transition-all shadow-xs cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Appliquer cette palette à ma vitrine</span>
            </button>
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-700 animate-in fade-in">
                Palette enregistrée avec succès !
              </span>
            )}
          </div>
        </div>

        {/* Colonne Droite : Aperçu en Direct (5 colonnes) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#111111] uppercase tracking-wider">
              <Eye className="h-4 w-4 text-[#888880]" />
              <span>Aperçu en direct</span>
            </div>

            {/* Onglets d'aperçu : Accueil, Catalogue, Produit */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/[0.04] text-[11px] font-bold">
              {(
                [
                  { id: "home", label: "Accueil" },
                  { id: "catalog", label: "Catalogue" },
                  { id: "product", label: "Produit" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPreviewTab(tab.id)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    previewTab === tab.id
                      ? "bg-white text-[#111111] shadow-2xs font-extrabold"
                      : "text-[#666660] hover:text-[#111111]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Maquette Smartphone simulée */}
          <div className="rounded-3xl border-4 border-[#111111] bg-white p-3 shadow-xl overflow-hidden max-w-sm mx-auto">
            {/* Header vitrine */}
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
              <div className="flex items-center gap-1.5">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: selectedHex }}
                />
                <span className="text-xs font-black text-[#111111]">Lomé Glow</span>
              </div>
              <ShoppingBag className="h-3.5 w-3.5 text-[#666660]" />
            </div>

            {/* Corps selon l'onglet choisi */}
            {previewTab === "home" && (
              <div className="py-4 space-y-3">
                <div
                  className="p-4 rounded-2xl text-white space-y-2 shadow-xs"
                  style={{ backgroundColor: selectedHex }}
                >
                  <span className="text-[9px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                    Offre Spéciale
                  </span>
                  <h5 className="text-sm font-black leading-tight">
                    Sublimez votre peau avec le Karité Pur
                  </h5>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-xl text-[10px] font-bold shadow-xs cursor-pointer"
                    style={{
                      backgroundColor: buttonTextColor === "#FFFFFF" ? "#111111" : "#FFFFFF",
                      color: buttonTextColor === "#FFFFFF" ? "#FFFFFF" : "#111111",
                    }}
                  >
                    Commander à la livraison
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-[#111111]">
                    Produits Vedettes
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-xl border border-black/[0.08] bg-[#FAF8F5] space-y-1">
                      <div className="h-14 rounded-lg bg-black/10" />
                      <p className="text-[10px] font-bold truncate">Sérum Éclat</p>
                      <p className="text-[11px] font-extrabold" style={{ color: selectedHex }}>
                        12 000 FCFA
                      </p>
                    </div>
                    <div className="p-2 rounded-xl border border-black/[0.08] bg-[#FAF8F5] space-y-1">
                      <div className="h-14 rounded-lg bg-black/10" />
                      <p className="text-[10px] font-bold truncate">Savon Noir</p>
                      <p className="text-[11px] font-extrabold" style={{ color: selectedHex }}>
                        4 500 FCFA
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {previewTab === "catalog" && (
              <div className="py-3 space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold">Catalogue complet</span>
                  <span className="text-[10px] text-[#666660]">8 articles</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="p-2 rounded-xl border border-black/[0.08] space-y-1"
                    >
                      <div className="h-16 rounded-lg bg-black/5 relative">
                        <span
                          className="absolute top-1 left-1 px-1.5 py-0.2 rounded text-[8px] font-bold text-white"
                          style={{ backgroundColor: selectedHex }}
                        >
                          COD
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold truncate">
                        Soin Visage #{i}
                      </p>
                      <p
                        className="text-[11px] font-extrabold"
                        style={{ color: selectedHex }}
                      >
                        15 000 FCFA
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {previewTab === "product" && (
              <div className="py-3 space-y-3">
                <div className="h-24 rounded-2xl bg-black/5" />
                <div>
                  <h5 className="text-xs font-bold text-[#111111]">
                    Crème Régénératrice Baobab
                  </h5>
                  <p
                    className="text-sm font-black mt-0.5"
                    style={{ color: selectedHex }}
                  >
                    18 500 FCFA
                  </p>
                </div>
                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl font-bold text-xs shadow-xs"
                  style={{
                    backgroundColor: selectedHex,
                    color: buttonTextColor,
                  }}
                >
                  Commander et payer à la livraison
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
