import React from "react";
import Link from "next/link";
import { ChevronRight, ShieldAlert, CheckCircle2 } from "lucide-react";
import { resolveStorefrontData } from "@/lib/storefront-resolver";
import { CustomPageBlocks } from "@/components/storefront/custom-page-blocks";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StorefrontCustomPage({
  params,
}: {
  params: Promise<{ store: string; slug: string }>;
}) {
  const { store: storeSlug, slug } = await params;
  const store = resolveStorefrontData(storeSlug).store;

  const pagesContent: Record<string, { title: string; subtitle: string; content: string[] }> = {
    "a-propos": {
      title: "À Propos de Notre Marque",
      subtitle: "Authenticité, engagement et proximité au cœur de nos sélections.",
      content: [
        `Bienvenue chez ${store.name}. Fondée pour répondre aux besoins concrets des consommateurs et consommatrices en Afrique de l'Ouest, notre boutique s'est donné pour mission de proposer des articles certifiés, sûrs et rigoureusement testés.`,
        "Dans un contexte où les achats en ligne souffrent souvent d'un manque de confiance ou de livraisons incertaines, nous avons fait le choix exclusif du modèle de Paiement à la Livraison (Cash on Delivery). Vous commandez en un clic sans avance de frais, et vous ne payez qu'après avoir inspecté votre colis.",
        "Nos équipes de closeuses et notre flotte de livreurs partenaires garantissent un traitement humain, chaleureux et rapide de chaque commande. Merci pour votre fidélité !",
      ],
    },
    "livraison-retours": {
      title: "Politique de Livraison & Retours COD",
      subtitle: "Tout comprendre sur nos délais express et nos conditions de retour garanties.",
      content: [
        "1. Modalités de Livraison : Dès réception de votre commande, une conseillère vous contacte par appel téléphonique ou WhatsApp pour confirmer vos coordonnées et convenir d'un créneau de passage.",
        "2. Délais d'acheminement : À Lomé, Abidjan, Dakar et Cotonou, les commandes passées avant 14h sont livrées le jour même ou sous 24h ouvrées. En région ou périphérie, le délai varie entre 24h et 48h.",
        "3. Paiement en espèces : Le règlement s'effectue exclusivement en liquide directement auprès de notre livreur. Vous êtes invité(e) à ouvrir le colis devant lui pour contrôler la conformité de l'article avant de lui remettre les fonds.",
        "4. Retours et Échanges : Si le produit présente un défaut de fabrication ou ne correspond pas à vos attentes, vous disposez d'un délai de 7 jours francs pour demander un échange ou un remboursement. Contactez immédiatement notre support WhatsApp pour déclencher la procédure.",
      ],
    },
    cgv: {
      title: "Conditions Générales de Vente (CGV)",
      subtitle: "Cadre légal régissant les commandes sur notre boutique en ligne.",
      content: [
        `Article 1 - Objet : Les présentes conditions générales de vente régissent l'ensemble des transactions conclues entre la boutique ${store.name} et ses clients par l'intermédiaire de sa vitrine en ligne.`,
        "Article 2 - Commande : La passation de commande s'effectue sans paiement préalable par carte bancaire. La commande devient ferme après confirmation téléphonique ou électronique par notre service de closing.",
        "Article 3 - Prix et Monnaie : Tous les prix affichés sur notre site sont libellés en Francs CFA (XOF / XAF) toutes taxes comprises, hors éventuels frais de livraison express clairement indiqués lors de la commande.",
        "Article 4 - Droit de Rétractation : Conformément aux usages du commerce, le client a le droit de refuser le colis au moment de la livraison si celui-ci s'avère non conforme ou endommagé.",
        "Avertissement de non-conseil juridique : Ces modèles sont fournis à titre d'information indicative pour le commerce électronique COD et ne remplacent pas une consultation auprès d'un conseil juridique qualifié.",
      ],
    },
    confidentialite: {
      title: "Politique de Confidentialité",
      subtitle: "Protection stricte de vos données personnelles et numéros de téléphone.",
      content: [
        `Chez ${store.name}, la confidentialité de vos informations est notre priorité absolue. Nous collectons uniquement les données strictement nécessaires au traitement de vos commandes et à la livraison de vos colis.`,
        "Données collectées : Nom, prénom, numéro de téléphone WhatsApp, ville et adresse de livraison.",
        "Utilisation des données : Vos informations sont uniquement transmises à notre service client et au livreur assigné à votre commande. Elles ne sont jamais revendues, échangées ou cédées à des tiers publicitaires.",
        "Outils publicitaires et de mesure Meta (Facebook & Instagram) : Avec votre consentement explicite via notre bandeau de cookies (catégorie Marketing), nous utilisons le Pixel Meta et l'API de conversions (CAPI) pour mesurer l'efficacité de nos campagnes et optimiser nos annonces pour le paiement à la livraison. Vos coordonnées personnelles ne sont jamais transmises en clair à Meta : seules des empreintes cryptographiques normalisées en SHA-256 peuvent être communiquées pour la correspondance d'audience. Vous pouvez retirer votre consentement à tout moment via les préférences de cookies du site.",
        "Sécurité et Conservation : Les données sont chiffrées au repos et en transit. Vous pouvez demander à tout moment la modification ou la suppression définitive de vos coordonnées en écrivant à notre service client.",
      ],
    },
  };

  // Page créée par le vendeur dans « Boutique en ligne > Pages » (prioritaire sur les textes types)
  let custom: { title: string; content: string; sections?: unknown[] } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await (supabase as any).rpc("shop_page_public", { p_slug: storeSlug, p_page_slug: slug });
    if (data && typeof data.title === "string") custom = data;
  } catch {
    custom = null;
  }

  const pageData = custom
    ? {
        title: custom.title,
        subtitle: "",
        content: (custom.content || "").split(/\n{2,}|\r\n\r\n/).map((x) => x.trim()).filter(Boolean),
      }
    : pagesContent[slug] || pagesContent["a-propos"];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Fil d'Ariane */}
      <div className="flex items-center gap-2 text-xs text-[#666660]">
        <Link href={`/boutique/${storeSlug}`} className="hover:text-[#111111]">
          Accueil
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-bold text-[#111111]">{pageData.title}</span>
      </div>

      <div className="border-b border-black/[0.08] pb-6 space-y-2">
        <h1 className="text-2xl sm:text-4xl font-black text-[#111111] tracking-tight">
          {pageData.title}
        </h1>
        {pageData.subtitle && <p className="text-xs sm:text-sm text-[#666660]">{pageData.subtitle}</p>}
      </div>

      <div className="rounded-3xl bg-white border border-black/10 p-6 sm:p-10 shadow-2xs space-y-6 text-xs sm:text-sm text-[#444440] leading-relaxed">
        {custom && Array.isArray(custom.sections) && custom.sections.length > 0 ? (
          <CustomPageBlocks blocks={custom.sections} storeSlug={storeSlug} />
        ) : custom ? (
          <>
            <CustomPageBlocks blocks={[]} storeSlug={storeSlug} />
            {pageData.content.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </>
        ) : (
          pageData.content.map((p, idx) => <p key={idx}>{p}</p>)
        )}

        {!custom && slug === "cgv" && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 mt-6">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              Ce document est un modèle d'exemple fourni par AfriBuilder pour vos ventes COD. Il ne constitue pas un conseil juridique formel.
            </span>
          </div>
        )}
      </div>

      <div className="pt-4">
        <Link
          href={`/boutique/${storeSlug}/catalogue`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all shadow-sm"
        >
          <span>Découvrir nos produits en vente</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
