"use client";

import React, { useState, useId, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  MessageCircle,
  ExternalLink,
  ShoppingBag,
  Info,
  Building,
  CreditCard,
  Upload,
  Check,
  ChevronDown,
} from "lucide-react";
import { Product } from "@/server/data/types";
import {
  OrderFormSettings,
  QuantityOffer,
  ProductThemePalette,
  OrderFormRecalculatedOrder,
} from "@/server/data/product-page-types";
import { recalculateOrderOnServer, checkOrder24hDuplicate } from "@/lib/order-form-security";
import {
  MOCK_CITY_ZONES,
  MOCK_SELLER_PAYMENT_METHODS,
  getZoneByCity,
  getCarrierById,
  getPickupPointById,
} from "@/mock-data/shipping-zones";
import { cn } from "@/lib/utils";
import { CountryFlag } from "@/components/ui/country-flag";
import { getSortedAfricanCountries, getCountryByCode, AfricanCountryConfig } from "@/config/countries";
import { isCountryEnabledForShop } from "@/server/data/shop-countries";

interface StandardOrderFormProps {
  product: Product;
  settings: OrderFormSettings;
  quantityOffers: QuantityOffer[];
  themePalette?: ProductThemePalette;
  storeSlug: string;
  formId?: string;
  onOrderSuccess?: (order: OrderFormRecalculatedOrder) => void;
}

// Les 54 pays d'Afrique triés alphabétiquement selon Prompt 05-P
const ALL_COUNTRIES_LIST = getSortedAfricanCountries();

export function StandardOrderForm({
  product,
  settings,
  quantityOffers,
  themePalette,
  storeSlug,
  formId = "standard-cod-order-form",
  onOrderSuccess,
}: StandardOrderFormProps) {
  const rawId = useId();
  const [idempotencyKey, setIdempotencyKey] = useState("");

  useEffect(() => {
    setIdempotencyKey(`idem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  }, []);

  // Variantes & Offres
  const [selectedOfferId, setSelectedOfferId] = useState<string>(
    quantityOffers.find((q) => q.isDefault)?.id || quantityOffers[0]?.id || "default_qty_1"
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants && product.variants.length > 0 ? product.variants[0].id : ""
  );

  // Champs de saisie
  const [customerName, setCustomerName] = useState("");
  const [countryCode, setCountryCode] = useState("TG");
  const [phonePrefix, setPhonePrefix] = useState("+228");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [isWhatsApp, setIsWhatsApp] = useState(true);
  const [showAlternateWhatsApp, setShowAlternateWhatsApp] = useState(false);
  const [alternateWhatsApp, setAlternateWhatsApp] = useState("");
  const [showLocationPrecision, setShowLocationPrecision] = useState(false);
  const [city, setCity] = useState("Lomé");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryPrecision, setDeliveryPrecision] = useState("");
  const [email, setEmail] = useState("");
  const [commitmentChecked, setCommitmentChecked] = useState(true);
  const [honeypot, setHoneypot] = useState("");

  // Détection de zone dynamique par API / signaux
  const [zoneStatus, setZoneStatus] = useState<{
    status: "local" | "shipping" | "unknown" | "unserved";
    message: string;
    delay?: string;
    suggestion?: string;
    zoneName?: string;
  }>({
    status: "local",
    message: "Livraison gratuite à domicile · Aujourd'hui ou demain",
    delay: "Aujourd'hui ou demain",
    zoneName: "Lomé",
  });
  const [isCheckingZone, setIsCheckingZone] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const checkZone = async (queryText: string, coords?: { latitude: number; longitude: number }) => {
    setIsCheckingZone(true);
    try {
      const res = await fetch("/api/zone/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: countryCode, query: queryText, coords }),
      });
      if (res.ok) {
        const data = await res.json();
        setZoneStatus(data);
      }
    } catch (e) {
      // Tolérance aux erreurs réseau
    } finally {
      setIsCheckingZone(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (city) checkZone(city);
    }, 500);
    return () => clearTimeout(timer);
  }, [city, countryCode]);

  const handleGeolocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        const approxLat = Math.round(latitude * 100) / 100;
        const approxLng = Math.round(longitude * 100) / 100;
        checkZone(city, { latitude: approxLat, longitude: approxLng });
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  // Détection de la zone de la ville
  const cityZone = getZoneByCity(city, countryCode) || {
    city,
    countryCode,
    zoneType: (zoneStatus.status === "shipping" ? "expedition" : zoneStatus.status === "unserved" ? "not_served" : "local") as any,
    paymentMode: "cod" as const,
    estimatedDeliveryTime: zoneStatus.delay || "24h à 48h",
    sellerCost: 1000,
    clientDeliveryFee: 0 as const,
  };
  const isExpedition = zoneStatus.status === "shipping" || cityZone.zoneType === "expedition";
  const isNotServed = zoneStatus.status === "unserved" || cityZone.zoneType === "not_served";

  // États de soumission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [confirmedDuplicateBypass, setConfirmedDuplicateBypass] = useState(false);
  const [successOrder, setSuccessOrder] = useState<
    (OrderFormRecalculatedOrder & { zoneType?: string; paymentMode?: string }) | null
  >(null);

  // Soumission de preuve de paiement (pour commandes prépayées)
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [proofTxnRef, setProofTxnRef] = useState("");
  const [proofSenderPhone, setProofSenderPhone] = useState("");
  const [proofMethod, setProofMethod] = useState("tmoney");
  const [proofError, setProofError] = useState<string | null>(null);

  // Offre sélectionnée
  const activeOffer =
    quantityOffers.find((q) => q.id === selectedOfferId) || {
      id: "fallback",
      productId: product.id,
      quantity: 1,
      label: "1 Article",
      unitPrice: product.price || product.salePrice || 0,
      totalPrice: product.price || product.salePrice || 0,
      savingsAmount: 0,
    };

  // RÈGLE ABSOLUE : La livraison est 100% GRATUITE pour le client
  const clientShippingFee = 0;
  const estimatedTotal = activeOffer.totalPrice || 0;

  // Mise à jour de l'indicatif lors du changement de pays (Prompt 05-P)
  const handleCountryChange = (cCode: string) => {
    setCountryCode(cCode);
    const found = getCountryByCode(cCode);
    if (found) {
      setPhonePrefix(found.dialCode);
      if (found.majorCities && found.majorCities.length > 0) {
        setCity(found.majorCities[0]);
      }
    }
  };

  const fullPhoneE164 = `${phonePrefix}${phoneLocal.replace(/\D/g, "")}`;

  // Notification d'engagement formulaire pour Meta Pixel (InitiateCheckout)
  const [hasTriggeredInitiateCheckout, setHasTriggeredInitiateCheckout] = useState(false);
  const notifyInitiateCheckout = () => {
    if (!hasTriggeredInitiateCheckout) {
      setHasTriggeredInitiateCheckout(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("novika:initiate_checkout", {
            detail: {
              productId: product.id,
              productName: product.name,
              amount: estimatedTotal,
            },
          })
        );
      }
    }
  };

  // Soumission du formulaire de commande
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isNotServed) {
      setErrorMessage("Désolé, la livraison est actuellement indisponible dans cette ville.");
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage("Veuillez renseigner votre nom et prénom.");
      return;
    }
    if (phoneLocal.replace(/\D/g, "").length < 8) {
      setErrorMessage("Veuillez saisir un numéro de téléphone valide d'au moins 8 chiffres.");
      return;
    }
    if (!address.trim()) {
      setErrorMessage("Veuillez indiquer votre adresse ou un point de repère précis.");
      return;
    }

    // Détection de doublon 24h
    if (!confirmedDuplicateBypass) {
      const dup = checkOrder24hDuplicate(fullPhoneE164, product.id);
      if (dup.isDuplicate) {
        setDuplicateWarning(dup.warningMessage || "Une commande similaire existe déjà.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await new Promise((res) => setTimeout(res, 400));

      const result = recalculateOrderOnServer(
        {
          storeSlug,
          country: countryCode,
          productId: product.id,
          quantityOfferId: selectedOfferId,
          variantId: selectedVariantId || undefined,
          customerName,
          customerPhone: fullPhoneE164,
          isWhatsApp,
          city,
          district: district.trim() || undefined,
          address,
          deliveryPrecision: deliveryPrecision.trim() || undefined,
          email: email.trim() || undefined,
          commitmentChecked,
          honeypot,
          idempotencyKey,
        },
        product,
        settings,
        quantityOffers
      );

      if (!result.success || !result.recalculatedOrder) {
        setErrorMessage(result.error || "Une erreur est survenue lors de la validation.");
        setIsSubmitting(false);
        return;
      }

      setSuccessOrder({
        ...result.recalculatedOrder,
        zoneType: cityZone.zoneType,
        paymentMode: cityZone.paymentMode,
      });

      // Émission d'événement de commande terminée pour les Pixels Meta (Purchase / Lead avec event_id pour déduplication)
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("novika:order_completed", {
            detail: {
              orderNumber: result.recalculatedOrder.orderNumber,
              productId: product.id,
              productName: product.name,
              amount: result.recalculatedOrder.totalAmount,
              eventId: `evt_order_${result.recalculatedOrder.orderNumber}`,
            },
          })
        );
      }

      if (onOrderSuccess) {
        onOrderSuccess(result.recalculatedOrder);
      }
    } catch {
      setErrorMessage("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProofSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofTxnRef.trim()) {
      setProofError("Veuillez indiquer le numéro de transaction de votre transfert.");
      return;
    }
    setProofSubmitted(true);
    setProofError(null);
  };

  const primaryColor = themePalette?.primary || "#111111";
  const contrastTextColor = themePalette?.contrastText || "#FFFFFF";

  // ========================================================
  // ÉCRAN DE CONFIRMATION SUCCÈS
  // ========================================================
  if (successOrder) {
    const isOrderPrepaid = successOrder.paymentMode === "prepaid" || successOrder.zoneType === "expedition";

    return (
      <div
        id={formId}
        className="rounded-3xl border border-black/[0.08] bg-white p-6 sm:p-8 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div className="space-y-1">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-black/[0.06] text-[#111111]">
            Commande Confirmée #{successOrder.orderNumber}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
            Commande confirmée avec succès !
          </h3>
          <p className="text-sm font-bold text-[#111111]">
            Merci, {successOrder.customerName}
          </p>
          <p className="text-xs text-[#666660]">
            {isOrderPrepaid
              ? "Expédition interurbaine avec paiement avant envoi."
              : "Notre équipe prépare votre colis pour la livraison avec paiement à la remise."}
          </p>
        </div>

        {/* Instructions spéciales si commande prépayée en expédition */}
        {isOrderPrepaid ? (
          <div className="text-left rounded-2xl border border-amber-300 bg-amber-50/80 p-5 space-y-4">
            <div className="flex items-start gap-2.5">
              <Clock className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                  Étape obligatoire : Paiement avant expédition
                </h4>
                <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                  Pour expédier votre colis vers <strong>{successOrder.city}</strong> en point relais sécurisé, veuillez transférer le montant de <strong>{successOrder.totalAmount.toLocaleString("fr-FR")} {successOrder.currency}</strong> (Livraison Gratuite).
                </p>
              </div>
            </div>

            {/* Comptes de paiement du vendeur */}
            <div className="space-y-2 bg-white p-3.5 rounded-xl border border-amber-200 text-xs">
              <span className="font-bold text-[#111111] block mb-1">Comptes officiels de la boutique :</span>
              {MOCK_SELLER_PAYMENT_METHODS.map((pm) => (
                <div key={pm.id} className="p-2 rounded-lg bg-black/[0.03] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#111111]">{pm.providerName} :</span>{" "}
                    <span className="font-mono font-bold text-[#C2410C]">{pm.accountNumber}</span>
                    <p className="text-[10px] text-[#666660]">Titulaire : {pm.accountName}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Actif
                  </span>
                </div>
              ))}
            </div>

            {/* Dépôt de preuve de paiement */}
            {!proofSubmitted ? (
              <form onSubmit={handleProofSubmit} className="space-y-3 pt-1">
                <span className="text-xs font-bold text-[#111111] block">
                  Déclarer votre paiement effectué :
                </span>
                {proofError && (
                  <p className="text-xs text-rose-700 font-semibold">{proofError}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="N° de transaction SMS (Ex: TXN-98421)"
                    value={proofTxnRef}
                    onChange={(e) => setProofTxnRef(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-black/10 bg-white font-mono text-xs"
                  />
                  <input
                    type="tel"
                    placeholder="Numéro expéditeur (optionnel)"
                    value={proofSenderPhone}
                    onChange={(e) => setProofSenderPhone(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-black/10 bg-white font-mono text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#C2410C] text-white font-bold text-xs hover:bg-[#9A3412] transition-colors shadow-2xs"
                >
                  Valider ma preuve de paiement
                </button>
              </form>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-xs text-emerald-950 font-bold flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-700" />
                <span>Preuve enregistrée (Réf : {proofTxnRef}). Notre équipe vérifie et expédie sous 24h.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1 text-left">
            <div className="flex items-center gap-2 font-bold">
              <Clock className="h-4 w-4 text-amber-700 shrink-0" />
              <span>Notre équipe vous appelle dans les 15 à 30 minutes</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900">
              Pour vérifier votre créneau horaire et donner les instructions au livreur avant son départ.
              Gardez votre téléphone <strong>{successOrder.customerPhone}</strong> à portée de main.
            </p>
          </div>
        )}

        {/* Récapitulatif financier certifié par le serveur (Livraison Gratuite) */}
        <div className="rounded-2xl border border-black/[0.08] bg-[#FAF8F5] p-4 space-y-2 text-xs text-left">
          <div className="flex justify-between">
            <span className="text-[#666660]">Article :</span>
            <span className="font-bold text-[#111111]">{successOrder.productTitle} × {successOrder.quantity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#666660]">Sous-total articles :</span>
            <span className="font-semibold text-[#111111]">{successOrder.subtotal.toLocaleString("fr-FR")} {successOrder.currency}</span>
          </div>
          <div className="flex justify-between items-center text-emerald-800 font-bold">
            <span className="flex items-center gap-1">
              <Truck className="h-3.5 w-3.5" />
              Livraison ({successOrder.city}) :
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[11px]">GRATUITE</span>
          </div>
          {successOrder.savingsAmount > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Économie formule :</span>
              <span>-{successOrder.savingsAmount.toLocaleString("fr-FR")} {successOrder.currency}</span>
            </div>
          )}
          <div className="pt-2 border-t border-black/[0.08] flex justify-between items-center text-sm font-black text-[#111111]">
            <span>TOTAL À PAYER À LA LIVRAISON :</span>
            <span className="text-base text-emerald-700">{successOrder.totalAmount.toLocaleString("fr-FR")} {successOrder.currency}</span>
          </div>
        </div>

        {/* Boutons d'action : WhatsApp et Suivi en direct */}
        <div className="space-y-3 pt-2">
          <a
            href={successOrder.whatsAppConfirmationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#1EBE5D] transition-all shadow-md cursor-pointer"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Confirmer instantanément sur WhatsApp</span>
          </a>

          <Link
            href={successOrder.trackingUrl}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl border border-black/[0.1] bg-[#FAF8F5] text-[#111111] font-bold text-xs flex items-center justify-center gap-2 hover:bg-white transition-all shadow-2xs"
          >
            <Truck className="h-4 w-4 text-emerald-600" />
            <span>Suivre l'acheminement de mon colis en direct</span>
            <ExternalLink className="h-3.5 w-3.5 text-[#888880]" />
          </Link>
        </div>
      </div>
    );
  }

  // ========================================================
  // FORMULAIRE DE COMMANDE
  // ========================================================
  return (
    <div
      id={formId}
      className="rounded-3xl border border-black/[0.08] bg-white p-5 sm:p-7 shadow-xl space-y-6 text-[#111111]"
      style={{
        borderColor: themePalette?.border || "rgba(0,0,0,0.08)",
      }}
    >
      {/* 1. Titre & Avertissement optionnel */}
      <div className="space-y-1.5 border-b border-black/[0.06] pb-4">
        <h3 className="text-base sm:text-lg font-black text-[#111111]">
          {settings.title}
        </h3>
        {settings.isWarningEnabled && settings.warningText && (
          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-snug">{settings.warningText}</p>
          </div>
        )}
      </div>

      {/* 2. Variantes du produit (Prompt 05-V : Taille, Couleur, Pointure, etc.) */}
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
            Sélectionnez votre variante :
          </label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => {
              const isSelected = selectedVariantId === variant.id;
              const isOutOfStock = variant.stock !== undefined && variant.stock <= 0;
              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer min-h-[40px]",
                    isSelected
                      ? "border-2 border-[#111111] bg-[#111111] text-[#FAF8F5] shadow-xs"
                      : isOutOfStock
                        ? "border-black/[0.08] bg-black/[0.03] text-[#888880] cursor-not-allowed opacity-60 line-through"
                        : "border-black/[0.1] bg-white text-[#111111] hover:border-black/30"
                  )}
                >
                  <span>{variant.name}</span>
                  {isOutOfStock ? (
                    <span className="text-[9px] font-normal px-1 py-0.2 rounded bg-rose-100 text-rose-800">
                      Rupture
                    </span>
                  ) : variant.price && variant.price !== product.price ? (
                    <span className="text-[10px] opacity-80">
                      ({variant.price.toLocaleString("fr-FR")} F)
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Offres de quantité (si configurées) */}
      {quantityOffers.length > 1 && (
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
            Sélectionnez votre formule :
          </label>
          <div className="grid grid-cols-1 gap-2">
            {quantityOffers.map((offer) => {
              const isSelected = offer.id === selectedOfferId;
              return (
                <label
                  key={offer.id}
                  onClick={() => setSelectedOfferId(offer.id)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-2xl border text-xs cursor-pointer select-none transition-all",
                    isSelected
                      ? "border-2 border-[#111111] bg-black/[0.02] shadow-xs font-bold"
                      : "border-black/[0.08] hover:border-black/20 bg-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="quantity_offer_choice"
                      checked={isSelected}
                      onChange={() => setSelectedOfferId(offer.id)}
                      className="h-4 w-4 accent-[#111111] text-[#111111] cursor-pointer"
                    />
                    <div>
                      <span className="text-[#111111] block font-extrabold">{offer.label}</span>
                      {offer.savingsAmount > 0 && (
                        <span className="text-[10px] text-emerald-700 font-bold">
                          Économisez {offer.savingsAmount.toLocaleString("fr-FR")} FCFA
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-[#111111]">
                      {offer.totalPrice.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Avertissement anti-doublon 24h si détecté */}
      {duplicateWarning && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-2.5 animate-in fade-in">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Commande similaire déjà enregistrée aujourd'hui</p>
              <p className="text-[11px] mt-0.5 leading-relaxed">{duplicateWarning}</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => setDuplicateWarning(null)}
              className="px-3 py-1.5 rounded-xl border border-black/[0.1] bg-white text-[11px] font-bold text-[#666660]"
            >
              Modifier mes informations
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmedDuplicateBypass(true);
                setDuplicateWarning(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-700 text-white text-[11px] font-bold shadow-2xs"
            >
              Confirmer ce 2ème colis
            </button>
          </div>
        </div>
      )}

      {/* Formulaire de coordonnées */}
      <form onSubmit={handleSubmit} onFocusCapture={notifyInitiateCheckout} className="space-y-4">
        {/* Champ anti-robot Honeypot invisible */}
        <input
          type="text"
          name="website_url_check"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />

        {/* Nom & Prénom */}
        <div>
          <label className="block text-xs font-bold text-[#111111] mb-1">
            Nom et prénom <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            autoComplete="name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Ex: Awa Traoré"
            className="w-full min-h-[44px] px-3.5 py-2.5 text-xs rounded-xl border border-black/[0.1] bg-white text-[#111111] placeholder:text-[#888880] focus:outline-none focus:ring-2 focus:ring-black/[0.15]"
          />
        </div>

        {/* Téléphone avec indicatif pays dans un conteneur unique arrondi (Prompt 05-F) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#111111]">
            Numéro de téléphone joignable <span className="text-rose-600">*</span>
          </label>
          <div className="flex items-center rounded-xl border border-black/[0.1] bg-white overflow-hidden focus-within:ring-2 focus-within:ring-black/[0.15] focus-within:border-transparent min-h-[44px]">
            {/* Sélecteur de pays compact ~96px avec drapeau SVG + indicatif */}
            <div className="relative flex items-center shrink-0 w-[96px] bg-[#FAF8F5] border-r border-black/[0.08] px-2.5 h-[44px]">
              <CountryFlag code={countryCode} width={18} height={12} className="shrink-0" />
              <span className="text-xs font-mono font-bold text-[#111111] ml-1.5">{phonePrefix}</span>
              <ChevronDown className="h-3 w-3 text-[#888880] ml-auto shrink-0 pointer-events-none" />
              <select
                value={countryCode}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                aria-label="Sélectionner le pays"
              >
                {ALL_COUNTRIES_LIST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.dialCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Saisie du numéro de téléphone */}
            <input
              type="tel"
              inputMode="tel"
              required
              autoComplete="tel"
              value={phoneLocal}
              onChange={(e) => setPhoneLocal(e.target.value)}
              placeholder="Ex: 07 48 29 11 02"
              className="flex-1 min-w-0 h-[44px] px-3 text-xs sm:text-sm font-mono text-[#111111] placeholder:text-[#888880] focus:outline-none bg-transparent"
            />
          </div>

          {/* Règle Prompt 05-P #3 : Si pays désactivé pour la boutique */}
          {!isCountryEnabledForShop(storeSlug, countryCode) && (
            <div className="p-3 mt-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-950 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Cette boutique ne livre pas encore dans ce pays ({getCountryByCode(countryCode)?.name || countryCode}).</span>
              </div>
              <a
                href={`https://wa.me/22890000000?text=${encodeURIComponent(
                  `Bonjour, je souhaite commander depuis ${getCountryByCode(countryCode)?.name || countryCode} : ${product.name}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-[#25D366] text-white font-bold text-[11px] shrink-0 hover:bg-[#1EBE5D] flex items-center gap-1 shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                <span>WhatsApp</span>
              </a>
            </div>
          )}

          {/* Règle Prompt 05-F : Lien discret "Ce n'est pas mon WhatsApp" */}
          <div className="pt-0.5">
            {!showAlternateWhatsApp ? (
              <button
                type="button"
                onClick={() => setShowAlternateWhatsApp(true)}
                className="text-[11px] text-[#666660] hover:text-[#111111] underline cursor-pointer"
              >
                Ce n'est pas mon numéro WhatsApp ?
              </button>
            ) : (
              <div className="space-y-1 pt-1 animate-in fade-in">
                <label className="block text-[11px] font-bold text-[#666660]">
                  Numéro WhatsApp pour le suivi (optionnel)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    inputMode="tel"
                    value={alternateWhatsApp}
                    onChange={(e) => setAlternateWhatsApp(e.target.value)}
                    placeholder="Ex: +228 90 12 34 56"
                    className="flex-1 min-h-[40px] px-3 text-xs font-mono rounded-xl border border-black/[0.1] bg-white text-[#111111] placeholder:text-[#888880] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowAlternateWhatsApp(false);
                      setAlternateWhatsApp("");
                    }}
                    className="text-[11px] text-[#888880] hover:text-[#111111] px-2 py-1"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ville ou quartier saisie librement avec détection de zone par signaux */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#111111]">
            Ville ou quartier <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              maxLength={80}
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex. Lomé, Agoè, Kara, Abidjan..."
              className="w-full min-h-[44px] px-3.5 py-2.5 text-xs rounded-xl border border-black/[0.1] bg-white text-[#111111] placeholder:text-[#888880] focus:outline-none focus:ring-2 focus:ring-black/[0.15]"
            />
            {isCheckingZone && (
              <span className="absolute right-3 top-3 text-[10px] text-[#888880]">
                Vérification...
              </span>
            )}
          </div>

          {/* Ligne d'état de zone sous le champ */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5" role="status" aria-live="polite">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold",
                zoneStatus.status === "local"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : zoneStatus.status === "shipping"
                    ? "bg-amber-50 text-amber-900 border border-amber-200"
                    : zoneStatus.status === "unserved"
                      ? "bg-rose-50 text-rose-800 border border-rose-200"
                      : "bg-black/[0.04] text-[#555550] border border-black/[0.08]"
              )}
            >
              {zoneStatus.status === "local" && <Truck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
              {zoneStatus.status === "shipping" && <Truck className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
              {zoneStatus.status === "unserved" && <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />}
              <span>{zoneStatus.message}</span>
            </span>

            {/* Pastille de correction si faute de frappe détectée */}
            {zoneStatus.suggestion && zoneStatus.suggestion.toLowerCase() !== city.toLowerCase() && (
              <button
                type="button"
                onClick={() => {
                  setCity(zoneStatus.suggestion!);
                  checkZone(zoneStatus.suggestion!);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#D35400]/10 text-[#D35400] border border-[#D35400]/20 hover:bg-[#D35400]/20 cursor-pointer transition-colors"
              >
                <span>Vous vouliez dire {zoneStatus.suggestion} ? Oui</span>
              </button>
            )}
          </div>

          {/* Règle Prompt 05-F : Lien discret "Préciser ma position (optionnel)" */}
          <div className="pt-0.5 flex items-center justify-between">
            <button
              type="button"
              onClick={handleGeolocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1 text-[11px] text-[#666660] hover:text-[#111111] underline cursor-pointer"
            >
              <MapPin className="h-3 w-3 text-[#C2410C]" />
              <span>{isLocating ? "Détection en cours..." : "Préciser ma position (optionnel)"}</span>
            </button>
            {isLocating && (
              <span className="text-[10px] text-[#888880]">Localisation en cours...</span>
            )}
          </div>
        </div>

        {/* Bannière informative spécifique selon la zone de livraison */}
        {isExpedition && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
            <Truck className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Zone d'expédition interurbaine (3 à 5 jours)</strong>
              <p className="text-[11px] text-amber-900 mt-0.5 leading-snug">
                Livraison <strong>GRATUITE</strong> en point relais sécurisé. Un paiement préalable par Mobile Money est requis avant l'expédition du colis.
              </p>
            </div>
          </div>
        )}

        {isNotServed && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-rose-900">Livraison indisponible dans cette ville</strong>
              <p className="text-[11px] text-rose-800 mt-0.5 leading-snug">
                Nous ne desservons pas encore cette localité. Veuillez sélectionner une ville voisine ou nous contacter directement sur WhatsApp.
              </p>
            </div>
          </div>
        )}

        {/* Adresse ou point de repère précis */}
        <div>
          <label className="block text-xs font-bold text-[#111111] mb-1">
            Adresse exacte ou point de repère <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ex: Près de la Pharmacie de la Paix, maison clôturée..."
            className="w-full min-h-[44px] px-3.5 py-2.5 text-xs rounded-xl border border-black/[0.1] bg-white text-[#111111] placeholder:text-[#888880] focus:outline-none focus:ring-2 focus:ring-black/[0.15]"
          />
        </div>

        {/* Précision pour la livraison */}
        {(settings.showDeliveryInstructions || settings.showDeliveryPrecision) && (
          <div>
            <label className="block text-[11px] font-bold text-[#666660] uppercase mb-1">
              Précision pour le livreur (Facultatif)
            </label>
            <input
              type="text"
              value={deliveryPrecision}
              onChange={(e) => setDeliveryPrecision(e.target.value)}
              placeholder="Ex: Appeler avant de venir, livrer après 14h..."
              className="w-full min-h-[40px] px-3 py-2 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] placeholder:text-[#888880] focus:outline-none"
            />
          </div>
        )}

        {/* E-mail optionnel */}
        {settings.showEmailField && (
          <div>
            <label className="block text-[11px] font-bold text-[#666660] uppercase mb-1">
              Adresse e-mail (Facultatif)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Pour recevoir votre reçu par e-mail"
              className="w-full min-h-[40px] px-3 py-2 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] placeholder:text-[#888880] focus:outline-none"
            />
          </div>
        )}

        {/* Case d'engagement (S'adapte dynamiquement si expédition prépayée) */}
        {settings.requireCommitmentCheckbox && !isNotServed && (
          <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] cursor-pointer select-none">
            <input
              type="checkbox"
              required
              checked={commitmentChecked}
              onChange={(e) => setCommitmentChecked(e.target.checked)}
              className="h-4 w-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer shrink-0"
            />
            <span className="text-xs font-semibold text-[#111111] leading-relaxed">
              {isExpedition
                ? "Je confirme ma commande et je m'engage à payer sous 24h par Mobile Money pour que mon colis soit expédié."
                : settings.commitmentCheckboxText}
            </span>
          </label>
        )}

        {/* Récapitulatif financier interactif (LIVRAISON GRATUITE ABSOLUE) */}
        <div className="rounded-2xl border border-black/[0.08] bg-[#FAF8F5] p-4 space-y-2 text-xs">
          <div className="flex justify-between text-[#666660]">
            <span>Sous-total articles :</span>
            <span className="font-semibold text-[#111111]">
              {(activeOffer.totalPrice || product.price || product.salePrice || 0).toLocaleString("fr-FR")} FCFA
            </span>
          </div>
          <div className="flex justify-between items-center text-emerald-800 font-bold">
            <span className="flex items-center gap-1">
              <Truck className="h-3.5 w-3.5" />
              Livraison ({city}) :
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[11px] font-black">
              GRATUITE
            </span>
          </div>
          {activeOffer.savingsAmount > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Réduction formule :</span>
              <span>-{activeOffer.savingsAmount.toLocaleString("fr-FR")} FCFA</span>
            </div>
          )}
          <div className="pt-2 border-t border-black/[0.08] flex justify-between items-center text-sm font-black text-[#111111]">
            <span>TOTAL À PAYER :</span>
            <span className="text-base font-black text-emerald-700">
              {estimatedTotal.toLocaleString("fr-FR")} FCFA
            </span>
          </div>
          <div className="flex items-center gap-1.5 pt-1 text-[10px] font-bold text-emerald-800">
            <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
            <span>
              {isExpedition
                ? "Expédition sécurisée en point relais · Retrait sur présentation de pièce d'identité"
                : "Livraison gratuite garantie · Paiement à la réception du colis"}
            </span>
          </div>
        </div>

        {/* Message d'erreur serveur */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Bouton Principal de commande */}
        <button
          type="submit"
          disabled={isSubmitting || isNotServed}
          style={{
            backgroundColor: isNotServed ? "#888880" : primaryColor,
            color: contrastTextColor,
          }}
          className="w-full min-h-[52px] py-3.5 px-6 rounded-2xl font-black text-sm tracking-wide shadow-xl flex items-center justify-center gap-2 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Validation en cours...
            </span>
          ) : isNotServed ? (
            <span>Livraison indisponible dans cette ville</span>
          ) : (
            <span className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span>
                {isExpedition ? "Commander (Paiement avant expédition)" : "Je commande"} — {estimatedTotal.toLocaleString("fr-FR")} FCFA
              </span>
            </span>
          )}
        </button>

        {/* Microtextes de réassurance */}
        <div className="space-y-1 text-center pt-1">
          <p className="text-[11px] text-[#666660] flex items-center justify-center gap-1.5">
            <Truck className="h-3 w-3 text-emerald-600 shrink-0" />
            <span>Livraison gratuite partout · Aucun frais caché</span>
          </p>
          <p className="text-[11px] text-[#666660] flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
            <span>Vérification du colis avant paiement (en livraison locale)</span>
          </p>
        </div>
      </form>
    </div>
  );
}

// Barre d'action mobile collante
export function StickyMobileOrderBar({
  productPrice,
  formTargetId = "standard-cod-order-form",
  primaryColor = "#111111",
  contrastTextColor = "#FFFFFF",
}: {
  productPrice: number;
  formTargetId?: string;
  primaryColor?: string;
  contrastTextColor?: string;
}) {
  const handleScrollToForm = () => {
    const el = document.getElementById(formTargetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <aside
      aria-label="Commander rapidement"
      className="fixed bottom-0 inset-x-0 z-40 p-3 bg-white/95 backdrop-blur-md border-t border-black/[0.08] lg:hidden shadow-2xl flex items-center justify-between gap-3 pb-[calc(12px+env(safe-area-inset-bottom))]"
    >
      <div>
        <span className="text-[10px] font-bold text-emerald-700 uppercase block">Paiement à la livraison</span>
        <span className="text-base font-black text-[#111111]">
          {productPrice.toLocaleString("fr-FR")} FCFA
        </span>
      </div>
      <button
        type="button"
        onClick={handleScrollToForm}
        style={{
          backgroundColor: primaryColor,
          color: contrastTextColor,
        }}
        className="min-h-[46px] px-6 py-2.5 rounded-2xl font-black text-xs tracking-wide shadow-md flex items-center gap-2 cursor-pointer"
      >
        <ShoppingBag className="h-4 w-4" />
        <span>Commander · {productPrice.toLocaleString("fr-FR")} FCFA</span>
      </button>
    </aside>
  );
}
