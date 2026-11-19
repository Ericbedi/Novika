import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  MessageCircle,
  Award,
  Star,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  ShoppingBag,
  Sparkles,
  Phone,
  Clock,
  FolderTree,
} from "lucide-react";
import { MOCK_STORES } from "@/mock-data/stores";
import { MOCK_STOREFRONT_LOME } from "@/mock-data/storefront-data";
import { MOCK_PRODUCTS } from "@/mock-data/products";
import { MOCK_BANNER_SLIDES } from "@/mock-data/banners-data";
import { formatFcfa } from "@/lib/money";
import { HeroBannerCarousel } from "@/components/storefront/hero-banner-carousel";
import { getLiveStoreOpenStatus, buildStoreWhatsAppLink } from "@/lib/storefront-security";

export default async function BoutiqueHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ store: string }>;
  searchParams: Promise<{ preview_token?: string }>;
}) {
  const { store: storeSlug } = await params;
  const { preview_token } = await searchParams;

  const store = MOCK_STORES.find((s) => s.slug === storeSlug) || MOCK_STORES[0];
  const storefront = MOCK_STOREFRONT_LOME;

  const isPreviewMode = Boolean(
    preview_token && preview_token === storefront.previewToken?.token
  );

  // Si la boutique n'est pas publiée et pas en mode preview : écran "Bientôt disponible"
  if (!storefront.isPublished && !isPreviewMode) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <div className="h-16 w-16 rounded-3xl bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
          <Sparkles className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-black text-[#111111]">
          Boutique bientôt disponible
        </h1>
        <p className="text-xs text-[#666660] leading-relaxed">
          {store.name} prépare actuellement son catalogue de vente en ligne avec
          paiement à la livraison. Revenez très bientôt !
        </p>
      </div>
    );
  }

  // Filtrer les produits actifs pour la sélection vedette (exclut les produits masqués)
  const featuredProducts = MOCK_PRODUCTS.filter(
    (p) => p.productStatus === "active" && !p.hiddenFromCatalog
  ).slice(0, 4);

  // Bannières actives pour le carrousel principal
  const heroSlides = MOCK_BANNER_SLIDES.filter(
    (s) => s.placement === "hero_carousel" && s.isActive
  );

  // Collections vedettes (3 à 6 collections avec visuels)
  const featuredCollections = [
    {
      id: "col-visage",
      title: "Soins Visage Purifiants",
      description: "Sérums éclat et crèmes régénératrices",
      count: "3 articles",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600",
    },
    {
      id: "col-corps",
      title: "Beurres & Baumes Corporels",
      description: "Karité brut et huiles précieuses",
      count: "4 articles",
      image: "https://images.unsplash.com/photo-1608248597359-281b671a5c4e?q=80&w=600",
    },
    {
      id: "col-savons",
      title: "Savons Noirs Traditionnels",
      description: "Fabrication artisanale 100% végétale",
      count: "2 articles",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600",
    },
  ];

  // Calcul du statut d'ouverture en direct
  const openStatus = getLiveStoreOpenStatus(0, 8, 19);
  const whatsAppDirectLink = buildStoreWhatsAppLink(
    "+22890123456",
    `Bonjour ${store.name}, je souhaite des renseignements sur vos produits disponibles à la livraison.`
  );

  const themePrimary = storefront.activeTheme.colors.primary || "#C2410C";

  return (
    <div className="space-y-16 pb-20">
      {/* 3. SECTION CARROUSEL PRINCIPAL DE BANNIÈRES (ACCESSIBLE, ZÉRO CLS) */}
      <section className="w-full">
        {heroSlides.length > 0 ? (
          <HeroBannerCarousel
            slides={heroSlides}
            primaryColor={themePrimary}
          />
        ) : (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
            <div
              className="rounded-[36px] p-8 sm:p-14 text-white relative overflow-hidden shadow-lg"
              style={{ backgroundColor: themePrimary }}
            >
              <div className="max-w-2xl space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
                  🌿 100% Ingrédients Naturels
                </span>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                  Révélez Votre Éclat Naturel & Votre Vitalité
                </h1>
                <p className="text-sm sm:text-base text-white/90 font-medium">
                  Formules cosmétiques d'exception. Payez en espèces à la
                  livraison chez vous à Lomé et dans la sous-région.
                </p>
                <div className="pt-2">
                  <Link
                    href={`/boutique/${storeSlug}/catalogue`}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-[#111111] text-xs sm:text-sm font-black hover:bg-[#FAF8F5] transition-all shadow-md"
                  >
                    <span>Commander maintenant (Paiement Cash)</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. SECTION COLLECTIONS VEDETTES (3 à 6 collections avec visuels) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <span
              className="text-xs font-bold uppercase tracking-wider block"
              style={{ color: themePrimary }}
            >
              Parcourir nos gammes
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
              Collections Vedettes
            </h2>
          </div>
          <Link
            href={`/boutique/${storeSlug}/catalogue`}
            className="text-xs font-bold text-[#111111] hover:text-[#C2410C] transition-colors inline-flex items-center gap-1"
          >
            <span>Toutes les collections</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {featuredCollections.map((col) => (
            <Link
              key={col.id}
              href={`/boutique/${storeSlug}/catalogue?collection=${col.id}`}
              className="group relative rounded-3xl overflow-hidden border border-black/[0.08] bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-end p-6 min-h-[220px]"
            >
              <img
                src={col.image}
                alt={col.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="relative z-10 text-white space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  {col.count}
                </span>
                <h3 className="text-base font-black leading-tight drop-shadow">
                  {col.title}
                </h3>
                <p className="text-xs text-white/80 line-clamp-1">
                  {col.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. SECTION PRODUITS VEDETTES (4 à 8 produits avec prix et commande directe) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <span
              className="text-xs font-bold uppercase tracking-wider block"
              style={{ color: themePrimary }}
            >
              Nos Best-Sellers
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
              Produits Vedettes Plébiscités
            </h2>
          </div>
          <Link
            href={`/boutique/${storeSlug}/catalogue`}
            className="text-xs font-bold text-[#111111] hover:text-[#C2410C] transition-colors inline-flex items-center gap-1"
          >
            <span>Voir tout le catalogue ({MOCK_PRODUCTS.length} articles)</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {featuredProducts.map((prod) => (
            <div
              key={prod.id}
              className="group rounded-3xl border border-black/[0.08] bg-white p-3.5 sm:p-4 space-y-3 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <Link
                  href={`/boutique/${storeSlug}/produit/${prod.id}`}
                  className="relative block h-40 sm:h-48 rounded-2xl bg-[#FAF8F5] overflow-hidden border border-black/[0.04]"
                >
                  <div className="absolute inset-0 flex items-center justify-center p-3 text-center">
                    <span className="text-xs font-black text-[#111111] group-hover:scale-105 transition-transform">
                      {prod.name}
                    </span>
                  </div>
                  {prod.compareAtPrice && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black shadow-xs">
                      Promo
                    </span>
                  )}
                  {prod.lowStockThreshold !== undefined && prod.stock <= prod.lowStockThreshold && prod.stock > 0 && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black shadow-xs">
                      Stock Bas
                    </span>
                  )}
                </Link>

                <div>
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase text-[#888880] block truncate">
                    {prod.category}
                  </span>
                  <Link
                    href={`/boutique/${storeSlug}/produit/${prod.id}`}
                    className="text-xs sm:text-sm font-black text-[#111111] hover:text-[#C2410C] transition-colors line-clamp-2 mt-0.5"
                  >
                    {prod.name}
                  </Link>
                </div>

                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span
                    className="text-sm sm:text-base font-black"
                    style={{ color: themePrimary }}
                  >
                    {formatFcfa(prod.salePrice)}
                  </span>
                  {prod.compareAtPrice && (
                    <span className="text-[11px] text-[#888880] line-through font-semibold">
                      {formatFcfa(prod.compareAtPrice)}
                    </span>
                  )}
                </div>
              </div>

              <Link
                href={`/boutique/${storeSlug}/produit/${prod.id}`}
                className="w-full py-2.5 px-2 rounded-xl bg-[#111111] text-white text-[11px] sm:text-xs font-bold hover:bg-black transition-all text-center block shadow-2xs group-hover:bg-[#C2410C] cursor-pointer"
              >
                Commander (Cash)
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 6. SECTION BANDEAU D'AVANTAGES & GARANTIES (3 à 4 arguments) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-black/[0.08] shadow-2xs space-y-2 text-center sm:text-left">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto sm:mx-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-black text-[#111111]">
              Paiement à la Livraison
            </h3>
            <p className="text-[11px] text-[#666660] leading-relaxed">
              Vérifiez votre colis chez vous avant de remettre l'argent en espèces au coursier.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-black/[0.08] shadow-2xs space-y-2 text-center sm:text-left">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto sm:mx-0">
              <Truck className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-black text-[#111111]">
              Livraison 100% Gratuite · Expédition Express 24h
            </h3>
            <p className="text-[11px] text-[#666660] leading-relaxed">
              Frais de livraison offerts sur toute commande, expédition rapide partout dans les villes desservies.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-black/[0.08] shadow-2xs space-y-2 text-center sm:text-left">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-[#25D366] flex items-center justify-center mx-auto sm:mx-0">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-black text-[#111111]">
              Support WhatsApp 7j/7
            </h3>
            <p className="text-[11px] text-[#666660] leading-relaxed">
              Une conseillère dédiée disponible directement sur WhatsApp pour vous guider.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-black/[0.08] shadow-2xs space-y-2 text-center sm:text-left">
            <div className="h-10 w-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto sm:mx-0">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-black text-[#111111]">
              Garantie Authenticité
            </h3>
            <p className="text-[11px] text-[#666660] leading-relaxed">
              Produits 100% originaux certifiés. Échange gratuit garanti sous 7 jours.
            </p>
          </div>
        </div>
      </section>

      {/* 7. SECTION AVIS CLIENTS RÉELS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span
            className="text-xs font-bold uppercase tracking-wider block"
            style={{ color: themePrimary }}
          >
            Témoignages Vérifiés
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            Ce Que Disent Nos Clientes
          </h2>
          <div className="flex items-center justify-center gap-1 text-amber-500">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
            ))}
            <span className="text-xs font-black text-[#111111] ml-1.5">
              4.9 / 5 (342 avis)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {storefront.reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 rounded-3xl bg-white border border-black/[0.08] shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-amber-500 text-amber-500"
                    />
                  ))}
                </div>
                <p className="text-xs text-[#444440] leading-relaxed italic">
                  « {rev.comment} »
                </p>
              </div>

              <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between text-xs">
                <div>
                  <p className="font-black text-[#111111]">{rev.authorName}</p>
                  <p className="text-[10px] text-[#888880]">
                    {rev.authorCity}, {rev.authorCountry}
                  </p>
                </div>
                {rev.verifiedPurchase && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Achat vérifié</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. SECTION HISTOIRE DE LA MARQUE & À PROPOS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="rounded-[36px] bg-[#FAF8F5] border border-black/[0.08] p-8 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span
              className="text-xs font-bold uppercase tracking-wider block"
              style={{ color: themePrimary }}
            >
              Notre Mission
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
              Conçu pour le Quotidien et la Vitalité Africaine
            </h2>
            <p className="text-xs sm:text-sm text-[#444440] leading-relaxed">
              Nous sélectionnons uniquement des ingrédients d'une pureté absolue,
              testés pour apporter des bienfaits concrets sans aucun compromis.
              Nos coursiers locaux vous remettent vos commandes en main propre
              avec le plus grand professionnalisme.
            </p>
            <div className="pt-2 flex items-center gap-6">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-[#111111] block">
                  +12 500
                </span>
                <span className="text-[11px] text-[#666660]">
                  Colis livrés avec succès
                </span>
              </div>
              <div className="h-10 w-px bg-black/10" />
              <div>
                <span
                  className="text-2xl sm:text-3xl font-black block"
                  style={{ color: themePrimary }}
                >
                  98.4%
                </span>
                <span className="text-[11px] text-[#666660]">
                  Clientes satisfaites
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-black/[0.06] p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Engagement Qualité & Transparence</span>
            </div>
            <p className="text-xs text-[#666660] leading-relaxed">
              « Chaque commande est préparée avec soin à Lomé. Vous ne payez rien
              tant que le colis n'est pas inspecté et validé par vos soins. »
            </p>
            <span className="text-xs font-black text-[#111111] block">
              — L'équipe {store.name}
            </span>
          </div>
        </div>
      </section>

      {/* 9. SECTION FAQ (3 à 5 questions fréquentes) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-2">
          <span
            className="text-xs font-bold uppercase tracking-wider block"
            style={{ color: themePrimary }}
          >
            Questions Fréquentes
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            Tout ce que vous devez savoir sur la livraison
          </h2>
        </div>

        <div className="space-y-3">
          {storefront.sections
            .find((s) => s.id === "sec_faq")
            ?.content.questions?.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-2xs space-y-1.5"
              >
                <h3 className="text-xs sm:text-sm font-black text-[#111111] flex items-center gap-2">
                  <HelpCircle
                    className="h-4 w-4 shrink-0"
                    style={{ color: themePrimary }}
                  />
                  <span>{item.q}</span>
                </h3>
                <p className="text-xs text-[#666660] leading-relaxed pl-6">
                  {item.a}
                </p>
              </div>
            ))}
        </div>
      </section>

      {/* 10. SECTION BLOC CONTACT & WHATSAPP DIRECT AVEC STATUT EN DIRECT */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="rounded-[36px] bg-white border border-black/[0.08] p-6 sm:p-10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${openStatus.isOpen
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-black/[0.06] text-[#666660]"
                  }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${openStatus.isOpen ? "bg-emerald-600 animate-pulse" : "bg-gray-400"
                    }`}
                />
                <span>{openStatus.statusLabel}</span>
              </span>
              <span className="text-[11px] text-[#666660]">
                {openStatus.nextOpenLabel}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
              Une question avant de commander ?
            </h3>
            <p className="text-xs text-[#666660] max-w-md">
              Échangez en direct avec nos conseillères sur WhatsApp. Réponse immédiate pour vous aider à choisir la formule idéale.
            </p>
          </div>

          <a
            href={whatsAppDirectLink}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs sm:text-sm shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Discuter sur WhatsApp</span>
          </a>
        </div>
      </section>
    </div>
  );
}
