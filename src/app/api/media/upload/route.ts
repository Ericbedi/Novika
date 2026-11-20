import { NextRequest, NextResponse } from "next/server";
import {
  detectImageMagicBytes,
  saveShopMediaItem,
  MAX_MEDIA_FILE_SIZE_BYTES,
  StoredMediaItem,
} from "@/lib/media-storage";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const storeSlug = (formData.get("storeSlug") as string) || "lome-glow";
    const altText = (formData.get("altText") as string) || "";
    const contextType = (formData.get("contextType") as string) || "product";

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }

    // 1. Vérification de la taille (Max 5 Mo)
    if (file.size > MAX_MEDIA_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: "Le fichier dépasse la taille maximale autorisée de 5 Mo.",
          code: "FILE_TOO_LARGE",
        },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Vérification du vrai type binaire (Magic bytes) & Refus du SVG
    const magicCheck = detectImageMagicBytes(buffer);
    if (!magicCheck.valid || !magicCheck.mimeType) {
      return NextResponse.json(
        {
          error: magicCheck.error || "Type de fichier non autorisé. Seuls les formats JPEG, PNG, WebP et GIF sont acceptés.",
          code: "INVALID_FILE_TYPE",
        },
        { status: 415 }
      );
    }

    // 3. Génération d'un nom de fichier aléatoire sécurisé
    const mediaId = `med_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const fileName = `${mediaId}.webp`;
    const storageUrl = `/storage/shops/${storeSlug}/media/${fileName}`;

    const mediaItem: StoredMediaItem = {
      id: mediaId,
      storeSlug,
      url: storageUrl,
      originalName: file.name,
      mimeType: magicCheck.mimeType,
      sizeBytes: file.size,
      altText: altText.trim() || file.name.split(".")[0],
      usageCount: 1,
      usedIn: [{ type: contextType as any, id: `ctx_${Date.now()}`, title: file.name }],
      createdAt: new Date().toISOString(),
    };

    saveShopMediaItem(mediaItem);

    return NextResponse.json({
      success: true,
      url: storageUrl,
      mediaItem,
      message: "Image téléversée avec succès.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur lors du téléversement";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
