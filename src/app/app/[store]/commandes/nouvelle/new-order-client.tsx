"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  MapPin,
  MessageCircle,
  Plus,
  Save,
  Trash2,
  User,
  ShoppingBag,
} from "lucide-react";
import { getShopProducts } from "@/lib/products-store";
import { ORDER_SOURCE_OPTIONS } from "@/lib/orders-api";
import type { Product } from "@/server/data/types";
import { formatFcfa } from "@/lib/money";
import { CountryFlagSvg } from "@/components/app/bits";
import { whatsappLink } from "@/lib/phone";
import { cn } from "@/lib/utils";

interface DynamicItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
}

export function NewManualOrderClient({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();

  // Formulaire client
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [country, setCountry] = useState<"TG" | "CI" | "SN" | "BJ">("TG");
  const [city, setCity] = useState("Lomé");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [shippingFee, setShippingFee] = useState<number>(1500);

  // Tarifs de livraison enregistrés : le frais se remplit selon la ville tapée
  const [rates, setRates] = useState<{ city: string; fee: number }[]>([]);
  const [feeTouched, setFeeTouched] = useState(false);
  useEffect(() => {
    fetch(`/api/delivery-rates?store=${encodeURIComponent(storeSlug)}`)
      .then((r) => r.json())
      .then((d) => d?.success && setRates(d.rates))
      .catch(() => {});
  }, [storeSlug]);
  useEffect(() => {
    if (feeTouched || !rates.length) return;
    const c = city.trim().toLowerCase();
    const hit = rates.find((r) => c === r.city.toLowerCase()) || rates.find((r) => c.includes(r.city.toLowerCase()));
    if (hit) setShippingFee(hit.fee);
  }, [city, rates, feeTouched]);

  // Détails de la commande
  const [source, setSource] = useState("whatsapp");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Produits réels de la boutique (catalogue partagé)
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<DynamicItem[]>([
    { id: "line_1", productId: "", variantId: "", quantity: 1 },
  ]);
  useEffect(() => {
    const list = getShopProducts(storeSlug).filter((p) => p.status !== "archived");
    setProducts(list);
    setItems((prev) => prev.map((it) => (it.productId ? it : { ...it, productId: list[0]?.id || "" })));
  }, [storeSlug]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddItem = () => {
    const firstProd = products[0];
    if (!firstProd) return;
    setItems((prev) => [
      ...prev,
      {
        id: `line_${Date.now()}`,
        productId: firstProd.id,
        variantId: "",
        quantity: 1,
      },
    ]);
  };

  const handleRemoveItem = (lineId: string) => {
    if (items.length <= 1) {
      alert("Une commande doit contenir au moins 1 article.");
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== lineId));
  };

  const handleProductChange = (lineId: string, newProdId: string) => {
    setItems((prev) => prev.map((it) => (it.id === lineId ? { ...it, productId: newProdId } : it)));
  };

  const handleVariantChange = (lineId: string, newVarId: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === lineId ? { ...it, variantId: newVarId } : it))
    );
  };

  const handleQuantityChange = (lineId: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === lineId) {
          const newQty = Math.max(1, it.quantity + delta);
          return { ...it, quantity: newQty };
        }
        return it;
      })
    );
  };

  // Calculs automatiques
  const subtotal = items.reduce((acc, it) => {
    const prod = products.find((p) => p.id === it.productId);
    return acc + (prod?.salePrice || 0) * it.quantity;
  }, 0);

  const totalAmount = subtotal + shippingFee;

  const handleSubmit = async (contactOnWa: boolean) => {
    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      alert("Veuillez renseigner le nom, téléphone et adresse du client.");
      return;
    }
    if (items.some((it) => !it.productId)) {
      alert("Choisissez un produit pour chaque ligne.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store: storeSlug,
          customerName,
          customerPhone,
          city,
          deliveryAddress,
          country,
          shippingFee,
          channel: source,
          notes,
          items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        showToast(data?.error || "La commande n'a pas pu être enregistrée.");
        setSubmitting(false);
        return;
      }
      const orderNum: string = data.order.order_number;

      if (contactOnWa) {
        const firstItem = products.find((p) => p.id === items[0].productId);
        const msg = `Bonjour ${customerName}, votre commande #${orderNum} (${firstItem?.name}) d'un montant de ${formatFcfa(
          data.order.total_amount
        )} a bien été enregistrée pour livraison à ${city}. Êtes-vous bien disponible pour réceptionner le colis ?`;
        window.open(whatsappLink(customerPhone, msg), "_blank");
      }

      showToast(`Commande ${orderNum} enregistrée avec succès !`);
      setTimeout(() => {
        router.push(`/app/${storeSlug}/commandes`);
      }, 1200);
    } catch {
      showToast("Connexion impossible : la commande n'a pas été enregistrée.");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#1F3A26] text-[#FAF8F5] px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Link
          href={`/app/${storeSlug}/commandes`}
          className="p-2 rounded-xl border border-black/[0.08] bg-[#FAF8F5] text-[#111111] hover:bg-white shadow-2xs transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#111111]">
            Créer une commande manuelle
          </h1>
          <p className="text-xs text-[#666660]">
            Saisie directe d'un client reçu par appel, message WhatsApp ou en direct.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne Gauche : Formulaire Client & Produits */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Informations Client */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
              <User className="h-4 w-4 text-[#666660]" />
              Coordonnées du Client
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Nom complet du client <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Prénom Nom"
                  className="w-full p-2.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Téléphone (avec indicatif) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+22890123456 ou +2250701020304"
                  className="w-full p-2.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Pays de livraison
                </label>
                <select
                  value={country}
                  onChange={(e) => {
                    const c = e.target.value as "TG" | "CI" | "SN" | "BJ";
                    setCountry(c);
                    if (c === "TG") { setCity("Lomé"); setShippingFee(1500); }
                    else if (c === "CI") { setCity("Abidjan"); setShippingFee(2000); }
                    else if (c === "SN") { setCity("Dakar"); setShippingFee(2000); }
                    else if (c === "BJ") { setCity("Cotonou"); setShippingFee(1500); }
                  }}
                  className="w-full p-2.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                >
                  <option value="TG">🇹🇬 Togo (Lomé)</option>
                  <option value="CI">🇨🇮 Côte d'Ivoire (Abidjan)</option>
                  <option value="SN">🇸🇳 Sénégal (Dakar)</option>
                  <option value="BJ">🇧🇯 Bénin (Cotonou)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Ville / Quartier <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Lomé (Agoè Nyivé)"
                  className="w-full p-2.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Adresse précise de livraison <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Ex: Près de la Pharmacie du 2 Février, Maison portail bleu"
                  className="w-full p-2.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Détails de la commande : source */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">Détails de la commande</h3>
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full p-2.5 text-sm rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
              >
                {ORDER_SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1">Note interne (facultatif)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: client joignable après 16h"
                className="w-full p-2.5 text-sm rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
              />
            </div>
          </div>

          {/* 2. Sélection de produits dynamique */}
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-[#666660]" />
                Articles Commandés
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] transition-all cursor-pointer shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ajouter un article</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((lineItem, idx) => {
                const prod = products.find((p) => p.id === lineItem.productId);
                const unitPrice = prod?.salePrice || 0;
                const lineTotal = unitPrice * lineItem.quantity;

                return (
                  <div
                    key={lineItem.id}
                    className="p-3.5 rounded-2xl border border-black/[0.06] bg-white space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#888880]">
                        Ligne #{idx + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(lineItem.id)}
                          className="p-1 text-[#888880] hover:text-rose-600 transition-colors"
                          title="Supprimer la ligne"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      {/* Select Produit */}
                      <div className="sm:col-span-8">
                        <select
                          value={lineItem.productId}
                          onChange={(e) => handleProductChange(lineItem.id, e.target.value)}
                          className="w-full p-2 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({formatFcfa(p.salePrice)})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantité & Total Ligne */}
                      <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                        <div className="flex items-center border border-black/[0.08] rounded-lg overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(lineItem.id, -1)}
                            className="px-2 py-1 text-xs hover:bg-[#FAF8F5]"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-bold">{lineItem.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(lineItem.id, 1)}
                            className="px-2 py-1 text-xs hover:bg-[#FAF8F5]"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs font-black text-[#111111] sm:hidden">
                          {formatFcfa(lineTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Colonne Droite : Récapitulatif et Boutons d'enregistrement */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-[20px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Calcul Total COD
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[#666660]">
                <span>Sous-total articles</span>
                <span className="font-semibold text-[#111111]">{formatFcfa(subtotal)}</span>
              </div>

              <div>
                <div className="flex justify-between items-center text-[#666660] mb-1">
                  <span>Frais de livraison</span>
                  <span className="font-semibold text-[#111111]">{formatFcfa(shippingFee)}</span>
                </div>
                <input
                  type="number"
                  step="500"
                  value={shippingFee}
                  onChange={(e) => { setFeeTouched(true); setShippingFee(Number(e.target.value) || 0); }}
                  className="w-full p-2 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] font-mono text-right focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-black/[0.08] flex justify-between items-center">
                <span className="font-black text-xs text-[#111111] uppercase">À encaisser</span>
                <span className="text-lg font-black text-[#111111]">
                  {formatFcfa(totalAmount)}
                </span>
              </div>
            </div>

            {/* Boutons requis par le Prompt 5.B */}
            <div className="pt-3 border-t border-black/[0.08] space-y-2.5">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(false)}
                className="w-full py-2.5 px-4 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Enregistrer la commande</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Enregistrer et contacter sur WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
