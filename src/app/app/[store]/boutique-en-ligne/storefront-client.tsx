"use client";

import React, { useState, useMemo, useEffect, useId } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Smartphone,
  Monitor,
  ExternalLink,
  Paintbrush,
  Sliders,
  Sparkles,
  Layers,
  Eye,
  CheckCircle2,
  Save,
  RotateCcw,
  Upload,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Clock,
  Send,
  MessageCircle,
  Truck,
  Check,
  Globe2,
  FileText,
  HelpCircle,
  Menu,
  Building2,
  Store as StoreIcon,
  Lock,
  AlertTriangle,
  Phone,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import {
  MOCK_STOREFRONT_LOME,
  THEME_PRESETS,
  canPublishStorefront,
} from "@/mock-data/storefront-data";
import { MOCK_PRODUCTS } from "@/mock-data/products";
import { StorefrontData, ThemeConfig, PageSection } from "@/server/data/storefront-types";
import { useApp } from "@/components/layout/app-shell";
import { formatFcfa } from "@/lib/money";
import { CountryFlag } from "@/components/ui/country-flag";
import {
  getSortedAfricanCountries,
  getCountryByCode,
  searchAfricanCountries,
  AfricanCountryConfig,
} from "@/config/countries";
import { canChangeStoreCountry, canEditStore } from "@/config/permissions";
import { cn } from "@/lib/utils";

interface StorefrontClientProps {
  storeSlug: string;
}

export function StorefrontClient({ storeSlug }: StorefrontClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputId = useId();
  const { activeStore, setActiveStore, activeRole, stores } = useApp();

  const isCloser = activeRole === "closer";
  const isRider = activeRole === "rider";
  const isRestricted = isCloser || isRider;

  // Ordre strict des sections (Prompt 05-N) :
  // 1. Informations de la boutique
  // 2. Thème (couleurs, polices)
  // 3. Bannières
  // 4. Page d'accueil
  // 5. Catalogue
  // 6. Contact
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<
    "info" | "theme" | "banners" | "home" | "catalog" | "contact"
  >(
    tabParam === "info" || !tabParam
      ? "info"
      : (tabParam as any) || "info"
  );

  // État Section 1 : Informations de la boutique (Prompt 05-N)
  const [infoStoreName, setInfoStoreName] = useState(activeStore.name || "Lomé Glow Cosmétiques");
  const [infoDescription, setInfoDescription] = useState(
    "Boutique e-commerce COD spécialisée en santé naturelle et cosmétique premium en Afrique de l'Ouest."
  );
  const [infoCountry, setInfoCountry] = useState(activeStore.country || "TG");
  const [infoLogo, setInfoLogo] = useState<string | undefined>(undefined);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [contrastWarning, setContrastWarning] = useState<string | null>(null);

  // Prompt 05-Z : Migration de « Pays & Zones » vers l'éditeur de vitrine
  const [enabledCountryCodes, setEnabledCountryCodes] = useState<Set<string>>(
    new Set(["TG", "CI", "BJ", "SN", "BF", "ML", "CM"])
  );
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [defaultDeliveryCost, setDefaultDeliveryCost] = useState(1500); // L : Frais livraison vendeur par défaut (FCFA)
  const [prepaidZones, setPrepaidZones] = useState<Array<{ id: string; zoneName: string; requirePrepayment: boolean }>>([
    { id: "pz_1", zoneName: "Kara & Nord Togo", requirePrepayment: true },
    { id: "pz_2", zoneName: "Bouaké & Régions Intérieures CI", requirePrepayment: true },
  ]);
  const [newZoneName, setNewZoneName] = useState("");

  // Synchronisation avec activeStore
  useEffect(() => {
    if (activeStore) {
      setInfoStoreName(activeStore.name);
      setInfoCountry(activeStore.country);
    }
  }, [activeStore]);

  // État de la boutique (brouillon modifiable et snapshot publié)
  const [storefront, setStorefront] = useState<StorefrontData>(MOCK_STOREFRONT_LOME);
  const [draftTheme, setDraftTheme] = useState<ThemeConfig>(storefront.draftTheme);
  const [sections, setSections] = useState<PageSection[]>(storefront.sections);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewPage, setPreviewPage] = useState<"home" | "catalog" | "contact">("home");

  // Modales
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>("sec_hero");

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const orderCount = (activeStore as any).orderCount ?? (activeStore.slug === "cotonou-test" ? 0 : 142);
  const isCountryLocked = orderCount > 0;
  const canOwnerEditCountry = canChangeStoreCountry(activeRole, orderCount);

  const currentCountryConfig = getCountryByCode(infoCountry) || {
    code: infoCountry,
    name: activeStore.countryName || infoCountry,
    currency: activeStore.currency || "XOF",
    dialCode: "+228",
    platformEligible: true,
  };

  const currencyLabel =
    currentCountryConfig.currency === "XOF"
      ? "Franc CFA (XOF) — Sans décimales"
      : currentCountryConfig.currency === "XAF"
        ? "Franc CFA (XAF) — Sans décimales"
        : `${currentCountryConfig.currency} — Devise officielle`;

  // 54 Pays africains triés alphabétiquement (Prompt 05-Z)
  const all54SortedCountries = useMemo(() => getSortedAfricanCountries(), []);
  const filtered54Countries = useMemo(() => {
    return searchAfricanCountries(countrySearchQuery, all54SortedCountries);
  }, [countrySearchQuery, all54SortedCountries]);

  const handleToggleCountry = (country: AfricanCountryConfig) => {
    if (!country.platformEligible) {
      showToast(`${country.name} n'est pas encore ouvert sur la plateforme.`);
      return;
    }
    const isCurrentlyEnabled = enabledCountryCodes.has(country.code);
    if (isCurrentlyEnabled && enabledCountryCodes.size <= 1) {
      showToast("Au moins un pays doit rester activé (impossible de tout désactiver).");
      return;
    }
    const nextSet = new Set(enabledCountryCodes);
    if (isCurrentlyEnabled) {
      nextSet.delete(country.code);
      showToast(`${country.name} a été désactivé pour la vitrine.`);
    } else {
      nextSet.add(country.code);
      showToast(`${country.name} est maintenant activé pour la vitrine.`);
    }
    setEnabledCountryCodes(nextSet);
  };

  const handleAddPrepaidZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;
    setPrepaidZones((prev) => [
      ...prev,
      {
        id: `pz_${Date.now()}`,
        zoneName: newZoneName.trim(),
        requirePrepayment: true,
      },
    ]);
    setNewZoneName("");
    showToast("Zone d'expédition prépayée ajoutée.");
  };

  const handleRemovePrepaidZone = (id: string) => {
    setPrepaidZones((prev) => prev.filter((z) => z.id !== id));
    showToast("Zone retirée.");
  };

  // Condition de publication côté serveur
  const publishCheck = canPublishStorefront(activeStore, MOCK_PRODUCTS, storefront);

  // Détection des modifications non publiées
  const hasUnpublishedChanges = useMemo(() => {
    return (
      infoStoreName !== activeStore.name ||
      infoCountry !== activeStore.country ||
      JSON.stringify(draftTheme) !== JSON.stringify(storefront.activeTheme) ||
      JSON.stringify(sections) !== JSON.stringify(storefront.sections)
    );
  }, [infoStoreName, infoCountry, activeStore, draftTheme, sections, storefront]);

  // Avertissement de sortie de page en cas de modifications non enregistrées
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnpublishedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnpublishedChanges]);

  // Gestion du logo (Prompt 05-N : SVG refusé pour sécurité, PNG/JPG/WebP < 2Mo, avertissement de contraste)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError(null);
    setContrastWarning(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "image/svg+xml" || file.name.endsWith(".svg")) {
      setLogoError("Les fichiers SVG sont strictement refusés pour des raisons de sécurité (risque d'injection de script). Veuillez utiliser PNG, JPG ou WebP.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setLogoError("Format de fichier non supporté. Veuillez téléverser un fichier PNG, JPG ou WebP.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoError("La taille du logo dépasse la limite autorisée de 2 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setInfoLogo(dataUrl);

      // Détection amicale de contraste avec la couleur d'en-tête
      const isHeaderDark = draftTheme.colors.primary.toLowerCase().startsWith("#0") || draftTheme.colors.primary.toLowerCase().startsWith("#1");
      if (isHeaderDark) {
        setContrastWarning("Astuce contraste : Le fond de votre en-tête est foncé. Assurez-vous que votre logo est bien contrasté et lisible.");
      }
    };
    reader.readAsDataURL(file);
  };

  // Si l'utilisateur est closeuse ou livreur : écran d'accès restreint RLS (Prompt 05-N)
  if (isRestricted) {
    return (
      <div className="space-y-6 pb-20">
        <div className="rounded-[24px] border border-rose-200 bg-rose-50/50 p-12 text-center shadow-2xs space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-rose-950">Accès Restreint (Sécurité RLS)</h2>
            <p className="text-xs text-rose-700 max-w-md mx-auto mt-1">
              Votre rôle ({activeRole}) ne vous autorise pas à modifier la vitrine en ligne, les informations de boutique ni les paramètres CMS.
            </p>
          </div>
          <Link
            href={`/app/${storeSlug}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all shadow-sm"
          >
            <span>Retour au Tableau de Bord</span>
          </Link>
        </div>
      </div>
    );
  }

  // Action : Adapter ma boutique à mes produits par IA
  const handleAITuneTheme = () => {
    const tunedTheme: ThemeConfig = {
      ...draftTheme,
      name: "Harmonie IA Vitalité & Éclat",
      colors: {
        ...draftTheme.colors,
        primary: "#059669",
        secondary: "#10B981",
        background: "#FAF8F5",
        text: "#111111",
      },
      typography: {
        fontFamily: "Poppins",
        headingFont: "Poppins",
        baseSize: "16px",
      },
      styles: {
        buttonStyle: "rounded",
        borderRadius: "md",
        showShadows: true,
      },
    };

    setDraftTheme(tunedTheme);
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === "sec_hero") {
          return {
            ...s,
            content: {
              ...s.content,
              headline: "Sublimez Votre Beauté & Boostez Votre Énergie Naturelle",
              subheadline:
                "Soins certifiés et compléments formulés pour le bien-être quotidien en Afrique. Paiement sécurisé à la livraison.",
              badgeText: "✨ Sélection Recommandée par l'IA",
            },
          };
        }
        return s;
      })
    );

    showToast("Thème et textes adaptés par l'IA enregistrés en brouillon !");
  };

  // Action : Publier / Enregistrer la boutique (Enregistrement unifié Prompt 05-N)
  const handlePublish = async () => {
    if (!publishCheck.allowed) {
      alert(`Publication impossible :\n- ${publishCheck.missingRequirements.join("\n- ")}`);
      return;
    }

    try {
      // Mise à jour côté serveur du nom et des infos boutique via l'API
      await fetch(`/api/stores/${activeStore.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userRole: activeRole,
          userId: "usr_current_admin",
          name: infoStoreName.trim(),
          description: infoDescription.trim(),
          logo: infoLogo,
          country: isCountryLocked ? undefined : infoCountry,
        }),
      });
    } catch {
      // Mode hors-ligne / mock fallback
    }

    const newVersion = {
      id: `ver_${Date.now()}`,
      versionNumber: storefront.versions.length + 1,
      name: `Mise à jour v${storefront.versions.length + 1}`,
      createdAt: new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdBy: "Promises Bedi",
      themeConfig: draftTheme,
      sections,
      isPublished: true,
    };

    setStorefront((prev) => ({
      ...prev,
      isPublished: true,
      publishedAt: newVersion.createdAt,
      activeTheme: draftTheme,
      sections,
      versions: [newVersion, ...prev.versions],
    }));

    setActiveStore({
      ...activeStore,
      name: infoStoreName,
      country: infoCountry,
    });

    showToast("Informations de la boutique et vitrine enregistrées avec succès !");
  };

  // Action : Annuler les modifications
  const handleRevert = () => {
    if (confirm("Voulez-vous annuler toutes les modifications non publiées et revenir à la version active ?")) {
      setDraftTheme(storefront.activeTheme);
      setSections(storefront.sections);
      setInfoStoreName(activeStore.name);
      setInfoCountry(activeStore.country);
      showToast("Modifications annulées. Version active restaurée.");
    }
  };

  // Réordonner les sections
  const moveSection = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    const updated = [...sections];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setSections(updated.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const toggleSectionVisibility = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isVisible: !s.isVisible } : s))
    );
  };

  const allCountries = getSortedAfricanCountries();

  return (
    <div className="space-y-6 pb-20">
      {/* Toast de Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#111111] text-white text-xs font-bold shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOPBAR ÉDITEUR : Lié à la boutique active + Sélecteur multi-boutiques (Prompt 05-N) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-3xl border border-black/10 bg-[#FAF8F5] p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white border border-black/10 flex items-center justify-center font-bold shadow-xs shrink-0">
            <CountryFlag code={infoCountry} width={26} height={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-black text-[#111111]">{infoStoreName}</h1>
              {stores.length > 1 && (
                <select
                  value={activeStore.slug}
                  onChange={(e) => {
                    const next = stores.find((s) => s.slug === e.target.value);
                    if (next) {
                      setActiveStore(next);
                      router.push(`/app/${next.slug}/boutique-en-ligne`);
                    }
                  }}
                  className="text-xs font-bold px-2 py-0.5 rounded-lg border border-black/10 bg-white text-[#111111] shadow-2xs cursor-pointer"
                  aria-label="Changer de boutique"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.slug}>
                      {s.name} ({s.country})
                    </option>
                  ))}
                </select>
              )}
              {hasUnpublishedChanges ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                  Brouillon non enregistré
                </span>
              ) : storefront.isPublished ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Publiée en ligne
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  Brouillon
                </span>
              )}
            </div>
            <p className="text-xs text-[#666660]">
              Vitrine publique :{" "}
              <span className="font-mono text-[11px] text-[#111111]">
                /boutique/{activeStore.slug}
              </span>
            </p>
          </div>
        </div>

        {/* Contrôles Topbar : Sélecteur d'appareil, Aperçu Privé, Publier */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Appareil Desktop / Mobile */}
          <div className="flex items-center rounded-xl border border-black/10 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setPreviewDevice("desktop")}
              className={`p-1.5 rounded-lg transition-all ${previewDevice === "desktop"
                ? "bg-[#111111] text-[#FAF8F5] font-bold"
                : "text-[#666660] hover:text-[#111111]"
                }`}
              title="Aperçu Ordinateur"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice("mobile")}
              className={`p-1.5 rounded-lg transition-all ${previewDevice === "mobile"
                ? "bg-[#111111] text-[#FAF8F5] font-bold"
                : "text-[#666660] hover:text-[#111111]"
                }`}
              title="Aperçu Mobile (iPhone 13)"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>

          {/* Bouton Aperçu Privé */}
          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-black/10 bg-white text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] transition-all shadow-2xs cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Aperçu privé</span>
          </button>

          {/* Bouton Voir la Vitrine Publique */}
          <Link
            id="btn-storefront-view-public"
            href={`/boutique/${storeSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            title={storefront.isPublished ? "Voir la boutique" : "Aperçu de la boutique (non publiée)"}
            aria-label="Voir la boutique (s'ouvre dans un nouvel onglet)"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-black/10 bg-white text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] transition-all shadow-2xs cursor-pointer min-h-[36px]"
          >
            <Eye className="h-4 w-4" />
            <span>Voir la vitrine</span>
          </Link>

          {/* Annuler si modifications */}
          {hasUnpublishedChanges && (
            <button
              type="button"
              onClick={handleRevert}
              className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all cursor-pointer shadow-2xs"
            >
              Annuler
            </button>
          )}

          {/* Bouton Enregistrer / Publier la boutique */}
          <button
            type="button"
            id="btn-save-storefront"
            onClick={handlePublish}
            disabled={!publishCheck.allowed}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Enregistrer</span>
          </button>
        </div>
      </div>

      {/* ZONE DE TRAVAIL PRINCIPALE (SIDEBAR ÉDITION + CANVAS LIVE PREVIEW) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PANNEAU LATÉRAL GAUCHE (RÉGLAGES CMS) : 5 colonnes */}
        <div className="lg:col-span-5 rounded-3xl border border-black/10 bg-[#FAF8F5] p-5 shadow-2xs space-y-5">
          {/* Onglets des Réglages : Ordre strict Prompt 05-N */}
          <div className="flex flex-wrap gap-1.5 border-b border-black/[0.08] pb-3">
            {[
              { id: "info", label: "Informations", icon: StoreIcon },
              { id: "theme", label: "Thème", icon: Paintbrush },
              { id: "banners", label: "Bannières", icon: Sparkles },
              { id: "home", label: "Page d'accueil", icon: Layers },
              { id: "catalog", label: "Catalogue", icon: Sliders },
              { id: "contact", label: "Contact", icon: Phone },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                id={`tab-storefront-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  activeTab === tab.id
                    ? "bg-[#111111] text-white shadow-2xs"
                    : "text-[#666660] hover:text-[#111111] hover:bg-white"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ======================================================== */}
          {/* SECTION 1 : INFORMATIONS DE LA BOUTIQUE (Prompt 05-N)    */}
          {/* ======================================================== */}
          {activeTab === "info" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#111111]">
                <Building2 className="h-4 w-4 text-[#C2410C]" />
                <span>1. Informations Générales de la Vitrine</span>
              </div>

              {/* 1. Nom commercial de la boutique */}
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Nom commercial de la boutique <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  id="input-info-store-name"
                  value={infoStoreName}
                  maxLength={60}
                  minLength={2}
                  required
                  onChange={(e) => setInfoStoreName(e.target.value)}
                  placeholder="Ex: Lomé Glow Cosmétiques"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 bg-white font-bold text-[#111111] focus:outline-none focus:ring-2 focus:ring-black/15 shadow-2xs"
                />
                <p className="text-[10px] text-[#888880] mt-0.5">
                  2 à 60 caractères. Visible dans l&apos;en-tête de la vitrine et sur les factures.
                </p>
              </div>

              {/* 2. Description et accroche (max 160 caractères) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#111111]">
                    Description & Accroche marketing
                  </label>
                  <span className={cn(
                    "text-[10px] font-mono",
                    infoDescription.length > 150 ? "text-amber-700 font-bold" : "text-[#888880]"
                  )}>
                    {infoDescription.length} / 160
                  </span>
                </div>
                <textarea
                  id="input-info-store-description"
                  rows={3}
                  maxLength={160}
                  value={infoDescription}
                  onChange={(e) => setInfoDescription(e.target.value.slice(0, 160))}
                  placeholder="Ex: Produits naturels et soins certifiés pour votre bien-être quotidien en Afrique de l'Ouest..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-black/15 resize-none shadow-2xs"
                />
                <p className="text-[10px] text-[#888880] mt-0.5">
                  160 caractères maximum. Utilisé également pour les balises meta de référencement (SEO).
                </p>
              </div>

              {/* 3. Pays principal d'opération & Devise de facturation */}
              <div className="space-y-3 pt-2 border-t border-black/[0.06]">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
                      <CountryFlag code={infoCountry} width={18} height={12} />
                      <span>Pays principal</span>
                    </label>
                    {isCountryLocked && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Lock className="h-3 w-3" />
                        <span>Verrouillé ({orderCount} commandes)</span>
                      </span>
                    )}
                  </div>

                  {isCountryLocked ? (
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-2">
                      <div className="flex items-center gap-2">
                        <CountryFlag code={infoCountry} width={22} height={15} />
                        <span className="font-bold text-[#111111]">{currentCountryConfig.name}</span>
                      </div>
                      <p className="text-[11px] text-amber-900 leading-snug">
                        Cette boutique compte déjà <strong>{orderCount} commandes</strong>. Pour préserver l&apos;intégrité comptable et fiscale, le pays et la devise ne peuvent pas être modifiés.
                      </p>
                      <p className="text-[11px] font-bold text-amber-950">
                        Pour vendre dans un autre pays, dupliquez la boutique.
                      </p>
                    </div>
                  ) : (
                    <select
                      id="select-info-store-country"
                      value={infoCountry}
                      disabled={!canOwnerEditCountry}
                      onChange={(e) => setInfoCountry(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 bg-white font-bold text-[#111111] focus:outline-none focus:ring-2 focus:ring-black/15 shadow-2xs"
                    >
                      {allCountries.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name} ({c.currency})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 4. Devise de facturation (en lecture seule, déduite du pays) */}
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Devise de facturation
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currencyLabel}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 bg-black/[0.03] text-[#666660] font-mono font-bold cursor-not-allowed"
                  />
                  <p className="text-[10px] text-[#888880] mt-0.5">
                    Déduite automatiquement du pays. Les devises XOF et XAF sont strictement distinctes et jamais mélangées.
                  </p>
                </div>
              </div>

              {/* 5. Logo de la boutique */}
              <div className="pt-2 border-t border-black/[0.06] space-y-2">
                <label className="block text-xs font-bold text-[#111111]">
                  Logo de la boutique
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl border border-black/10 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {infoLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={infoLogo} alt="Logo de la boutique" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl font-black text-[#888880]">
                        {infoStoreName.slice(0, 2).toUpperCase() || "LG"}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={fileInputId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 hover:border-black/25 text-xs font-bold text-[#111111] bg-white hover:bg-black/[0.02] cursor-pointer transition-colors shadow-2xs"
                      >
                        <Upload className="h-3.5 w-3.5 text-[#666660]" />
                        <span>Changer le logo</span>
                      </label>
                      <input
                        id={fileInputId}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />

                      {infoLogo && (
                        <button
                          type="button"
                          onClick={() => setInfoLogo(undefined)}
                          className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Supprimer le logo"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-[#888880]">
                      PNG, JPG ou WebP. Fond transparent recommandé (max 2 Mo). SVG refusé.
                    </p>
                  </div>
                </div>

                {logoError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] font-semibold text-rose-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{logoError}</span>
                  </div>
                )}

                {contrastWarning && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>{contrastWarning}</span>
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* PROMPT 05-Z : PAYS ACTIFS, FRAIS LIVRAISON & ZONES PRÉPAYÉES */}
              {/* ======================================================== */}

              {/* 6. Pays où vous vendez (54 pays africains éligibles) */}
              <div className="pt-4 border-t border-black/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
                      <Globe2 className="h-4 w-4 text-[#C2410C]" />
                      <span>Pays où vous vendez</span>
                      <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                        {enabledCountryCodes.size} actif{enabledCountryCodes.size > 1 ? "s" : ""}
                      </span>
                    </label>
                    <p className="text-[10px] text-[#888880] mt-0.5">
                      Activez les pays africains dans lesquels votre boutique accepte les commandes. Au moins 1 pays doit rester actif.
                    </p>
                  </div>
                </div>

                {/* Recherche dans les 54 pays */}
                <div className="relative">
                  <input
                    type="text"
                    id="input-search-countries-storefront"
                    value={countrySearchQuery}
                    onChange={(e) => setCountrySearchQuery(e.target.value)}
                    placeholder="Rechercher parmi les 54 pays d'Afrique (ex: Côte d'Ivoire, Bénin, Togo)..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-black/15 shadow-2xs"
                  />
                </div>

                {/* Grille compacte des 54 pays */}
                <div
                  id="storefront-countries-list"
                  className="max-h-56 overflow-y-auto rounded-2xl border border-black/10 bg-white p-2 space-y-1 divide-y divide-black/[0.04]"
                >
                  {filtered54Countries.map((c) => {
                    const isEnabled = enabledCountryCodes.has(c.code);
                    return (
                      <div
                        key={c.code}
                        className="pt-1.5 pb-1 px-1 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CountryFlag code={c.code} width={20} height={14} className="rounded shadow-2xs shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-[#111111] truncate block">
                              {c.name}
                            </span>
                            <span className="text-[9px] text-[#888880] font-mono">
                              {c.currency} · {c.dialCode}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          id={`toggle-country-${c.code.toLowerCase()}`}
                          onClick={() => handleToggleCountry(c)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer shrink-0",
                            isEnabled
                              ? "bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700"
                              : "bg-black/[0.04] text-[#666660] hover:bg-black/[0.08]"
                          )}
                        >
                          {isEnabled ? "Activé" : "Désactivé"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 7. Frais de livraison supportés par le vendeur (variable L) */}
              <div className="pt-4 border-t border-black/[0.06] space-y-2">
                <label className="block text-xs font-bold text-[#111111]">
                  Frais de livraison vendeur par défaut (L)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      id="input-default-delivery-cost"
                      min={0}
                      step={100}
                      value={defaultDeliveryCost}
                      onChange={(e) => setDefaultDeliveryCost(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 bg-white font-mono font-bold text-[#111111] focus:outline-none focus:ring-2 focus:ring-black/15 shadow-2xs"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#888880]">
                      FCFA
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-[#888880] leading-relaxed">
                  Supporté par le vendeur (la livraison reste gratuite pour le client final). Cette valeur sert de base de calcul pour la rentabilité et le CPA breakeven dans le module <strong>Performance Produit</strong>. Modifiable produit par produit.
                </p>
              </div>

              {/* 8. Zones d'expédition prépayée */}
              <div className="pt-4 border-t border-black/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-[#C2410C]" />
                    <span>Zones d'expédition prépayée</span>
                  </label>
                </div>
                <p className="text-[10px] text-[#888880]">
                  Villes ou régions éloignées nécessitant une avance avant envoi. Règle garantie : le client écrit sa ville librement et aucune commande n'est bloquée.
                </p>

                {/* Formulaire d'ajout rapide de zone */}
                <form onSubmit={handleAddPrepaidZone} className="flex gap-2">
                  <input
                    type="text"
                    id="input-new-prepaid-zone"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    placeholder="Ex: Bouaké, Kara, San Pedro, Daloa..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-black/10 bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-black/15 shadow-2xs"
                  />
                  <button
                    type="submit"
                    id="btn-add-prepaid-zone"
                    className="px-3 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-colors shadow-2xs cursor-pointer"
                  >
                    Ajouter
                  </button>
                </form>

                {/* Liste des zones prépayées configurées */}
                <div id="prepaid-zones-list" className="space-y-1.5">
                  {prepaidZones.map((zone) => (
                    <div
                      key={zone.id}
                      className="p-2 rounded-xl border border-black/[0.08] bg-white flex items-center justify-between text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#111111]">{zone.zoneName}</span>
                        <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded-full font-bold">
                          Prépaiement partiel requis
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePrepaidZone(zone.id)}
                        className="p-1 rounded text-[#888880] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Retirer cette zone"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECTION 2 : THÈMES (COULEURS, POLICES)                   */}
          {/* ======================================================== */}
          {activeTab === "theme" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span>Adapter ma boutique à mes produits (IA)</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  L&apos;IA analyse votre catalogue et ajuste automatiquement les couleurs, typographies et accroches pour maximiser le taux de confirmation COD.
                </p>
                <button
                  type="button"
                  onClick={handleAITuneTheme}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-all shadow-xs cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Générer l&apos;harmonie IA</span>
                </button>
              </div>

              {/* Modèles de Thèmes Prédéfinis */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#666660] block">
                  Modèles de thèmes prédéfinis
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {Object.entries(THEME_PRESETS).map(([key, thm]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDraftTheme(thm)}
                      className={`p-3 rounded-2xl border text-left transition-all relative ${draftTheme.preset === thm.preset
                        ? "border-[#111111] bg-white shadow-2xs"
                        : "border-black/[0.08] bg-white/60 hover:bg-white text-[#666660]"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-4 w-4 rounded-full border border-black/20"
                          style={{ backgroundColor: thm.colors.primary }}
                        />
                        <span className="text-xs font-bold text-[#111111] truncate">{thm.name}</span>
                      </div>
                      <p className="text-[10px] text-[#888880] mt-1 capitalize">Police : {thm.typography.fontFamily}</p>
                      {draftTheme.preset === thm.preset && (
                        <span className="absolute top-2 right-2 text-emerald-600">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Palette de couleurs */}
              <div className="space-y-3 pt-2 border-t border-black/[0.06]">
                <label className="text-xs font-bold uppercase tracking-wider text-[#666660] block">
                  Palette de couleurs
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-[#666660] block mb-1">Couleur primaire</span>
                    <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white p-2">
                      <input
                        type="color"
                        value={draftTheme.colors.primary}
                        onChange={(e) =>
                          setDraftTheme((prev) => ({
                            ...prev,
                            colors: { ...prev.colors, primary: e.target.value },
                          }))
                        }
                        className="h-6 w-6 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-xs font-mono font-bold">{draftTheme.colors.primary}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-[#666660] block mb-1">Fond de la page</span>
                    <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white p-2">
                      <input
                        type="color"
                        value={draftTheme.colors.background}
                        onChange={(e) =>
                          setDraftTheme((prev) => ({
                            ...prev,
                            colors: { ...prev.colors, background: e.target.value },
                          }))
                        }
                        className="h-6 w-6 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-xs font-mono font-bold">{draftTheme.colors.background}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Style des boutons */}
              <div className="space-y-2 pt-2 border-t border-black/[0.06]">
                <label className="text-xs font-bold uppercase tracking-wider text-[#666660] block">
                  Style des boutons COD
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "rounded", label: "Arrondi doux", class: "rounded-xl" },
                    { id: "square", label: "Carré épuré", class: "rounded-xs" },
                    { id: "pill", label: "Pilule", class: "rounded-full" },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() =>
                        setDraftTheme((prev) => ({
                          ...prev,
                          styles: { ...prev.styles, buttonStyle: btn.id as any },
                        }))
                      }
                      className={`p-2.5 text-xs font-bold border transition-all text-center cursor-pointer ${draftTheme.styles.buttonStyle === btn.id
                        ? "border-[#111111] bg-[#111111] text-white"
                        : "border-black/10 bg-white text-[#666660] hover:text-[#111111]"
                        } ${btn.class}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECTION 3 : BANNIÈRES DÉFILANTES                         */}
          {/* ======================================================== */}
          {activeTab === "banners" && (
            <div className="space-y-4 animate-in fade-in duration-150 text-xs">
              <div>
                <label className="font-bold text-[#111111] block mb-1">Bandeau d&apos;annonce supérieur</label>
                <input
                  type="text"
                  value={storefront.announcementBar.text}
                  onChange={(e) =>
                    setStorefront((prev) => ({
                      ...prev,
                      announcementBar: { ...prev.announcementBar, text: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-black/15 bg-white font-medium text-[#111111] focus:outline-none"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] space-y-2">
                <span className="font-bold text-[#111111] block">Bannière promotionnelle défilante</span>
                <p className="text-[11px] text-[#666660]">
                  Affiche en boucle vos promesses fortes : « Livraison gratuite à domicile », « Paiement en espèces à la livraison », « Service client 7j/7 ».
                </p>
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs pt-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Défilement infini actif sur la vitrine</span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECTION 4 : PAGE D'ACCUEIL                               */}
          {/* ======================================================== */}
          {activeTab === "home" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#666660]">
                  Sections actives ({sections.filter((s) => s.isVisible).length})
                </label>
                <span className="text-[10px] text-[#888880]">Glissez ou utilisez les flèches</span>
              </div>

              <div className="space-y-2">
                {sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className={`p-3 rounded-2xl border transition-all ${editingSectionId === sec.id
                      ? "border-[#111111] bg-white shadow-2xs"
                      : "border-black/[0.08] bg-white/70 hover:bg-white"
                      } ${!sec.isVisible ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleSectionVisibility(sec.id)}
                          className={`h-5 w-5 rounded-full flex items-center justify-center transition-all ${sec.isVisible ? "bg-emerald-100 text-emerald-700" : "bg-black/10 text-[#888880]"
                            }`}
                          title={sec.isVisible ? "Masquer la section" : "Afficher la section"}
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-bold text-[#111111] truncate">{sec.title}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveSection(idx, "up")}
                          className="p-1 rounded-lg text-[#888880] hover:text-[#111111] disabled:opacity-30 cursor-pointer"
                          title="Monter"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === sections.length - 1}
                          onClick={() => moveSection(idx, "down")}
                          className="p-1 rounded-lg text-[#888880] hover:text-[#111111] disabled:opacity-30 cursor-pointer"
                          title="Descendre"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSectionId(sec.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${editingSectionId === sec.id
                            ? "bg-[#111111] text-white"
                            : "border border-black/10 text-[#666660]"
                            }`}
                        >
                          Éditer
                        </button>
                      </div>
                    </div>

                    {editingSectionId === sec.id && sec.id === "sec_hero" && (
                      <div className="mt-3 pt-3 border-t border-black/[0.06] space-y-2.5 text-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-[#666660] block mb-1">
                            Titre d&apos;accroche (Headline)
                          </span>
                          <input
                            type="text"
                            value={sec.content.headline || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSections((prev) =>
                                prev.map((s) =>
                                  s.id === "sec_hero" ? { ...s, content: { ...s.content, headline: val } } : s
                                )
                              );
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-black/15 bg-white text-xs font-bold text-[#111111] focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECTION 5 : CATALOGUE                                    */}
          {/* ======================================================== */}
          {activeTab === "catalog" && (
            <div className="space-y-4 animate-in fade-in duration-150 text-xs">
              <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] space-y-2">
                <span className="font-bold text-[#111111] block">Affichage de la grille produits</span>
                <p className="text-[11px] text-[#666660]">
                  Gérez la disposition de vos produits, les badges de réduction et les pastilles « Livraison Gratuite ».
                </p>
                <div className="pt-2 flex items-center justify-between">
                  <span className="font-bold text-[#111111]">Nombre de produits en avant :</span>
                  <span className="font-mono font-bold text-[#C2410C]">4 produits</span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECTION 6 : CONTACT                                      */}
          {/* ======================================================== */}
          {activeTab === "contact" && (
            <div className="space-y-4 animate-in fade-in duration-150 text-xs">
              <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] space-y-2">
                <span className="font-bold text-[#111111] block">Page de contact & Support client</span>
                <p className="text-[11px] text-[#666660]">
                  Affiche les coordonnées officielles de votre boutique ({currentCountryConfig.name}), le bouton WhatsApp direct et les horaires de service.
                </p>
                <div className="pt-2 flex items-center gap-2 text-emerald-800 font-bold">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  <span>WhatsApp : {activeStore.whatsappNumber}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* PANNEAU DROIT (CANVAS LIVE PREVIEW EN DIRECT) : 7 cols   */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* Barre de navigation de l'aperçu */}
          <div className="w-full flex items-center justify-between pb-3 px-2">
            <div className="flex items-center gap-1.5 text-xs bg-white p-1 rounded-xl border border-black/10 shadow-2xs">
              <button
                type="button"
                onClick={() => setPreviewPage("home")}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${previewPage === "home" ? "bg-[#111111] text-white" : "text-[#666660]"
                  }`}
              >
                Accueil
              </button>
              <button
                type="button"
                onClick={() => setPreviewPage("catalog")}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${previewPage === "catalog" ? "bg-[#111111] text-white" : "text-[#666660]"
                  }`}
              >
                Catalogue
              </button>
              <button
                type="button"
                onClick={() => setPreviewPage("contact")}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${previewPage === "contact" ? "bg-[#111111] text-white" : "text-[#666660]"
                  }`}
              >
                Contact
              </button>
            </div>

            <span className="text-[11px] text-[#888880] font-medium hidden sm:inline">
              Aperçu en direct : {draftTheme.name}
            </span>
          </div>

          {/* Cadre de l'appareil (Desktop plein écran ou Mobile iPhone 390px) */}
          <div
            className={`w-full transition-all duration-300 overflow-hidden border border-black/15 bg-white shadow-xl ${previewDevice === "mobile"
              ? "max-w-[390px] rounded-[42px] border-8 border-black p-2 min-h-[680px]"
              : "rounded-3xl min-h-[640px]"
              }`}
            style={{
              backgroundColor: draftTheme.colors.background,
              fontFamily: draftTheme.typography.fontFamily,
            }}
          >
            {/* 1. Bandeau supérieur d'annonce */}
            {storefront.announcementBar.isEnabled && (
              <div
                className="py-2 px-4 text-center text-[11px] font-bold tracking-tight select-none"
                style={{
                  backgroundColor: storefront.announcementBar.bgColor || "#111111",
                  color: storefront.announcementBar.textColor || "#FAF8F5",
                }}
              >
                {storefront.announcementBar.text}
              </div>
            )}

            {/* 2. En-tête de la boutique (Synchronisé en direct avec les champs d'informations) */}
            <div className="px-5 py-3.5 border-b border-black/[0.08] flex items-center justify-between bg-white/80 backdrop-blur-xs">
              <div className="flex items-center gap-2.5">
                {infoLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={infoLogo} alt={infoStoreName} className="h-6 w-auto max-w-[80px] object-contain rounded" />
                ) : (
                  <span className="font-black text-sm tracking-tight text-[#111111]">
                    {infoStoreName}
                  </span>
                )}
                <CountryFlag code={infoCountry} width={20} height={14} />
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-[#666660]">
                <span className="cursor-pointer hover:text-[#111111]">Accueil</span>
                <span className="cursor-pointer hover:text-[#111111]">Catalogue</span>
                <span className="cursor-pointer hover:text-[#111111]">Contact</span>
              </div>
            </div>

            {/* 3. Contenu de la Page Prévisualisée */}
            {previewPage === "home" && (
              <div className="p-5 space-y-6">
                {/* Hero Banner Section (Synchronisé avec l'accroche infoDescription) */}
                {sections.find((s) => s.id === "sec_hero" && s.isVisible) && (
                  <div
                    className="rounded-3xl p-6 text-white space-y-3 relative overflow-hidden shadow-sm"
                    style={{ backgroundColor: draftTheme.colors.primary }}
                  >
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold backdrop-blur-xs">
                      {sections.find((s) => s.id === "sec_hero")?.content.badgeText || "✨ Offre Spéciale COD"}
                    </span>
                    <h2 className="text-xl font-black leading-tight">
                      {sections.find((s) => s.id === "sec_hero")?.content.headline || infoStoreName}
                    </h2>
                    <p className="text-xs text-white/90 leading-relaxed">
                      {infoDescription || sections.find((s) => s.id === "sec_hero")?.content.subheadline}
                    </p>
                    <button
                      type="button"
                      className={`px-4 py-2 bg-white text-[#111111] text-xs font-black shadow-md ${draftTheme.styles.buttonStyle === "pill"
                        ? "rounded-full"
                        : draftTheme.styles.buttonStyle === "square"
                          ? "rounded-xs"
                          : "rounded-xl"
                        }`}
                    >
                      {sections.find((s) => s.id === "sec_hero")?.content.ctaText || "Commander en Cash"}
                    </button>
                  </div>
                )}

                {/* Bandeau d'avantages COD */}
                {sections.find((s) => s.id === "sec_benefits" && s.isVisible) && (
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-3 rounded-2xl bg-white border border-black/[0.06] shadow-2xs">
                      <ShieldCheck className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
                      <p className="text-[11px] font-bold text-[#111111]">Paiement à la Livraison</p>
                      <p className="text-[9px] text-[#888880]">Payez après inspection</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white border border-black/[0.06] shadow-2xs">
                      <Truck className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                      <p className="text-[11px] font-bold text-[#111111]">Expédition 24h/48h</p>
                      <p className="text-[9px] text-[#888880]">Directement chez vous</p>
                    </div>
                  </div>
                )}

                {/* Best-sellers catalogue réel */}
                {sections.find((s) => s.id === "sec_featured_products" && s.isVisible) && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-wider text-[#111111]">
                        Nos Meilleures Ventes
                      </h3>
                      <span className="text-[10px] text-emerald-700 font-bold">Voir tout →</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {MOCK_PRODUCTS.slice(0, 2).map((prod) => (
                        <div
                          key={prod.id}
                          className="rounded-2xl border border-black/[0.08] bg-white p-3 space-y-2 shadow-2xs"
                        >
                          <div className="h-28 rounded-xl bg-[#FAF8F5] flex items-center justify-center font-bold text-xs text-[#888880]">
                            {prod.name}
                          </div>
                          <div>
                            <p className="text-xs font-black text-[#111111] line-clamp-1">{prod.name}</p>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span className="text-xs font-black text-[#111111]">
                                {formatFcfa(prod.salePrice)}
                              </span>
                              {prod.compareAtPrice && (
                                <span className="text-[10px] text-[#888880] line-through">
                                  {formatFcfa(prod.compareAtPrice)}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="w-full py-1.5 rounded-xl bg-[#111111] text-white text-[10px] font-bold"
                          >
                            Commander en Cash
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
