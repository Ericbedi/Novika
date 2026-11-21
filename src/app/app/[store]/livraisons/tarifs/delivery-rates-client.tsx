"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Building2,
  Bike,
  CheckCircle2,
  Check,
  Edit,
  Trash2,
  Sparkles,
  Info,
} from "lucide-react";
import { DeliveryRate } from "@/server/data/types";
import { MOCK_DELIVERY_RATES } from "@/mock-data/delivery-rates";
import { formatFcfa } from "@/lib/money";
import { CountryChip } from "@/components/app/bits";
import { cn } from "@/lib/utils";

export function DeliveryRatesClient({ storeSlug }: { storeSlug: string }) {
  const [rates, setRates] = useState<DeliveryRate[]>(MOCK_DELIVERY_RATES);
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);

  // Form states
  const [country, setCountry] = useState<"BJ" | "CI" | "SN" | "TG">("TG");
  const [city, setCity] = useState("Lomé");
  const [zone, setZone] = useState("Agoè, Tokoin, Bè");
  const [entityType, setEntityType] = useState<"agency" | "rider">("agency");
  const [entityName, setEntityName] = useState("");
  const [standardFee, setStandardFee] = useState<number>(1500);
  const [expressFee, setExpressFee] = useState<number>(2500);
  const [suburbFee, setSuburbFee] = useState<number>(3000);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredRates = rates.filter(
    (r) => selectedCountry === "all" || r.country === selectedCountry
  );

  const handleOpenAdd = () => {
    setEditingRateId(null);
    setCountry("TG");
    setCity("Lomé");
    setZone("Centre-ville");
    setEntityType("agency");
    setEntityName("");
    setStandardFee(1500);
    setExpressFee(2500);
    setSuburbFee(3000);
    setIsModalOpen(true);
  };

  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRateId) {
      setRates((prev) =>
        prev.map((r) =>
          r.id === editingRateId
            ? {
                ...r,
                country,
                city,
                zone,
                entityType,
                entityName,
                standardFee,
                expressFee,
                suburbFee,
                updatedAt: "Aujourd'hui",
              }
            : r
        )
      );
      showToast("Grille tarifaire mise à jour !");
    } else {
      const newRate: DeliveryRate = {
        id: `rate_${Date.now()}`,
        country,
        city,
        zone,
        entityType,
        entityId: `ent_${Date.now()}`,
        entityName: entityName || "Coursier Partenaire",
        standardFee,
        expressFee,
        suburbFee,
        updatedAt: "Aujourd'hui",
      };
      setRates((prev) => [...prev, newRate]);
      showToast("Nouveau tarif de livraison enregistré !");
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-24">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#111111] text-[#FAF8F5] px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
              Logistique & Finances
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            Tarifs de Livraison par Zone & Partenaire
          </h1>
          <p className="text-xs text-[#666660] mt-0.5">
            Configurez les forfaits standards, express et banlieue par pays et agence. Ces tarifs alimentent automatiquement les frais de livraison dans vos calculs de rentabilité.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/app/${storeSlug}/livraisons`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/[0.08] bg-[#FAF8F5] text-xs font-bold text-[#111111] hover:bg-black/5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Tournées de livraison</span>
          </Link>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111111] text-xs font-bold text-[#FAF8F5] hover:bg-black cursor-pointer shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau tarif</span>
          </button>
        </div>
      </div>

      {/* Notice informative RLS & Finances */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-3 text-xs text-amber-950">
        <Info className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Liaison automatique avec les résultats financiers :</p>
          <p className="text-[#666660]">
            Chaque livraison réussie applique le tarif configuré ici pour déduire les frais réels du chiffre d'affaires encaissé et calculer le résultat net exact de la boutique.
          </p>
        </div>
      </div>

      {/* Filtres par Pays */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedCountry("all")}
          className={cn(
            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
            selectedCountry === "all" ? "bg-[#111111] text-[#FAF8F5]" : "bg-white text-[#666660] border border-black/[0.08]"
          )}
        >
          Tous les pays ({rates.length})
        </button>
        {(["TG", "CI", "SN", "BJ"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setSelectedCountry(c)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
              selectedCountry === c ? "bg-[#111111] text-[#FAF8F5]" : "bg-white text-[#666660] border border-black/[0.08]"
            )}
          >
            <CountryChip code={c} showName={true} />
          </button>
        ))}
      </div>

      {/* Grille des Tarifs */}
      {filteredRates.length === 0 ? (
        <div className="p-12 text-center rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] text-xs text-[#888880] space-y-2">
          <p className="font-bold text-[#111111] text-sm">Aucun tarif de livraison configuré.</p>
          <p>Cliquez sur "Ajouter un tarif" pour définir les frais de livraison par pays, ville et zone.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRates.map((r) => (
            <div
              key={r.id}
              className="p-5 rounded-[22px] border border-black/[0.08] bg-[#FAF8F5] shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <CountryChip code={r.country} showName={true} />
                  <span className="text-[10px] text-[#888880] font-mono">Mis à jour {r.updatedAt}</span>
                </div>

                <div className="mt-3">
                  <h3 className="font-black text-sm text-[#111111]">{r.city}</h3>
                  <p className="text-xs text-[#666660] mt-0.5 line-clamp-2">{r.zone}</p>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#111111]">
                  {r.entityType === "agency" ? (
                    <Building2 className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Bike className="h-4 w-4 text-amber-600" />
                  )}
                  <span>{r.entityName}</span>
                </div>
              </div>

              {/* Tarifs Détaillés */}
              <div className="pt-3 border-t border-black/[0.06] space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#666660]">Livraison Standard :</span>
                  <strong className="font-black text-[#111111]">{formatFcfa(r.standardFee)}</strong>
                </div>
                {r.expressFee && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#888880]">Course Express :</span>
                    <span className="font-bold text-[#111111]">{formatFcfa(r.expressFee)}</span>
                  </div>
                )}
                {r.suburbFee && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#888880]">Banlieue / Hors zone :</span>
                    <span className="font-bold text-[#111111]">{formatFcfa(r.suburbFee)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale d'Ajout / Modification Tarif */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-[#111111]">
              {editingRateId ? "Modifier le tarif de livraison" : "Ajouter un tarif de livraison"}
            </h3>

            <form onSubmit={handleSaveRate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#111111] mb-1">Pays *</label>
                  <select
                    value={country}
                    onChange={(e: any) => setCountry(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                  >
                    <option value="TG">🇹🇬 Togo</option>
                    <option value="CI">🇨🇮 Côte d'Ivoire</option>
                    <option value="SN">🇸🇳 Sénégal</option>
                    <option value="BJ">🇧🇯 Bénin</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#111111] mb-1">Type d'entité</label>
                  <select
                    value={entityType}
                    onChange={(e: any) => setEntityType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                  >
                    <option value="agency">Agence de livraison</option>
                    <option value="rider">Livreur indépendant</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">Nom du partenaire ou agence *</label>
                <input
                  type="text"
                  required
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  placeholder="Ex: Flash Colis Express ou Mamadou Moto"
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">Ville & Secteur *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Abidjan (Cocody, Plateau)"
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-[#111111] mb-1">Standard (FCFA)</label>
                  <input
                    type="number"
                    required
                    value={standardFee}
                    onChange={(e) => setStandardFee(Number(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#111111] mb-1">Express (FCFA)</label>
                  <input
                    type="number"
                    value={expressFee}
                    onChange={(e) => setExpressFee(Number(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl border border-black/[0.08] bg-white text-[#111111]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#111111] mb-1">Banlieue (FCFA)</label>
                  <input
                    type="number"
                    value={suburbFee}
                    onChange={(e) => setSuburbFee(Number(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl border border-black/[0.08] bg-white text-[#111111]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black"
                >
                  Enregistrer le tarif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
