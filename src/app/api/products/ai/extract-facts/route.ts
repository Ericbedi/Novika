import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canUseAiProductGenerator } from "@/config/permissions";
import { UserRole } from "@/server/data/types";
import { extractFactsFromProductUrl } from "@/lib/ai-product-ingestion";

const ExtractSchema = z.object({
  userRole: z.string().default("owner"),
  url: z.string().url("URL de page produit invalide"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ExtractSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "URL invalide" },
        { status: 400 }
      );
    }

    const { userRole, url } = parsed.data;

    if (!canUseAiProductGenerator(userRole as UserRole)) {
      return NextResponse.json(
        { success: false, error: "Accès refusé. Réservé à l'administrateur propriétaire." },
        { status: 403 }
      );
    }

    const result = await extractFactsFromProductUrl(url);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      facts: result.facts,
      notice: "Seuls les faits techniques ont été extraits. Aucun texte ni visuel d'un autre site n'a été recopié.",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
