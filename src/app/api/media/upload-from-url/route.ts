import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { NextRequest, NextResponse } from "next/server";
import {
  validateSafePublicImageUrl,
  detectImageMagicBytes,
  saveShopMediaItem,
  MAX_MEDIA_FILE_SIZE_BYTES,
  MAX_GIF_FILE_SIZE_BYTES,
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
      headers: { "User-Agent": "Kelio-MediaDownloader/1.0" },
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

    // 3. Vérification Magic Bytes
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

    // 4. Vérification de la taille (8 Mo max pour GIF, 5 Mo max pour les autres)
    const isGif = magicCheck.mimeType === "image/gif";
    const maxSizeBytes = isGif ? MAX_GIF_FILE_SIZE_BYTES : MAX_MEDIA_FILE_SIZE_BYTES;

    if (buffer.length > maxSizeBytes) {
      return NextResponse.json(
        {
          error: isGif
            ? "L'animation GIF distante dépasse la limite maximale autorisée de 8 Mo."
            : "L'image distante dépasse la limite maximale autorisée de 5 Mo.",
          code: "FILE_TOO_LARGE",
        },
        { status: 413 }
      );
    }

    // 5. Copie dans notre stockage interne avec conservation de l'extension .gif
    const mediaId = `med_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const extension = isGif ? "gif" : magicCheck.mimeType === "image/png" ? "png" : magicCheck.mimeType === "image/jpeg" ? "jpg" : "webp";
    const fileName = `${mediaId}.${extension}`;
    const safeSlug = String(storeSlug).replace(/[^a-z0-9-]/gi, "").slice(0, 60) || "boutique";
    const { url: sbUrl, anonKey } = getSupabaseEnv();
    const sb = createClient(sbUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const objectPath = `${safeSlug}/${fileName}`;
    const { error: uploadError } = await sb.storage
      .from("product-media")
      .upload(objectPath, buffer, { contentType: magicCheck.mimeType, upsert: false, cacheControl: "31536000" });
    if (uploadError) {
      return NextResponse.json({ error: "Échec de l'enregistrement de l'image. Réessayez." }, { status: 502 });
    }
    const storageUrl = sb.storage.from("product-media").getPublicUrl(objectPath).data.publicUrl;

    const mediaItem: StoredMediaItem = {
      id: mediaId,
      storeSlug,
      url: storageUrl,
      originalName: url.split("/").pop() || (isGif ? "animation.gif" : "image-importee.webp"),
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
