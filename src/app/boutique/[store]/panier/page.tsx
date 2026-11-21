"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  ChevronRight,
  MapPin,
  Phone,
  User,
  Home,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  CartItem,
  getCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  getCartSubtotal,
  getCartTotalCount,
} from "@/lib/cart-store";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatFcfa } from "@/lib/money";
import { resolveStorefrontData } from "@/lib/storefront-resolver";
import { getSortedAfricanCountries, AfricanCountryConfig } from "@/config/countries";
import { CountryFlag } from "@/components/ui/country-flag";

interface PageProps {
  params: Promise<{ store: string }>;
}

export default function CartAndCodCheckoutPage({ params }: PageProps) {
  const { store: storeSlug } = use(params);
  const resolved = resolveStorefrontData(storeSlug);
  const store = resolved.store;
  const storefront = resolved.storefront;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Formulaire COD
  const [customerName, setCustomerName] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState(store.country || "TG");
  const [customerPhone, setCustomerPhone] = useState("");
  const [city, setCity] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Confirmation de commande
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    totalAmount: number;
    phone: string;
    city: string;
    trackingToken: string;
    items: CartItem[];
  } | null>(null);

  const africanCountries = getSortedAfricanCountries();
  const activeCountry =
    africanCountries.find((c) => c.code === selectedCountryCode) || africanCountries[0];

  useEffect(() => {
    setCartItems(getCart(storeSlug));
    setIsLoaded(true);

    const handleCartUpdated = (e: Event) => {
      const custom = e as CustomEvent<{ storeSlug: string; items: CartItem[] }>;
      if (!custom.detail || custom.detail.storeSlug === storeSlug) {
        if (custom.detail?.items) {
          setCartItems(custom.detail.items);
        } else {
          setCartItems(getCart(storeSlug));
        }
      }
    };

    window.addEventListener("novika:cart_updated", handleCartUpdated);
    return () => {
      window.removeEventListener("novika:cart_updated", handleCartUpdated);
    };
  }, [storeSlug]);

  const totalCount = getCartTotalCount(cartItems);
  const subtotal = getCartSubtotal(cartItems);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (cartItems.length === 0) {
      setErrorMsg("Votre panier est vide. Veuillez ajouter des produits avant de commander.");
      return;
    }

    if (!customerName.trim()) {
      setErrorMsg("Veuillez indiquer votre nom et prénom.");
      return;
    }

    if (!customerPhone.trim() || customerPhone.trim().length < 6) {
      setErrorMsg("Veuillez renseigner un numéro de téléphone valide.");
      return;
    }

    if (!city.trim()) {
      setErrorMsg("Veuillez indiquer votre ville ou quartier de livraison.");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderNumber = `CMD-${Date.now().toString().slice(-6)}`;
      const trackingToken = `tr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      const fullPhone = `${activeCountry.dialCode} ${customerPhone.trim()}`;

      const payload = {
        orderNumber,
        customerName: customerName.trim(),
        customerPhone: fullPhone,
        city: city.trim(),
        country: selectedCountryCode,
        currency: store.currency || "XOF",
        deliveryAddress: deliveryAddress.trim()
          ? `${deliveryAddress.trim()}${notes ? ` (Note : ${notes.trim()})` : ""}`
          : notes.trim() || null,
        subtotal,
        shippingFee: 0,
        totalAmount: subtotal,
        items: cartItems,
        storeSlug,
        trackingToken,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Impossible d'enregistrer la commande. Réessayez.");
      }

      // Sauvegarder la commande en local pour visibilité immédiate dans le tableau de bord
      if (typeof window !== "undefined") {
        try {
          const storageKey = `novika_store_orders_${storeSlug}`;
          const existingRaw = localStorage.getItem(storageKey);
          const existingOrders = existingRaw ? JSON.parse(existingRaw) : [];
          const newOrder = {
            id: orderNumber,
            orderNumber,
            customerName: customerName.trim(),
            customerPhone: fullPhone,
            city: city.trim(),
            district: "",
            country: selectedCountryCode,
            currency: store.currency || "XOF",
            deliveryAddress: deliveryAddress.trim() || null,
            subtotal,
            shippingFee: 0,
            totalAmount: subtotal,
            status: "pending",
            statusReason: null,
            createdAt: new Date().toISOString(),
            trackingToken,
            items: cartItems.map((it) => ({
              id: it.id,
              productName: (it as any).productTitle || it.name,
              quantity: it.quantity,
              unitPrice: (it as any).price || it.unitPrice,
              totalPrice: ((it as any).price || it.unitPrice) * it.quantity,
              image: it.image,
            })),
          };
          localStorage.setItem(storageKey, JSON.stringify([newOrder, ...existingOrders]));
        } catch (storageErr) {
          console.warn("[Panier] Erreur sauvegarde commande localStorage:", storageErr);
        }
      }

      // Vider le panier
      clearCart(storeSlug);

      setCompletedOrder({
        orderNumber,
        totalAmount: subtotal,
        phone: fullPhone,
        city: city.trim(),
        trackingToken,
        items: [...cartItems],
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inattendue";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center text-[#888880] text-sm font-semibold">
        Chargement de votre panier...
      </div>
    );
  }

  // ÉCRAN DE CONFIRMATION DE COMMANDE VALIDÉE
  if (completedOrder) {
    const rawWaNumber = (storefront.contact?.whatsappNumber || "+22890000000").replace(/[^0-9]/g, "");
    const waText = encodeURIComponent(
      `Bonjour ${store.name}, je viens de valider ma commande ${completedOrder.orderNumber} d'un montant de ${completedOrder.totalAmount} FCFA. Pouvez-vous me confirmer le créneau de livraison ? Merci !`
    );

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-8 animate-in fade-in duration-300">
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-black/[0.08] text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider">
              Commande Enregistrée avec Succès
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
              Merci pour votre commande !
            </h1>
            <p className="text-xs sm:text-sm text-[#666660] max-w-md mx-auto">
              Votre commande <span className="font-bold text-[#111111]">{completedOrder.orderNumber}</span> est bien transmise. Notre service de livraison va vous joindre au{" "}
              <span className="font-bold text-[#111111]">{completedOrder.phone}</span> pour convenir de l&apos;heure exacte de passage.
            </p>
          </div>

          {/* Récapitulatif rapide */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] text-left max-w-md mx-auto space-y-3">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-black/[0.06]">
              <span className="font-bold text-[#666660]">Numéro :</span>
              <span className="font-black text-[#111111]">{completedOrder.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 border-b border-black/[0.06]">
              <span className="font-bold text-[#666660]">Destination :</span>
              <span className="font-bold text-[#111111]">{completedOrder.city}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 border-b border-black/[0.06]">
              <span className="font-bold text-[#666660]">Mode de règlement :</span>
              <span className="font-bold text-emerald-700">100% Cash / Mobile Money à livraison</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-1">
              <span className="font-black text-[#111111]">Montant à payer au livreur :</span>
              <span className="font-black text-[#C2410C]">
                {formatFcfa(completedOrder.totalAmount)}
              </span>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={`/suivi/${completedOrder.trackingToken}`}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#111111] text-white text-xs font-black hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <Truck className="w-4 h-4" />
              <span>Suivre ma commande en direct</span>
            </Link>

            <a
              href={`https://wa.me/${rawWaNumber}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#25D366] text-white text-xs font-black hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Confirmer sur WhatsApp</span>
            </a>
          </div>

          <div className="pt-4">
            <Link
              href={`/boutique/${storeSlug}`}
              className="text-xs font-bold text-[#666660] hover:text-[#111111] hover:underline"
            >
              ← Retour à l&apos;accueil de la boutique
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ÉCRAN PANIER VIDE
  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-6">
        <nav className="flex items-center gap-1.5 text-xs text-[#666660]">
          <Link href={`/boutique/${storeSlug}`} className="hover:underline">
            Accueil
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="font-bold text-[#111111]">Panier</span>
        </nav>

        <div className="p-10 sm:p-16 rounded-3xl bg-white border border-black/[0.08] text-center space-y-5 shadow-2xs">
          <div className="w-20 h-20 rounded-full bg-[#FAF8F5] border border-black/[0.06] flex items-center justify-center mx-auto text-[#888880]">
            <ShoppingBag className="w-10 h-10 opacity-50" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-[#111111]">
              Votre panier est vide
            </h1>
            <p className="text-xs sm:text-sm text-[#666660] max-w-sm mx-auto">
              Vous n&apos;avez encore aucun article dans votre panier. Parcourez notre catalogue pour découvrir nos meilleures offres.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href={`/boutique/${storeSlug}/catalogue`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#111111] text-white text-xs font-black hover:bg-black transition-all shadow-sm"
            >
              <span>Découvrir le catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ÉCRAN NORMAL : PANIER AVEC FORMULAIRE COD EN 2 COLONNES
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 pb-20">
      {/* Fil d'Ariane */}
      <nav className="flex items-center gap-1.5 text-xs text-[#666660]">
        <Link href={`/boutique/${storeSlug}`} className="hover:underline">
          Accueil
        </Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        <span className="font-bold text-[#111111]">Panier & Commande COD</span>
      </nav>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
          Finaliser votre commande
        </h1>
        <p className="text-xs sm:text-sm text-[#666660]">
          Paiement 100% à la livraison. Vous payez en espèces ou Mobile Money uniquement après avoir inspecté votre colis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLONNE GAUCHE (7 colonnes) : Récapitulatif des articles */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-black/[0.08] space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.08]">
              <h2 className="text-sm font-black text-[#111111] uppercase tracking-wide">
                Articles commandés ({totalCount})
              </h2>
              <button
                type="button"
                onClick={() => clearCart(storeSlug)}
                className="text-xs font-semibold text-[#888880] hover:text-rose-600 transition-colors"
              >
                Vider le panier
              </button>
            </div>

            <div className="divide-y divide-black/[0.06] space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#FAF8F5] border border-black/[0.06] shrink-0">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs sm:text-sm font-black text-[#111111] truncate" title={item.name}>
                      {item.name}
                    </p>
                    {item.variantName && (
                      <span className="inline-block text-[10px] font-semibold text-[#666660] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-black/[0.06]">
                        {item.variantName}
                      </span>
                    )}
                    <p className="text-xs font-bold text-[#666660]">
                      {formatFcfa(item.unitPrice)} × {item.quantity} ={" "}
                      <span className="text-[#C2410C] font-black">
                        {formatFcfa(item.unitPrice * item.quantity)}
                      </span>
                    </p>
                  </div>

                  {/* Boutons de quantité */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center border border-black/[0.12] rounded-lg bg-white overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartItemQuantity(storeSlug, item.id, item.quantity - 1)
                        }
                        className="px-2 py-1 text-[#444440] hover:bg-black/[0.05] transition-colors"
                        aria-label="Diminuer la quantité"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-black text-[#111111] min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCartItemQuantity(storeSlug, item.id, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.stock}
                        className="px-2 py-1 text-[#444440] hover:bg-black/[0.05] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        aria-label="Augmenter la quantité"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(storeSlug, item.id)}
                      className="p-1.5 text-[#888880] hover:text-rose-600 transition-colors"
                      title="Supprimer cet article"
                      aria-label={`Supprimer ${item.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Récapitulatif sous-total */}
            <div className="pt-4 border-t border-black/[0.08] space-y-2 text-xs">
              <div className="flex justify-between text-[#666660]">
                <span>Sous-total des articles</span>
                <span className="font-bold text-[#111111]">{formatFcfa(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#666660]">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Frais de livraison</span>
                </span>
                <span className="font-bold text-emerald-700">0 FCFA (Offerte)</span>
              </div>
              <div className="pt-2 border-t border-black/[0.08] flex justify-between items-baseline">
                <span className="text-sm font-black text-[#111111]">
                  Total à régler à la livraison
                </span>
                <span className="text-xl font-black text-[#C2410C]">
                  {formatFcfa(subtotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Garanties Novika COD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-black/[0.08] flex items-center gap-3 shadow-2xs">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-black text-[#111111]">Paiement après vérification</p>
                <p className="text-[11px] text-[#666660]">Vérifiez le contenu avant de payer.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-black/[0.08] flex items-center gap-3 shadow-2xs">
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-black text-[#111111]">Expédition Express 24h-48h</p>
                <p className="text-[11px] text-[#666660]">Livraison à domicile ou au bureau.</p>
              </div>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE (5 colonnes) : Formulaire COD unique */}
        <div className="lg:col-span-5">
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-black/[0.08] space-y-5 shadow-sm sticky top-24">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#C2410C] text-[10px] font-black uppercase tracking-wider">
                Paiement Cash / Mobile Money
              </span>
              <h2 className="text-base font-black text-[#111111] tracking-tight">
                Adresse de livraison COD
              </h2>
              <p className="text-[11px] text-[#666660]">
                Renseignez vos coordonnées pour que le livreur puisse vous contacter.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitOrder} noValidate className="space-y-4 text-xs">
              {/* Nom & Prénom */}
              <div className="space-y-1">
                <label className="font-bold text-[#111111] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#666660]" />
                  <span>Votre Nom complet *</span>
                </label>
                <input
                  type="text"
                  required
                  data-testid="input-customer-name"
                  placeholder="Ex : Koffi Mensah"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-white text-xs font-medium text-[#111111] focus:outline-hidden focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C]"
                />
              </div>

              {/* Téléphone / WhatsApp */}
              <div className="space-y-1">
                <label className="font-bold text-[#111111] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#666660]" />
                  <span>Numéro de Téléphone (WhatsApp) *</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative w-36 shrink-0">
                    <select
                      value={selectedCountryCode}
                      onChange={(e) => setSelectedCountryCode(e.target.value)}
                      className="w-full pl-8 pr-2 py-2.5 rounded-xl border border-black/15 bg-[#FAF8F5] text-xs font-bold text-[#111111] focus:outline-hidden"
                    >
                      {africanCountries.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.dialCode} ({c.code})
                        </option>
                      ))}
                    </select>
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <CountryFlag code={selectedCountryCode} width={18} height={12} />
                    </div>
                  </div>

                  <input
                    type="tel"
                    required
                    data-testid="input-customer-phone"
                    placeholder="Ex : 90 12 34 56"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-black/15 bg-white text-xs font-medium text-[#111111] focus:outline-hidden focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C]"
                  />
                </div>
              </div>

              {/* Ville / Quartier */}
              <div className="space-y-1">
                <label className="font-bold text-[#111111] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#666660]" />
                  <span>Ville, Commune ou Quartier *</span>
                </label>
                <input
                  type="text"
                  required
                  data-testid="input-customer-city"
                  placeholder="Ex : Lomé - Agbalépédogan, Abidjan - Cocody..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-white text-xs font-medium text-[#111111] focus:outline-hidden focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C]"
                />
              </div>

              {/* Adresse et repères précis */}
              <div className="space-y-1">
                <label className="font-bold text-[#111111] flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-[#666660]" />
                  <span>Repère précis ou adresse</span>
                </label>
                <input
                  type="text"
                  data-testid="input-customer-address"
                  placeholder="Ex : Face à la pharmacie de la Paix, maison clôturée bleue"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-white text-xs font-medium text-[#111111] focus:outline-hidden focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C]"
                />
              </div>

              {/* Note pour le coursier */}
              <div className="space-y-1">
                <label className="font-bold text-[#111111] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#666660]" />
                  <span>Créneau souhaité ou consigne (optionnel)</span>
                </label>
                <input
                  type="text"
                  data-testid="input-customer-notes"
                  placeholder="Ex : Livrer après 14h, appeler 30min avant..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-white text-xs font-medium text-[#111111] focus:outline-hidden"
                />
              </div>

              {/* Bouton de validation */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="btn-submit-cart-order"
                  className="w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-[#C2410C] hover:bg-[#a83609] disabled:bg-gray-400 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Validation en cours...</span>
                    </div>
                  ) : (
                    <>
                      <span>Valider ma commande ({formatFcfa(subtotal)})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-[#888880] text-center leading-relaxed">
                🔒 En validant, vous confirmez votre volonté de recevoir le colis et de régler le montant exact en espèces ou Mobile Money au livreur.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
