"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isValidPhoneNumber } from "libphonenumber-js";
import { AlertTriangle, Check, ImagePlus, Loader2, Sparkles, X, Zap } from "lucide-react";
import {
  WIZARD_COLORS,
  WIZARD_COUNTRIES,
  WIZARD_STYLES,
  readableTextOn,
  slugifyShopName,
  type WizardStyleKey,
} from "@/lib/store-wizard-presets";
import { uploadImageFile } from "@/lib/upload-data-images";
import { saveShopProductsList, getShopProductsRaw } from "@/lib/products-store";
import type { Product } from "@/server/data/types";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 5;

interface PickedImage {
  id: string;
  file: File;
  preview: string;
}

/** Réduit une image (côté navigateur) pour accélérer l'envoi sur mobile. */
async function compressImage(file: File, maxDim: number, quality: number): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const ratio = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * ratio);
    canvas.height = Math.round(bmp.height * ratio);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => resolve("");
    r.readAsDataURL(file);
  });
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type Phase = "form" | "working" | "done";

export function StoreWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState<Phase>("form");

  // Étape 1
  const [name, setName] = useState("");
  const [what, setWhat] = useState("");
  const [countryCode, setCountryCode] = useState("TG");
  const [whatsapp, setWhatsapp] = useState("");

  // Étape 2
  const [color, setColor] = useState<string>(WIZARD_COLORS[0]);
  const [style, setStyle] = useState<WizardStyleKey>("minimal");

  // Étape 3
  const [images, setImages] = useState<PickedImage[]>([]);
  const [price, setPrice] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Génération
  const [progress, setProgress] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ slug: string; aiUsed: boolean; imagesOk: number } | null>(null);

  const country = useMemo(() => WIZARD_COUNTRIES.find((c) => c.code === countryCode) || WIZARD_COUNTRIES[0], [countryCode]);
  const styleDef = WIZARD_STYLES.find((s) => s.key === style) || WIZARD_STYLES[0];

  const fullPhone = useMemo(() => {
    const digits = whatsapp.replace(/[^\d]/g, "");
    return digits ? `${country.dial}${digits.replace(/^0+/, "")}` : "";
  }, [whatsapp, country]);
  const phoneOk = useMemo(() => {
    try {
      return fullPhone !== "" && isValidPhoneNumber(fullPhone);
    } catch {
      return false;
    }
  }, [fullPhone]);

  const step1Ok = name.trim().length >= 2 && what.trim().length >= 3 && phoneOk;
  const priceNum = Math.round(Number(price.replace(/\s/g, "")) || 0);
  const step3Ok = images.length > 0 && priceNum > 0;

  useEffect(() => {
    return () => images.forEach((i) => URL.revokeObjectURL(i.preview));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = useCallback((list: FileList | File[]) => {
    const files = Array.from(list).filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type));
    setImages((prev) => {
      const room = MAX_IMAGES - prev.length;
      const picked = files.slice(0, Math.max(room, 0)).map((file) => ({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        preview: URL.createObjectURL(file),
      }));
      return [...prev, ...picked];
    });
  }, []);

  const removeImage = (id: string) =>
    setImages((prev) => {
      const gone = prev.find((i) => i.id === id);
      if (gone) URL.revokeObjectURL(gone.preview);
      return prev.filter((i) => i.id !== id);
    });

  const tick = (label: string) => setProgress((p) => (p.includes(label) ? p : [...p, label]));

  const generate = async () => {
    setError("");
    setPhase("working");
    setProgress([]);
    let slug = "";
    try {
      // 1. Boutique
      setCurrent("Création de votre boutique…");
      const createRes = await fetch("/api/stores/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          country: country.code,
          currency: country.currency,
          whatsapp: fullPhone,
          city: country.capital,
          brand: { color, style },
          slug: slugifyShopName(name).length >= 3 ? slugifyShopName(name) : `${slugifyShopName(name)}-shop`,
        }),
      });
      const created = await createRes.json().catch(() => ({}));
      if (!createRes.ok || !created?.store) {
        throw new Error(
          createRes.status === 401
            ? "Votre session a expiré. Reconnectez-vous puis recommencez."
            : created?.error || "La boutique n'a pas pu être créée."
        );
      }
      slug = created.store.slug as string;
      tick("Boutique créée");

      // 2. Photos
      setCurrent("Envoi de vos photos…");
      const urls: string[] = [];
      for (const img of images) {
        const small = await compressImage(img.file, 1600, 0.85);
        const url = await uploadImageFile(slug, small, name.trim());
        if (url) urls.push(url);
      }
      tick(urls.length > 0 ? "Photos enregistrées" : "Photos non envoyées");

      // 3. Textes
      setCurrent("Rédaction de vos textes…");
      let content = {
        tagline: "",
        shopDescription: "",
        productTitle: what.trim(),
        shortDescription: "",
        bullets: [] as string[],
        aiUsed: false,
      };
      try {
        const thumb = await compressImage(images[0].file, 768, 0.7);
        const imageBase64 = await fileToBase64(thumb);
        const gen = await fetch("/api/stores/generate-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), what: what.trim(), city: country.capital, imageBase64 }),
        });
        const g = await gen.json().catch(() => ({}));
        if (g?.content) content = g.content;
      } catch {
        /* texte par défaut ci-dessous */
      }
      tick("Textes rédigés");

      // 4. Produit publié sur la vitrine
      setCurrent("Publication de votre produit…");
      const now = new Date().toISOString();
      const title = (content.productTitle || what.trim()).slice(0, 90);
      const productSlug = slugifyShopName(title) || "produit";
      const description =
        `<p>${escapeHtml(content.shortDescription || "")}</p>` +
        (content.bullets.length ? `<ul>${content.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>` : "");
      const product = {
        id: `prod_${Date.now()}`,
        storeSlug: slug,
        name: title,
        title,
        slug: productSlug,
        description,
        category: "",
        collection: "",
        images: urls,
        mediaItems: urls.map((u, i) => ({ id: `m_${i}`, type: "image", url: u, altText: title, position: i })),
        salePrice: priceNum,
        price: priceNum,
        costPrice: 0,
        marginAmount: priceNum,
        marginPercent: 100,
        trackQuantity: false,
        trackStock: false,
        stock: 0,
        availableStock: 0,
        continueSellingWhenOutOfStock: true,
        isPhysical: true,
        status: "active",
        productStatus: "active",
        hiddenFromCatalog: false,
        published_to_storefront: true,
        variants: [],
        quantityOffers: [],
        showQuantityOffers: false,
        publishedChannels: ["Vitrine de la boutique"],
        seo: { title, description: content.shortDescription || "", slug: productSlug },
        createdAt: now,
        updatedAt: now,
      } as unknown as Product;

      saveShopProductsList(slug, [product, ...getShopProductsRaw(slug)]);
      let published = false;
      try {
        const sync = await fetch("/api/products/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeSlug: slug, products: [product] }),
        });
        const s = await sync.json().catch(() => ({}));
        published = sync.ok && s?.success && !(s.report?.error_count > 0);
      } catch {
        published = false;
      }
      tick(published ? "Produit publié" : "Produit enregistré (publication à relancer depuis Produits)");

      // 5. Identité de la boutique
      await fetch("/api/stores/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, brand: { color, style, tagline: content.tagline, description: content.shopDescription, whatsapp: fullPhone } }),
      }).catch(() => undefined);

      // 6. Liste locale des boutiques (menu de l'admin)
      try {
        const email = localStorage.getItem("novika_user_email") || "";
        const key = `novika_user_stores_${email}`;
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        const list = Array.isArray(existing) ? existing : [];
        const entry = {
          id: created.store.id,
          name: name.trim(),
          slug,
          country: country.code,
          countryName: country.name,
          flag: country.flag,
          currency: country.currency,
          whatsappNumber: fullPhone,
          role: "owner",
          status: "active",
        };
        localStorage.setItem(key, JSON.stringify([...list.filter((s: { slug?: string }) => s.slug !== slug), entry]));
      } catch {
        /* sans effet */
      }

      setResult({ slug, aiUsed: content.aiUsed, imagesOk: urls.length });
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      setPhase("form");
      if (slug) setStep(3);
    }
  };

  const brandText = readableTextOn(color);
  const inputCls =
    "w-full h-12 px-4 rounded-xl border border-black/10 bg-white text-base text-[#111111] placeholder:text-[#9A9A94] focus:outline-none focus:ring-2 focus:ring-offset-0";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F5FF] to-[#FAF8F5] px-4 py-10 flex flex-col items-center">
      <div className="text-center mb-6">
        <div className="text-2xl font-black tracking-tight" style={{ color }}>
          Novika
        </div>
        <div className="text-xs text-[#7A7A7A] mt-0.5">Créez votre boutique en 3 étapes</div>
      </div>

      <div className="w-full max-w-[460px] rounded-[28px] bg-white shadow-[0_20px_60px_-20px_rgba(20,20,60,0.25)] p-6 sm:p-8">
        {phase === "working" && (
          <div className="py-8 text-center" aria-live="polite">
            <div className="mx-auto mb-5 w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `${color}18` }}>
              <Zap className="w-7 h-7 animate-pulse" style={{ color }} />
            </div>
            <h2 className="text-xl font-extrabold text-[#111111]">Création de votre boutique</h2>
            <p className="text-sm text-[#666660] mt-1 mb-5">{current}</p>
            <ul className="text-left text-sm space-y-2 max-w-[300px] mx-auto">
              {progress.map((p) => (
                <li key={p} className="flex items-center gap-2 text-[#111111]">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  {p}
                </li>
              ))}
              <li className="flex items-center gap-2 text-[#9A9A94]">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                {current}
              </li>
            </ul>
            <p className="text-xs text-[#9A9A94] mt-6">Cela prend généralement 10 à 30 secondes.</p>
          </div>
        )}

        {phase === "done" && result && (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-extrabold text-[#111111]">Votre boutique est prête</h2>
            <p className="text-sm text-[#666660] mt-1">
              {name.trim()} est en ligne avec son premier produit. Vos clients peuvent déjà commander et payer à la livraison.
            </p>
            <div className="mt-5 rounded-2xl border border-black/[0.08] bg-[#FAF8F5] p-4 text-left text-xs text-[#555550] space-y-1.5">
              <p>
                {result.aiUsed
                  ? "Les textes ont été rédigés par l'IA à partir de votre photo : relisez-les."
                  : "Les textes sont une base simple. Complétez-les depuis la fiche produit."}
              </p>
              {result.imagesOk < images.length && <p className="text-amber-700">Certaines photos n'ont pas pu être envoyées : ajoutez-les depuis la fiche produit.</p>}
              <p>Prix de revient et stock ne sont pas renseignés : ajoutez-les pour suivre votre bénéfice.</p>
            </div>
            <div className="mt-6 space-y-2.5">
              <Link
                href={`/boutique/${result.slug}`}
                target="_blank"
                className="flex items-center justify-center h-12 rounded-xl font-bold text-sm"
                style={{ background: color, color: brandText }}
              >
                Voir ma boutique
              </Link>
              <button
                type="button"
                onClick={() => router.push(`/app/${result.slug}/produits`)}
                className="w-full h-12 rounded-xl border border-black/10 bg-white font-bold text-sm text-[#111111] cursor-pointer"
              >
                Ouvrir mon espace
              </button>
            </div>
          </div>
        )}

        {phase === "form" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1.5" aria-hidden>
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    className={cn("h-1.5 rounded-full transition-all", n === step ? "w-6" : "w-1.5")}
                    style={{ background: n <= step ? color : "#E5E7EB" }}
                  />
                ))}
              </div>
              <span className="text-xs text-[#7A7A7A]">Étape {step} sur 3</span>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#111111]">Votre boutique</h1>
                  <p className="text-sm text-[#666660] mt-1">Parlez-nous de ce que vous vendez</p>
                </div>

                <div>
                  <label htmlFor="sw-name" className="block text-sm font-semibold text-[#111111] mb-1.5">
                    Nom de la boutique <span className="text-rose-500">*</span>
                  </label>
                  <input id="sw-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex. Faras Bags" maxLength={40} className={inputCls} style={{ ["--tw-ring-color" as string]: color }} />
                </div>

                <div>
                  <label htmlFor="sw-what" className="block text-sm font-semibold text-[#111111] mb-1.5">
                    Que vendez-vous ? <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="sw-what"
                    value={what}
                    onChange={(e) => setWhat(e.target.value)}
                    placeholder="ex. Sacs à main en cuir pour femmes"
                    rows={3}
                    maxLength={200}
                    className={cn(inputCls, "h-auto py-3 resize-none")}
                    style={{ ["--tw-ring-color" as string]: color }}
                  />
                </div>

                <div>
                  <span className="block text-sm font-semibold text-[#111111] mb-1.5">Pays de vente</span>
                  <div className="grid grid-cols-2 gap-2">
                    {WIZARD_COUNTRIES.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setCountryCode(c.code)}
                        className={cn(
                          "h-11 px-3 rounded-xl border-2 text-sm text-left flex items-center gap-2 cursor-pointer transition-colors",
                          c.code === countryCode ? "bg-opacity-10" : "border-black/[0.08] bg-white hover:bg-[#FAF8F5]"
                        )}
                        style={c.code === countryCode ? { borderColor: color, background: `${color}12` } : undefined}
                      >
                        <span>{c.flag}</span>
                        <span className="truncate">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="sw-wa" className="block text-sm font-semibold text-[#111111] mb-1.5">
                    Votre numéro WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex">
                    <span className="h-12 px-3 inline-flex items-center rounded-l-xl border border-r-0 border-black/10 bg-[#F4F4F0] text-sm font-mono text-[#555550]">
                      {country.dial}
                    </span>
                    <input
                      id="sw-wa"
                      type="tel"
                      inputMode="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="90 12 34 56"
                      className={cn(inputCls, "rounded-l-none font-mono")}
                      style={{ ["--tw-ring-color" as string]: color }}
                    />
                  </div>
                  <p className={cn("text-xs mt-1.5", whatsapp && !phoneOk ? "text-rose-600" : "text-[#7A7A7A]")}>
                    {whatsapp && !phoneOk ? "Numéro invalide pour ce pays." : "Les clients vous écriront et vous recevrez les alertes de commande sur ce numéro."}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!step1Ok}
                  onClick={() => setStep(2)}
                  className="w-full h-12 rounded-xl font-bold text-sm transition-opacity disabled:bg-[#E5E7EB] disabled:text-[#9A9A94] cursor-pointer disabled:cursor-not-allowed"
                  style={step1Ok ? { background: color, color: brandText } : undefined}
                >
                  Continuer →
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#111111]">Votre style</h1>
                  <p className="text-sm text-[#666660] mt-1">Choisissez une couleur et un style de design</p>
                </div>

                <div>
                  <span className="block text-sm font-semibold text-[#111111] mb-2">Couleur principale</span>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {WIZARD_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Couleur ${c}`}
                        onClick={() => setColor(c)}
                        className="w-9 h-9 rounded-full cursor-pointer transition-transform hover:scale-105"
                        style={{
                          background: c,
                          boxShadow: color.toLowerCase() === c.toLowerCase() ? `0 0 0 3px #fff, 0 0 0 5px ${c}` : undefined,
                        }}
                      />
                    ))}
                    <label className="w-9 h-9 rounded-full border-2 border-dashed border-black/20 flex items-center justify-center cursor-pointer overflow-hidden relative" title="Couleur personnalisée">
                      <span className="text-[10px] font-bold text-[#7A7A7A]">+</span>
                      <input type="color" value={color} onChange={(e) => setColor(e.target.value.toUpperCase())} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </label>
                  </div>
                </div>

                <div>
                  <span className="block text-sm font-semibold text-[#111111] mb-2">Style prédéfini</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {WIZARD_STYLES.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setStyle(s.key)}
                        className="p-3 rounded-2xl border-2 text-left cursor-pointer transition-colors bg-white hover:bg-[#FAF8F5]"
                        style={s.key === style ? { borderColor: color, background: `${color}10` } : { borderColor: "rgba(0,0,0,0.08)" }}
                      >
                        <div className={cn("text-sm text-[#111111]", s.titleClass)}>Titre</div>
                        <div className="my-1.5 inline-block px-2.5 py-1 text-[10px] font-bold" style={{ background: color, color: brandText, borderRadius: s.radius }}>
                          Bouton
                        </div>
                        <div className="text-xs font-bold text-[#111111]">{s.label}</div>
                        <div className="text-[10px] text-[#7A7A7A]">{s.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/[0.08] p-4 bg-[#FAF8F5]">
                  <div className="text-[10px] uppercase tracking-wider text-[#9A9A94] mb-1.5">Aperçu</div>
                  <div className={cn("text-lg text-[#111111]", styleDef.titleClass)}>{name.trim() || "Ma boutique"}</div>
                  <div className="text-xs text-[#666660] mb-3">{what.trim() || "Mes produits"}</div>
                  <span className="inline-block px-4 py-2 text-xs font-bold" style={{ background: color, color: brandText, borderRadius: styleDef.radius }}>
                    Commander maintenant
                  </span>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl border border-black/10 bg-white font-bold text-sm text-[#111111] cursor-pointer">
                    ← Retour
                  </button>
                  <button type="button" onClick={() => setStep(3)} className="flex-1 h-12 rounded-xl font-bold text-sm cursor-pointer" style={{ background: color, color: brandText }}>
                    Continuer →
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#111111]">Votre produit</h1>
                  <p className="text-sm text-[#666660] mt-1">Ajoutez des photos et le prix : l'IA rédige le titre et la description</p>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    addFiles(e.dataTransfer.files);
                  }}
                  onClick={() => images.length < MAX_IMAGES && fileInput.current?.click()}
                  className="rounded-2xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors"
                  style={{ borderColor: dragOver ? color : "rgba(0,0,0,0.15)", background: dragOver ? `${color}0D` : "transparent" }}
                >
                  <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
                  {images.length === 0 ? (
                    <div className="py-6">
                      <div className="mx-auto mb-3 w-11 h-11 rounded-full bg-[#F4F4F0] flex items-center justify-center">
                        <ImagePlus className="w-5 h-5 text-[#7A7A7A]" />
                      </div>
                      <p className="text-sm font-semibold text-[#111111]">Déposez des images ici ou touchez pour parcourir</p>
                      <p className="text-xs text-[#9A9A94] mt-1">Jusqu'à {MAX_IMAGES} images · JPG, PNG, WebP</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2.5 justify-center">
                      {images.map((img, i) => (
                        <div key={img.id} className="relative w-[72px] h-[72px] rounded-xl overflow-hidden border border-black/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.preview} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            aria-label="Retirer la photo"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(img.id);
                            }}
                            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {i === 0 && <span className="absolute bottom-0 inset-x-0 text-[9px] text-center bg-black/60 text-white">Principale</span>}
                        </div>
                      ))}
                      {images.length < MAX_IMAGES && (
                        <div className="w-[72px] h-[72px] rounded-xl border-2 border-dashed border-black/15 flex items-center justify-center text-[#7A7A7A]">
                          <ImagePlus className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {images.length > 0 && <p className="text-xs text-center" style={{ color }}>{images.length} image{images.length > 1 ? "s" : ""} prête{images.length > 1 ? "s" : ""}</p>}

                <div>
                  <label htmlFor="sw-price" className="block text-sm font-semibold text-[#111111] mb-1.5">
                    Prix de vente (FCFA) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="sw-price"
                    inputMode="numeric"
                    value={price}
                    onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="ex. 12500"
                    className={cn(inputCls, "font-mono")}
                    style={{ ["--tw-ring-color" as string]: color }}
                  />
                  <p className="text-xs text-[#7A7A7A] mt-1.5">Le prix est toujours celui que vous fixez : l'IA n'en invente jamais.</p>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="flex-1 h-12 rounded-xl border border-black/10 bg-white font-bold text-sm text-[#111111] cursor-pointer">
                    ← Retour
                  </button>
                  <button
                    type="button"
                    disabled={!step3Ok}
                    onClick={generate}
                    className="flex-[1.4] h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:bg-[#E5E7EB] disabled:text-[#9A9A94] cursor-pointer disabled:cursor-not-allowed"
                    style={step3Ok ? { background: color, color: brandText } : undefined}
                  >
                    <Sparkles className="w-4 h-4" />
                    Générer ma boutique
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
