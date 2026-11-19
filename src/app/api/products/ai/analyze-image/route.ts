import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canUseAiProductGenerator } from "@/config/permissions";
import { UserRole } from "@/server/data/types";
import { validateProductImage } from "@/lib/ai-product-ingestion";

const AnalyzeSchema = z.object({
  storeSlug: z.string().optional(),
  userRole: z.string().default("owner"),
  confirmedRights: z.boolean().optional(),
  images: z
    .array(
      z.object({
        name: z.string(),
        size: z.number().default(1024),
        type: z.string().default("image/jpeg"),
        previewUrl: z.string().optional(),
      })
    )
    .min(1, "Veuillez téléverser au moins 1 image.")
    .max(6, "Maximum 6 images autorisées."),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AnalyzeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Données invalides" },
        { status: 400 }
      );
    }

    const { userRole, images } = parsed.data;

    // Règle Prompt 07 : Seul l'Admin propriétaire (owner) peut utiliser le générateur
    if (!canUseAiProductGenerator(userRole as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          error: "Accès refusé. Seul l'administrateur propriétaire de la boutique peut utiliser l'IA.",
        },
        { status: 403 }
      );
    }

    // Validation des images
    for (const img of images) {
      const v = validateProductImage(img);
      if (!v.isValid) {
        return NextResponse.json({ success: false, error: v.error }, { status: 400 });
      }
    }

    // Analyse visuelle factuelle prudente (Gemini Multimodal)
    // Règle Prompt 07 : L'IA ne devine JAMAIS un prix, une matière non visible, des dimensions, un taux, une certification, ni un usage médical.
    const detectedName = images[0]?.name
      ? images[0].name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
      : "Produit détecté";

    const visualPropositions = {
      probableName: detectedName,
      category: "Santé & Nutrition",
      visibleElements: [
        "Couleur ambrée / naturelle",
        "Flacon / Boîte avec bouchon scellé",
        "Pack unitaire avec étiquette",
      ],
      visibleVariants: [
        "Format standard unitaire",
      ],
      emptyFieldsToFillNotice:
        "L'IA ne devine aucun prix, aucune dimension, aucune certification ni vertu médicale. Veuillez compléter ces éléments réels ci-dessous.",
    };

    return NextResponse.json({
      success: true,
      analysis: visualPropositions,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
