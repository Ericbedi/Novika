import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canUseAiProductGenerator } from "@/config/permissions";
import { UserRole } from "@/server/data/types";

const RegenerateBlockSchema = z.object({
  userRole: z.string().default("owner"),
  blockKey: z.string(),
  currentContent: z.string(),
  instruction: z.string().optional(),
  productName: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegenerateBlockSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Données invalides" },
        { status: 400 }
      );
    }

    const { userRole, blockKey, currentContent, instruction, productName } = parsed.data;

    if (!canUseAiProductGenerator(userRole as UserRole)) {
      return NextResponse.json(
        { success: false, error: "Action refusée (403). Réservé à l'administrateur propriétaire." },
        { status: 403 }
      );
    }

    let updatedContent = currentContent;
    const lowerInst = (instruction || "").toLowerCase();

    if (lowerInst.includes("court") || lowerInst.includes("bref")) {
      updatedContent = `Version synthétique de ${productName} : direct, percutant et sans superflu.`;
    } else if (lowerInst.includes("chaleureux") || lowerInst.includes("émotion")) {
      updatedContent = `Prenez soin de vous au quotidien avec ${productName}. Une solution douce et pensée pour votre bien-être.`;
    } else {
      updatedContent = `${currentContent} — Optimisé pour maximiser la clarté et la confiance du client COD.`;
    }

    return NextResponse.json({
      success: true,
      blockKey,
      newContent: updatedContent,
      notice: "Bloc régénéré avec succès. Relisez et modifiez librement.",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
