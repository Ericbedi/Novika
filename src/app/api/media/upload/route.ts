import { NextRequest, NextResponse } from "next/server";
import {
  detectImageMagicBytes,
  saveShopMediaItem,
  MAX_MEDIA_FILE_SIZE_BYTES,
  MAX_GIF_FILE_SIZE_BYTES,
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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Vérification du vrai type binaire (Magic bytes) & Refus du SVG
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

    // 2. Vérification de la taille (8 Mo max pour les GIFs animés, 5 Mo pour les autres images)
    const isGif = magicCheck.mimeType === "image/gif";
    const maxSizeBytes = isGif ? MAX_GIF_FILE_SIZE_BYTES : MAX_MEDIA_FILE_SIZE_BYTES;

    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        {
          error: isGif
            ? "L'animation GIF dépasse la taille maximale autorisée de 8 Mo."
            : "Le fichier dépasse la taille maximale autorisée de 5 Mo.",
          code: "FILE_TOO_LARGE",
        },
        { status: 413 }
      );
    }

    // 3. Génération d'un nom de fichier avec préservation stricte de l'extension .gif (Prompt 17-J)
    const mediaId = `med_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const extension = isGif ? "gif" : magicCheck.mimeType === "image/png" ? "png" : magicCheck.mimeType === "image/jpeg" ? "jpg" : "webp";
    const fileName = `${mediaId}.${extension}`;
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
      message: isGif ? "Animation GIF téléversée avec succès (animation préservée)." : "Image téléversée avec succès.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur lors du téléversement";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
