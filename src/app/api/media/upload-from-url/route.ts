import { NextRequest, NextResponse } from "next/server";
import {
  validateSafePublicImageUrl,
  detectImageMagicBytes,
  saveShopMediaItem,
  MAX_MEDIA_FILE_SIZE_BYTES,
  StoredMediaItem,
} from "@/lib/media-storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, storeSlug = "lome-glow", altText = "", contextType = "product" } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "L'URL de l'image est obligatoire." }, { status: 400 });
    }

    // 1. Protection SSRF stricte
    const safety = validateSafePublicImageUrl(url);
    if (!safety.safe) {
      return NextResponse.json(
        {
          error: safety.error || "URL rejetée pour raisons de sécurité (SSRF).",
          code: "SSRF_BLOCKED",
        },
        { status: 400 }
      );
    }

    // 2. Téléchargement côté serveur avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url.trim(), {
      signal: controller.signal,
      headers: { "User-Agent": "Novika-MediaDownloader/1.0" },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Impossible de récupérer l'image distante (HTTP ${res.status}).` },
        { status: 502 }
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Vérification de la taille (Max 5 Mo)
    if (buffer.length > MAX_MEDIA_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: "L'image distante dépasse la limite maximale autorisée de 5 Mo.",
          code: "FILE_TOO_LARGE",
        },
        { status: 413 }
      );
    }

    // 4. Vérification Magic Bytes
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

    // 5. Copie dans notre stockage interne
    const mediaId = `med_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const fileName = `${mediaId}.webp`;
    const storageUrl = `/storage/shops/${storeSlug}/media/${fileName}`;

    const mediaItem: StoredMediaItem = {
      id: mediaId,
      storeSlug,
      url: storageUrl,
      originalName: url.split("/").pop() || "image-importee.webp",
      mimeType: magicCheck.mimeType,
      sizeBytes: buffer.length,
      altText: altText.trim() || "Image importée",
      usageCount: 1,
      usedIn: [{ type: contextType as any, id: `ctx_${Date.now()}`, title: "Lien importé" }],
      createdAt: new Date().toISOString(),
    };

    saveShopMediaItem(mediaItem);

    return NextResponse.json({
      success: true,
      url: storageUrl,
      mediaItem,
      message: "Image distante importée et copiée dans votre stockage sécurisé.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur lors du téléchargement de l'image distante";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
