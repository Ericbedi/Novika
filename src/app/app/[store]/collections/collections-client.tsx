"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FolderTree,
  Plus,
  Sparkles,
  Package,
  Edit,
  Trash2,
  CheckCircle2,
  Image as ImageIcon,
  Layers,
  ArrowUpDown,
  Filter,
  Check,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { MOCK_COLLECTIONS } from "@/mock-data/collections";
import { Collection, CollectionRule } from "@/server/data/types";
import { cn } from "@/lib/utils";
import { ProductsNavTabs } from "@/components/products/products-nav-tabs";

export function CollectionsClient({ storeSlug }: { storeSlug: string }) {
  const [collections, setCollections] = useState<Collection[]>(MOCK_COLLECTIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"manual" | "automated">("manual");
  const [ruleField, setRuleField] = useState<"category" | "tag" | "price">("category");
  const [ruleOperator, setRuleOperator] = useState<"equals" | "greater_than" | "contains">("equals");
  const [ruleValue, setRuleValue] = useState("");
  const [position, setPosition] = useState<number>(collections.length + 1);
  const [published, setPublished] = useState<boolean>(true);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenCreate = () => {
    setEditingCollection(null);
    setTitle("");
    setDescription("");
    setType("manual");
    setRuleField("category");
    setRuleOperator("equals");
    setRuleValue("");
    setPosition(collections.length + 1);
    setPublished(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (col: Collection) => {
    setEditingCollection(col);
    setTitle(col.title);
    setDescription(col.description);
    setType(col.type);
    if (col.rules && col.rules.length > 0) {
      setRuleField(col.rules[0].field);
      setRuleOperator(col.rules[0].operator);
      setRuleValue(col.rules[0].value);
    } else {
      setRuleField("category");
      setRuleOperator("equals");
      setRuleValue("");
    }
    setPosition(col.position);
    setPublished(col.published);
    setIsModalOpen(true);
  };

  const handleSaveCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const rules: CollectionRule[] =
      type === "automated" && ruleValue.trim()
        ? [{ field: ruleField, operator: ruleOperator, value: ruleValue.trim() }]
        : [];

    if (editingCollection) {
      setCollections((prev) =>
        prev.map((c) =>
          c.id === editingCollection.id
            ? {
                ...c,
                title,
                slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                description,
                type,
                rules: rules.length > 0 ? rules : undefined,
                position,
                published,
                updatedAt: new Date().toLocaleDateString("fr-FR"),
              }
            : c
        )
      );
      showToast(`Collection "${title}" mise à jour !`);
    } else {
      const newCol: Collection = {
        id: `col_${Date.now()}`,
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description,
        type,
        rules: rules.length > 0 ? rules : undefined,
        productsCount: type === "automated" ? 3 : 0,
        position,
        published,
        updatedAt: new Date().toLocaleDateString("fr-FR"),
      };
      setCollections((prev) => [...prev, newCol]);
      showToast(`Collection "${title}" créée avec succès !`);
    }

    setIsModalOpen(false);
  };

  const togglePublish = (id: string) => {
    setCollections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, published: !c.published } : c))
    );
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Navigation 5 Onglets */}
      <ProductsNavTabs storeSlug={storeSlug} />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 rounded-2xl bg-[#111111] text-[#FAF8F5] px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
              Organisation du Catalogue
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#111111]/[0.05] text-[#111111]">
              {collections.length} collections
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            Collections & Catégories
          </h1>
          <p className="text-xs text-[#666660] mt-0.5">
            Organisez vos offres en collections manuelles ou automatiques basées sur des conditions (catégorie, prix, tags).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Nouvelle collection</span>
        </button>
      </div>

      {/* Grille des collections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((col) => (
          <div
            key={col.id}
            className="p-5 rounded-[22px] border border-black/[0.08] bg-[#FAF8F5] shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-xs transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                      col.type === "automated"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    )}
                  >
                    {col.type === "automated" ? "Automatique (Règles)" : "Manuelle"}
                  </span>
                  <span className="text-[10px] text-[#888880] font-mono">
                    Pos: #{col.position}
                  </span>
                </div>

                <button
                  onClick={() => togglePublish(col.id)}
                  className={cn(
                    "p-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors",
                    col.published
                      ? "text-emerald-700 hover:text-emerald-800"
                      : "text-stone-400 hover:text-stone-600"
                  )}
                  title={col.published ? "Publiée en ligne" : "Masquée de la boutique"}
                >
                  {col.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{col.published ? "En ligne" : "Masquée"}</span>
                </button>
              </div>

              <h3 className="text-base font-black text-[#111111] tracking-tight">
                {col.title}
              </h3>
              <p className="text-xs text-[#666660] mt-1 line-clamp-2">
                {col.description}
              </p>

              {/* Règle si automatique */}
              {col.type === "automated" && col.rules && col.rules.length > 0 && (
                <div className="mt-3 p-2.5 rounded-xl bg-purple-50/60 border border-purple-200/50 text-[11px] text-purple-900 font-semibold space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-purple-700 block">Condition appliquée :</span>
                  <div>
                    {col.rules[0].field} {col.rules[0].operator === "equals" ? "=" : col.rules[0].operator === "greater_than" ? ">" : "contient"}{" "}
                    <span className="font-bold underline">{col.rules[0].value}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between text-xs">
              <span className="font-bold text-[#111111]">
                {col.productsCount} produit(s) lié(s)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(col)}
                  className="p-1.5 rounded-lg border border-black/[0.08] bg-white text-[#111111] hover:bg-black/5"
                  title="Modifier"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Création / Édition */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-black/[0.08] pb-3">
              <h3 className="text-base font-black text-[#111111]">
                {editingCollection ? "Modifier la collection" : "Nouvelle collection"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#888880] hover:text-[#111111]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCollection} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Titre de la collection <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Bien-être & Vitalité"
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Courte description affichée sur la boutique en ligne..."
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Type de collection
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType("manual")}
                    className={cn(
                      "py-2.5 rounded-xl font-bold transition-all text-center",
                      type === "manual"
                        ? "bg-[#111111] text-white shadow-xs"
                        : "bg-white border border-black/[0.08] text-[#666660]"
                    )}
                  >
                    Manuelle (Choix un par un)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("automated")}
                    className={cn(
                      "py-2.5 rounded-xl font-bold transition-all text-center",
                      type === "automated"
                        ? "bg-[#111111] text-white shadow-xs"
                        : "bg-white border border-black/[0.08] text-[#666660]"
                    )}
                  >
                    Automatisée (Selon des règles)
                  </button>
                </div>
              </div>

              {/* Règles si automatisée */}
              {type === "automated" && (
                <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2.5">
                  <span className="text-[11px] font-bold text-purple-950 block">
                    Règle de rattachement automatique :
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={ruleField}
                      onChange={(e) => setRuleField(e.target.value as any)}
                      className="px-2 py-1.5 rounded-lg border border-black/[0.08] bg-white font-semibold text-xs"
                    >
                      <option value="category">Catégorie</option>
                      <option value="tag">Balise (Tag)</option>
                      <option value="price">Prix</option>
                    </select>

                    <select
                      value={ruleOperator}
                      onChange={(e) => setRuleOperator(e.target.value as any)}
                      className="px-2 py-1.5 rounded-lg border border-black/[0.08] bg-white font-semibold text-xs"
                    >
                      <option value="equals">Est égal à</option>
                      <option value="contains">Contient</option>
                      <option value="greater_than">Supérieur à</option>
                    </select>

                    <input
                      type="text"
                      value={ruleValue}
                      onChange={(e) => setRuleValue(e.target.value)}
                      placeholder="Ex: Beauté"
                      className="px-2 py-1.5 rounded-lg border border-black/[0.08] bg-white font-semibold text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Ordre d'affichage (Position)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={position}
                    onChange={(e) => setPosition(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white font-semibold text-xs"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#111111]">
                    <input
                      type="checkbox"
                      checked={published}
                      onChange={(e) => setPublished(e.target.checked)}
                      className="rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span>Publier sur la boutique</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-black/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-black/[0.08] bg-white text-[#666660] font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#111111] text-white font-bold hover:bg-black"
                >
                  {editingCollection ? "Mettre à jour" : "Créer la collection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
