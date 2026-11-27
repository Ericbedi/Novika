"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import Link from "next/link";
import {
  X,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Copy,
  ExternalLink,
  Paintbrush,
  Upload,
  Trash2,
  RotateCcw,
  ShieldAlert,
  Loader2,
  Globe2,
  Phone,
  Mail,
  Check,
} from "lucide-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { UserRole } from "@/server/data/types";
import { canEditStore, canChangeStoreSlug, canChangeStoreCountry } from "@/config/permissions";
import { ALL_54_AFRICAN_COUNTRIES, getCountryByCode } from "@/config/countries";
import { CountryFlag } from "@/components/ui/country-flag";
import { cn } from "@/lib/utils";

export interface EditStoreDrawerProps {
  isOpen: boolean;
  store: {
    id: string;
    name: string;
    slug: string;
    country: string;
    countryName: string;
    currency: string;
    flag?: string;
    whatsappNumber: string;
    contactEmail?: string;
    description?: string;
    logo?: string;
    status: "active" | "archived" | "pending_deletion";
    orderCount?: number;
    productCount?: number;
    deletionDate?: string;
    version?: number;
  } | null;
  userRole: UserRole;
  onClose: () => void;
  onStoreUpdated: (updatedStore: any) => void;
  onDuplicateRequest?: (store: any) => void;
  onRestoreRequest?: (store: any) => void;
}

export function EditStoreDrawer({
  isOpen,
  store,
  userRole,
  onClose,
  onStoreUpdated,
  onDuplicateRequest,
  onRestoreRequest,
}: EditStoreDrawerProps) {
  const fileInputId = useId();

  // État local des champs du formulaire
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [slug, setSlug] = useState("");
  const [country, setCountry] = useState("TG");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [status, setStatus] = useState<"active" | "archived" | "pending_deletion">("active");

  // Contrôles de validation et d'état
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "unavailable" | "invalid">("idle");
  const [slugError, setSlugError] = useState("");
  const [whatsappError, setWhatsappError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Synchronisation avec la boutique sélectionnée
  useEffect(() => {
    if (store) {
      setName(store.name || "");
      setDescription(store.description || "");
      setLogo(store.logo);
      setSlug(store.slug || "");
      setCountry(store.country || "TG");
      setWhatsappNumber(store.whatsappNumber || "");
      setContactEmail(store.contactEmail || "");
      setStatus(store.status || "active");
      setSlugStatus("idle");
      setSlugError("");
      setWhatsappError("");
      setErrorMessage(null);
      setConflictError(false);
      setShowUnsavedModal(false);
    }
  }, [store]);

  // Détection de modifications non enregistrées (dirty check)
  const isDirty = Boolean(
    store &&
      (name !== (store.name || "") ||
        description !== (store.description || "") ||
        logo !== store.logo ||
        slug !== (store.slug || "") ||
        country !== (store.country || "TG") ||
        whatsappNumber !== (store.whatsappNumber || "") ||
        contactEmail !== (store.contactEmail || "") ||
        status !== store.status)
  );

  // Vérification de la disponibilité du slug en direct (avec debounce)
  useEffect(() => {
    if (!store || !isOpen) return;

    const clean = slug.toLowerCase().trim();
    if (clean === store.slug) {
      setSlugStatus("available");
      setSlugError("");
      return;
    }

    if (!/^[a-z0-9-]{3,40}$/.test(clean)) {
      setSlugStatus("invalid");
      setSlugError("Le lien doit contenir entre 3 et 40 caractères minuscules, chiffres et tirets.");
      return;
    }

    setSlugStatus("checking");
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stores/check-slug?slug=${encodeURIComponent(clean)}&storeId=${encodeURIComponent(store.id)}`);
        const data = await res.json();
        if (data.available) {
          setSlugStatus("available");
          setSlugError("");
        } else {
          setSlugStatus("unavailable");
          setSlugError(data.error || "Ce lien est déjà utilisé par une autre boutique.");
        }
      } catch {
        setSlugStatus("idle");
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [slug, store, isOpen]);

  // Validation du numéro WhatsApp avec libphonenumber-js
  const validatePhone = (phoneStr: string) => {
    const trimmed = phoneStr.trim();
    if (!trimmed) {
      setWhatsappError("Le numéro WhatsApp est obligatoire.");
      return false;
    }

    // Préfixe + automatique si oublié
    const formattedInput = trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
    const parsed = parsePhoneNumberFromString(formattedInput);

    if (!parsed || !parsed.isValid()) {
      setWhatsappError("Numéro WhatsApp invalide. Utilisez le format international (ex: +22890123456).");
      return false;
    }

    setWhatsappError("");
    return true;
  };

  const handlePhoneChange = (val: string) => {
    setWhatsappNumber(val);
    if (val.length >= 8) {
      validatePhone(val);
    } else {
      setWhatsappError("");
    }
  };

  // Gestion de l'upload d'image de logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Veuillez sélectionner un fichier image valide (PNG, JPG, WEBP, SVG).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("La taille du logo ne doit pas dépasser 2 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogo(reader.result as string);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Fermeture sécurisée (avec avertissement en cas de modifications non enregistrées)
  const handleAttemptClose = () => {
    if (isDirty) {
      setShowUnsavedModal(true);
    } else {
      onClose();
    }
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    // Validation préalable
    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage("Le nom de la boutique doit comporter au moins 2 caractères.");
      return;
    }

    if (!validatePhone(whatsappNumber)) {
      setErrorMessage("Veuillez renseigner un numéro WhatsApp valide.");
      return;
    }

    if (slugStatus === "unavailable" || slugStatus === "invalid") {
      setErrorMessage("Veuillez corriger le lien (slug) de la boutique avant d'enregistrer.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setConflictError(false);

    try {
      const payload = {
        userRole,
        userId: "usr_current_admin",
        clientVersion: store.version ?? 1,
        name: name.trim(),
        description: description.trim(),
        logo,
        slug: slug.trim().toLowerCase(),
        whatsappNumber: whatsappNumber.trim().startsWith("+") ? whatsappNumber.trim() : `+${whatsappNumber.trim()}`,
        contactEmail: contactEmail.trim() || undefined,
        status,
        country: country !== store.country ? country : undefined,
      };

      const res = await fetch(`/api/stores/${store.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setConflictError(true);
          setErrorMessage("Cette boutique a été modifiée par quelqu'un d'autre, rechargez.");
        } else {
          setErrorMessage(data.error || "Une erreur est survenue lors de la mise à jour.");
        }
        setIsSubmitting(false);
        return;
      }

      onStoreUpdated(data.store);
      onClose();
    } catch {
      setErrorMessage("Erreur réseau. Impossible d'enregistrer les modifications.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !store) return null;

  const isArchived = store.status === "archived";
  const isPendingDelete = store.status === "pending_deletion";
  const orderCount = store.orderCount ?? 0;
  const isCountryLocked = orderCount > 0;
  const canOwnerEditSlug = canChangeStoreSlug(userRole);
  const isReadOnly = isArchived || isPendingDelete;

  const selectedCountryObj = getCountryByCode(country) || {
    code: country,
    name: store.countryName || country,
    currency: store.currency || "XOF",
    dialCode: "+228",
  };

  return (
    <>
      {/* Arrière-plan sombre avec effet de flou */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={handleAttemptClose}
        aria-hidden="true"
      />

      {/* Panneau latéral (Drawer) : Plein écran sur mobile, tiroir latéral sur bureau */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-edit-store-title"
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full sm:max-w-xl md:max-w-2xl bg-white shadow-2xl border-l border-black/[0.08] flex flex-col overflow-x-hidden transform transition-transform duration-300 ease-in-out",
          "animate-in slide-in-from-right"
        )}
      >
        {/* ======================================================== */}
        {/* EN-TÊTE DU DRAWER */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.08] bg-[#FAF8F5] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-white border border-black/[0.08] flex items-center justify-center shrink-0 shadow-2xs">
              <CountryFlag code={country} width={26} height={18} />
            </div>
            <div className="min-w-0">
              <h2 id="drawer-edit-store-title" className="text-base font-black text-[#111111] truncate tracking-tight">
                {isReadOnly ? "Détails de la boutique" : "Modifier la boutique"}
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#666660]">
                <span className="font-semibold text-[#111111] truncate">{store.name}</span>
                <span>·</span>
                <span className="font-mono text-[11px]">/boutique/{store.slug}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAttemptClose}
            aria-label="Fermer le panneau"
            className="p-2 rounded-xl text-[#666660] hover:text-[#111111] hover:bg-black/[0.05] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* BANNIÈRES D'ÉTAT PARTICULIER */}
        {/* ======================================================== */}
        {isArchived && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
              <span className="truncate">
                Cette boutique est <strong>archivée</strong> (lecture seule). Elle ne reçoit plus de commandes COD.
              </span>
            </div>
            {onRestoreRequest && (
              <button
                type="button"
                onClick={() => onRestoreRequest(store)}
                className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer shadow-2xs"
              >
                Restaurer
              </button>
            )}
          </div>
        )}

        {isPendingDelete && (
          <div className="px-6 py-3 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldAlert className="h-4 w-4 text-rose-700 shrink-0" />
              <span className="truncate">
                Suppression définitive programmée le <strong>{store.deletionDate}</strong>.
              </span>
            </div>
          </div>
        )}

        {/* Message d'erreur global / Conflit de version */}
        {errorMessage && (
          <div className="px-6 py-3 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {conflictError && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-2.5 py-1 bg-rose-800 text-white rounded-lg text-xs font-bold hover:bg-rose-900 cursor-pointer"
              >
                Recharger
              </button>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* FORMULAIRE DÉROULANT DU DRAWER */}
        {/* ======================================================== */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* SECTION 1 : INFORMATIONS GÉNÉRALES */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-black/[0.06] pb-2">
              <Building2 className="h-4 w-4 text-[#C2410C]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                1. Informations Générales
              </h3>
            </div>

            {/* Logo de la boutique */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Logo de la marque
              </label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl border border-black/[0.1] bg-[#FAF8F5] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo} alt="Logo de la boutique" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl font-black text-[#888880]">
                      {name.slice(0, 2).toUpperCase() || "NB"}
                    </span>
                  )}
                </div>

                {!isReadOnly && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={fileInputId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/[0.1] hover:border-black/25 text-xs font-bold text-[#111111] bg-white hover:bg-black/[0.02] cursor-pointer transition-colors shadow-2xs"
                      >
                        <Upload className="h-3.5 w-3.5 text-[#666660]" />
                        <span>Changer le logo</span>
                      </label>
                      <input
                        id={fileInputId}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />

                      {logo && (
                        <button
                          type="button"
                          onClick={() => setLogo(undefined)}
                          className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Supprimer le logo"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#888880]">
                      Format PNG, JPG ou WEBP. Maximum 2 Mo. Ratio carré conseillé.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Nom de la boutique */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Nom de la boutique <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                disabled={isReadOnly}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                required
                placeholder="Ex: Lomé Glow Cosmétiques"
                className="w-full px-3 py-2 text-xs rounded-xl border border-black/[0.1] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/15 transition-all font-bold text-[#111111] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Description courte */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#111111]">
                  Description courte
                </label>
                <span className="text-[10px] text-[#888880]">
                  {description.length} / 250
                </span>
              </div>
              <textarea
                value={description}
                disabled={isReadOnly}
                onChange={(e) => setDescription(e.target.value.slice(0, 250))}
                rows={2}
                placeholder="Décrivez votre boutique en quelques mots pour vos clients et les moteurs de recherche..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-black/[0.1] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/15 transition-all text-[#111111] resize-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* SECTION 2 : LIEN DE LA BOUTIQUE (SLUG) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
              <div className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-[#C2410C]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                  2. Lien de la boutique (Slug)
                </h3>
              </div>
              {!canOwnerEditSlug && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Lock className="h-3 w-3" />
                  <span>Réservé au propriétaire</span>
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Adresse URL publique
              </label>
              <div className="flex items-center rounded-xl border border-black/[0.1] bg-[#FAF8F5] overflow-hidden focus-within:ring-2 focus-within:ring-black/15 focus-within:bg-white transition-all">
                <span className="px-3 text-xs font-mono text-[#888880] select-none border-r border-black/[0.06] bg-black/[0.02] py-2">
                  /boutique/
                </span>
                <input
                  type="text"
                  value={slug}
                  disabled={isReadOnly || !canOwnerEditSlug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="nom-de-boutique"
                  className="flex-1 px-3 py-2 text-xs font-mono font-bold text-[#111111] bg-transparent focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <div className="pr-3 flex items-center">
                  {slugStatus === "checking" && <Loader2 className="h-4 w-4 text-[#888880] animate-spin" />}
                  {slugStatus === "available" && <Check className="h-4 w-4 text-emerald-600" />}
                  {(slugStatus === "unavailable" || slugStatus === "invalid") && (
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                  )}
                </div>
              </div>

              {slugError && (
                <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span>{slugError}</span>
                </p>
              )}

              {slugStatus === "available" && slug !== store.slug && (
                <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span>Ce lien est disponible.</span>
                </p>
              )}

              {/* Message d'avertissement de redirection 301 pendant 90 jours */}
              {slug !== store.slug && slugStatus === "available" && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                  <strong>Redirection automatique (301) :</strong> Si vous modifiez ce lien, l'ancienne adresse{" "}
                  <code className="font-mono text-amber-950 font-bold">/boutique/{store.slug}</code> redirigera
                  automatiquement vers le nouveau lien pendant <strong>90 jours</strong> pour ne pas casser vos campagnes publicitaires ni vos liens WhatsApp existants.
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3 : CONTACT (WHATSAPP & EMAIL) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-black/[0.06] pb-2">
              <Phone className="h-4 w-4 text-[#C2410C]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                3. Contact et Commandes COD
              </h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Numéro WhatsApp de la boutique <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={whatsappNumber}
                  disabled={isReadOnly}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="+22890123456"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-black/[0.1] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/15 transition-all font-mono font-bold text-[#111111] disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              {whatsappError ? (
                <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span>{whatsappError}</span>
                </p>
              ) : (
                <p className="text-[11px] text-[#888880] mt-1">
                  Numéro officiel recevant les confirmations de commande COD et les relances clients.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                E-mail de contact
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={contactEmail}
                  disabled={isReadOnly}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@maboutique.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-black/[0.1] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/15 transition-all text-[#111111] disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4 : PAYS ET DEVISE (RÈGLES STRICTES D'INTÉGRITÉ) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
              <div className="flex items-center gap-2">
                <CountryFlag code={country} width={20} height={14} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                  4. Pays d'Opération et Devise
                </h3>
              </div>
              {isCountryLocked && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  <Lock className="h-3 w-3" />
                  <span>Verrouillé ({orderCount} commandes)</span>
                </span>
              )}
            </div>

            {isCountryLocked ? (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-amber-950">
                      {store.countryName} · Devise officielle : {store.currency}
                    </p>
                    <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                      Cette boutique compte déjà <strong>{orderCount} commandes</strong> enregistrées. Le pays et la devise sont strictement non modifiables afin de préserver l'intégrité comptable et fiscale.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-amber-950">
                    Pour vendre dans un autre pays :
                  </span>
                  {onDuplicateRequest && (
                    <button
                      type="button"
                      onClick={() => onDuplicateRequest(store)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Dupliquer la boutique</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#111111]">
                  Pays d'opération (Boutique sans commande)
                </label>
                <select
                  value={country}
                  disabled={isReadOnly}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-black/[0.1] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/15 font-bold text-[#111111] transition-all disabled:opacity-60"
                >
                  {ALL_54_AFRICAN_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.currency})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-emerald-700 font-medium">
                  Cette boutique n'a pas encore de commande : vous pouvez ajuster le pays et la devise librement.
                </p>
              </div>
            )}
          </div>

          {/* SECTION 5 : STATUT DE LA BOUTIQUE */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-black/[0.06] pb-2">
              <RotateCcw className="h-4 w-4 text-[#C2410C]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                5. Statut d'Activité
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label
                className={cn(
                  "flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer",
                  status === "active"
                    ? "border-emerald-500 bg-emerald-50/30 text-emerald-950 ring-1 ring-emerald-500/30"
                    : "border-black/[0.08] bg-[#FAF8F5] text-[#666660] hover:border-black/20"
                )}
              >
                <input
                  type="radio"
                  name="store_status"
                  value="active"
                  checked={status === "active"}
                  onChange={() => setStatus("active")}
                  className="mt-0.5 accent-emerald-600"
                />
                <div>
                  <span className="text-xs font-black block">Active</span>
                  <span className="text-[10px] text-[#666660]">Vitrine ouverte et commandes COD actives</span>
                </div>
              </label>

              <label
                className={cn(
                  "flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer",
                  status === "archived"
                    ? "border-amber-500 bg-amber-50/30 text-amber-950 ring-1 ring-amber-500/30"
                    : "border-black/[0.08] bg-[#FAF8F5] text-[#666660] hover:border-black/20"
                )}
              >
                <input
                  type="radio"
                  name="store_status"
                  value="archived"
                  checked={status === "archived"}
                  onChange={() => setStatus("archived")}
                  className="mt-0.5 accent-amber-600"
                />
                <div>
                  <span className="text-xs font-black block">Archivée</span>
                  <span className="text-[10px] text-[#666660]">Mise en sommeil sans nouvelle commande</span>
                </div>
              </label>
            </div>
          </div>

          {/* SECTION 6 : LIEN VITRINE & THÈME */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-black/[0.08] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white border border-black/[0.08] flex items-center justify-center text-[#C2410C] shrink-0">
                <Paintbrush className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-[#111111]">
                  Vitrine en ligne & Thème
                </h4>
                <p className="text-[11px] text-[#666660]">
                  Personnalisez la palette, les polices, bannières et sections de cette boutique.
                </p>
              </div>
            </div>

            <Link
              href={`/app/${store.slug}/reglages/theme`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-black/[0.1] hover:border-black/30 text-xs font-bold text-[#111111] hover:bg-black/[0.02] transition-colors shrink-0 shadow-2xs"
            >
              <span>Personnaliser</span>
              <ExternalLink className="h-3.5 w-3.5 text-[#666660]" />
            </Link>
          </div>
        </form>

        {/* ======================================================== */}
        {/* PIED DE PAGE ET ACTIONS DU DRAWER */}
        {/* ======================================================== */}
        <div className="px-6 py-4 border-t border-black/[0.08] bg-[#FAF8F5] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleAttemptClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#666660] hover:text-[#111111] hover:bg-black/[0.04] transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <div className="flex items-center gap-2">
            {isArchived ? (
              onRestoreRequest && (
                <button
                  type="button"
                  onClick={() => onRestoreRequest(store)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1F3A26] text-white hover:bg-[#162B1C] transition-colors cursor-pointer shadow-xs"
                >
                  Restaurer cette boutique
                </button>
              )
            ) : (
              <button
                type="button"
                id="btn-save-store-edits"
                onClick={handleSubmit}
                disabled={!isDirty || isSubmitting || slugStatus === "checking" || slugStatus === "invalid" || slugStatus === "unavailable" || !!whatsappError}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer",
                  !isDirty || isSubmitting || slugStatus === "checking" || slugStatus === "invalid" || slugStatus === "unavailable" || !!whatsappError
                    ? "bg-black/20 text-white/70 cursor-not-allowed"
                    : "bg-[#1F3A26] text-[#FAF8F5] hover:bg-[#162B1C]"
                )}
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Enregistrer les modifications</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODALE D'AVERTISSEMENT : MODIFICATIONS NON ENREGISTRÉES */}
      {/* ======================================================== */}
      {showUnsavedModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-sm rounded-3xl bg-[#FAF8F5] border border-black/10 p-5 shadow-2xl text-[#111111] space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight">Modifications non enregistrées</h4>
                <p className="text-xs text-[#666660]">Voulez-vous vraiment quitter ?</p>
              </div>
            </div>

            <p className="text-xs text-[#666660] leading-relaxed">
              Vous avez des modifications en cours pour la boutique <strong>{store.name}</strong>. Si vous fermez le panneau maintenant, vos changements seront perdus.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.08]">
              <button
                type="button"
                onClick={() => setShowUnsavedModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#666660] hover:text-[#111111] hover:bg-black/[0.04] cursor-pointer"
              >
                Continuer l'édition
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedModal(false);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer shadow-2xs"
              >
                Abandonner les modifications
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
