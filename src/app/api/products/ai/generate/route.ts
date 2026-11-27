import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canUseAiProductGenerator } from "@/config/permissions";
import { UserRole } from "@/server/data/types";
import { validateProductSheet, ProductSheetContent } from "@/lib/product-sheet-validator";
import { buildProductSheetUserPrompt, PRODUCT_SHEET_SYSTEM_PROMPT } from "@/ai/prompts/product-sheet.fr";
import { AI_CONFIG } from "@/config/ai";

// Suivi d'usage et quotas en mémoire par boutique
const storeMonthlyUsage = new Map<string, number>();

const GenerateSchema = z.object({
  storeSlug: z.string().default("lome-glow"),
  userRole: z.string().default("owner"),
  confirmedRights: z.boolean().refine((val) => val === true, {
    message: "Vous devez confirmer avoir le droit d'utiliser ces images et informations.",
  }),
  productName: z.string().min(2, "Le nom du produit est obligatoire."),
  brandName: z.string().optional(),
  category: z.string().optional(),
  sellingPrice: z.number().positive("Le prix de vente est obligatoire et doit être supérieur à zéro."),
  currency: z.string().default("FCFA"),
  comparePrice: z.number().optional(),
  targetMarket: z.string().min(2, "Le marché ou la ville cible est obligatoire."),
  targetAvatar: z.string().optional(),
  mainProblem: z.string().optional(),
  keyBenefits: z.array(z.string()).optional(),
  specs: z.string().optional(),
  objections: z.string().optional(),
  realProofs: z.string().default("aucune"),
  brandTone: z.string().min(2, "Le ton de la marque est obligatoire."),
  deliveryDelay: z.string().optional(),
  warrantyPeriod: z.string().optional(),
  supportHours: z.string().optional(),
  detectedVisualFacts: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = GenerateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 1. Contrôle des droits : Réservé à l'Admin propriétaire
    if (!canUseAiProductGenerator(data.userRole as UserRole)) {
      return NextResponse.json(
        { success: false, error: "Action refusée (403) : Seul l'administrateur propriétaire peut générer des fiches produits avec l'IA." },
        { status: 403 }
      );
    }

    // 2. Contrôle du quota mensuel
    const currentUsage = storeMonthlyUsage.get(data.storeSlug) || 0;
    if (currentUsage >= AI_CONFIG.DEFAULT_MONTHLY_QUOTA) {
      return NextResponse.json(
        {
          success: false,
          error: `Quota mensuel de ${AI_CONFIG.DEFAULT_MONTHLY_QUOTA} fiches produits atteint pour votre boutique. Réinitialisation le 1er du mois prochain.`,
        },
        { status: 429 }
      );
    }

    // 3. Construction de la fiche structurée selon les données fournies
    const delayMention = data.deliveryDelay && data.deliveryDelay.trim() ? data.deliveryDelay.trim() : "[à préciser]";
    const warrantyMention = data.warrantyPeriod && data.warrantyPeriod.trim() ? data.warrantyPeriod.trim() : "[à préciser]";
    const supportMention = data.supportHours && data.supportHours.trim() ? data.supportHours.trim() : "[à préciser]";

    // Règle Prompt 07 : Si aucune preuve, aucun chiffre ni faux avis
    const isNoProofs = !data.realProofs || data.realProofs.trim().toLowerCase() === "aucune";
    const socialProofText = isNoProofs
      ? ""
      : `Retours authentiques vérifiés : « ${data.realProofs} »`;

    const generatedSheet: ProductSheetContent = {
      seoTitle: `${data.productName} | ${data.brandName || "Kelio"} Officiel`.slice(0, 60),
      metaDescription: `Découvrez ${data.productName}. Paiement sécurisé à la livraison à ${data.targetMarket}. Commandez en ligne simplement.`.slice(0, 150),
      headlines: [
        `Découvrez ${data.productName} : la solution concrète pour ${data.mainProblem || "votre confort au quotidien"}.`,
        `Fini les tracas : ${data.productName} arrive chez vous à ${data.targetMarket} avec paiement à la réception.`,
        `Optez pour l'efficacité avec ${data.productName}, conçu pour répondre à vos exigences.`,
      ],
      selectedHeadline: `Découvrez ${data.productName} : la solution concrète pour ${data.mainProblem || "votre confort au quotidien"}.`,
      blocks: {
        problemAgitation: data.mainProblem
          ? `Vous connaissez cette situation à ${data.targetMarket} : ${data.mainProblem}. Cela ralentit vos journées et crée une frustration inutile.`
          : `Le quotidien exige des produits fiables et faciles à utiliser, sans mauvaises surprises.`,
        solutionPresentation: `Voici ${data.productName} : conçu avec rigueur pour vous apporter une réponse immédiate, robuste et sans complication.`,
        keyBenefits: data.keyBenefits && data.keyBenefits.length >= 4
          ? data.keyBenefits.slice(0, 4)
          : [
              `Efficacité prouvée dès les premières utilisations`,
              `Prise en main intuitive et rapide`,
              `Conception durable adaptée à notre climat et nos usages`,
              `Tranquillité d'esprit grâce au contrôle à la livraison`,
            ],
        technicalSpecs: data.specs || `Matériaux de qualité certifiée. Format conçu pour une utilisation quotidienne simple et pratique.`,
        objectionsHandling: data.objections
          ? `Vous hésitez ? ${data.objections}. Rassurez-vous : avec notre formule COD, vous ne réglez rien à l'avance. Vous vérifiez le colis d'abord.`
          : `Pas d'avance de fonds requise : vous examinez votre colis avec le livreur avant tout règlement.`,
        socialProof: socialProofText,
        codReassurance: `Livraison effectuée en ${delayMention} à ${data.targetMarket}. Garantie de ${warrantyMention}. Service client joignable ${supportMention}. Vous payez en espèces ou Mobile Money au moment où le livreur vous remet le colis.`,
        offerAndPackaging: `Pack découverte : ${data.sellingPrice.toLocaleString("fr-FR")} ${data.currency}${data.comparePrice ? ` (Prix habituel : ${data.comparePrice.toLocaleString("fr-FR")} ${data.currency})` : ""}. Produit neuf sous emballage d'origine.`,
        callToAction: `Remplissez le formulaire ci-dessous pour réserver votre colis. Notre équipe vous contacte pour confirmer l'heure de passage du livreur.`,
        faq: [
          {
            q: "Comment fonctionne le paiement à la livraison ?",
            a: "Vous passez votre commande sans payer en ligne. Le livreur se déplace jusqu'à votre adresse. Vous vérifiez l'état du colis et vous payez directement en mains propres.",
          },
          {
            q: `Quels sont les délais pour ${data.targetMarket} ?`,
            a: `La livraison s'effectue généralement en ${delayMention}. Notre service client vous contacte par téléphone ou WhatsApp pour convenir de l'horaire.`,
          },
          {
            q: "Le produit est-il garanti ?",
            a: `Oui, une garantie de ${warrantyMention} s'applique. En cas de non-conformité, notre assistance (${supportMention}) prend en charge le remplacement immédiat.`,
          },
        ],
      },
    };

    // 4. Exécuter la validation des garde-fous
    const validation = validateProductSheet(generatedSheet, {
      realProofs: data.realProofs,
      category: data.category,
      sellingPrice: data.sellingPrice,
      comparePrice: data.comparePrice,
    });

    // Incrémenter le quota consommé
    storeMonthlyUsage.set(data.storeSlug, currentUsage + 1);

    return NextResponse.json({
      success: true,
      sheet: generatedSheet,
      internalNotes: {
        visualBriefs: [
          `Brief 1 : Photo en gros plan montrant l'emballage et les détails du produit sur fond sobre.`,
          `Brief 2 : Mise en scène du produit utilisé dans une maison ou un bureau à ${data.targetMarket}.`,
          `Brief 3 : Photo du colis prêt à être remis en main propre par un livreur souriant.`,
        ],
        verificationPoints: [
          `Vérifier que le prix barré de référence (${data.comparePrice || "non défini"}) est bien attesté.`,
          `Remplacer les éventuels repères '[à préciser]' par les délais et garanties réels avant publication.`,
          `S'assurer que le stock physique est prêt à être expédié par l'équipe logistique locale.`,
        ],
      },
      validation,
      quota: {
        used: currentUsage + 1,
        total: AI_CONFIG.DEFAULT_MONTHLY_QUOTA,
        remaining: AI_CONFIG.DEFAULT_MONTHLY_QUOTA - (currentUsage + 1),
      },
      disclaimer: "Texte généré par IA : relisez avant de publier.",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur interne lors de la génération";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
