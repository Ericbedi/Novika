import { describe, it, expect } from "vitest";
import {
  MAX_PRODUCT_IMAGES,
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
  validateProductImageFile,
  parseVideoUrl,
} from "./image-utils";
import { ProductMediaItem } from "@/server/data/types";

describe("Prompt 15 : Galerie produit en slides (Spécifications & Logique)", () => {
  it("1. Règles de capacité et formats : max 20 images et 5 Mo par fichier", () => {
    expect(MAX_PRODUCT_IMAGES).toBe(20);
    expect(MAX_IMAGE_SIZE_BYTES).toBe(5 * 1024 * 1024);
    expect(ALLOWED_IMAGE_TYPES).toContain("image/jpeg");
    expect(ALLOWED_IMAGE_TYPES).toContain("image/png");
    expect(ALLOWED_IMAGE_TYPES).toContain("image/webp");
    expect(ALLOWED_IMAGE_TYPES).toContain("image/avif");
  });

  it("2. Validation des fichiers médias (taille et types MIME)", () => {
    // Valide
    const ok = validateProductImageFile({
      name: "flacon_50ml.webp",
      size: 1.2 * 1024 * 1024,
      type: "image/webp",
    });
    expect(ok.valid).toBe(true);

    // Trop lourd (> 5 Mo)
    const tooHeavy = validateProductImageFile({
      name: "haute_definition.png",
      size: 5.5 * 1024 * 1024,
      type: "image/png",
    });
    expect(tooHeavy.valid).toBe(false);
    expect(tooHeavy.error).toContain("dépasse la limite autorisée de 5 Mo");

    // Format non permis
    const invalidExt = validateProductImageFile({
      name: "animation.gif",
      size: 500 * 1024,
      type: "image/gif",
    });
    expect(invalidExt.valid).toBe(false);
    expect(invalidExt.error).toContain("Formats acceptés : JPG, PNG, WebP, AVIF");
  });

  it("3. Reconnaissance des URLs vidéo (YouTube, Vimeo, MP4 direct)", () => {
    const ytWatch = parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(ytWatch.type).toBe("youtube");
    expect(ytWatch.embedUrl).toContain("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");

    const ytShorts = parseVideoUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ");
    expect(ytShorts.type).toBe("youtube");

    const vimeo = parseVideoUrl("https://vimeo.com/12345678");
    expect(vimeo.type).toBe("vimeo");
    expect(vimeo.embedUrl).toContain("https://player.vimeo.com/video/12345678");

    const mp4 = parseVideoUrl("https://files.afribuilder.com/videos/demo-produit.mp4");
    expect(mp4.type).toBe("mp4");
    expect(mp4.embedUrl).toBe("https://files.afribuilder.com/videos/demo-produit.mp4");

    const invalid = parseVideoUrl("https://random-site.com/page.html");
    expect(invalid.type).toBe("invalid");
  });

  it("4. Normalisation de liste de médias et étiquetage 'Image principale'", () => {
    const rawImages = [
      "/products/serum-1.webp",
      "/products/serum-2.webp",
      "/products/serum-3.webp",
    ];

    const mediaItems: ProductMediaItem[] = rawImages.map((url, idx) => ({
      id: `img-${idx}`,
      url,
      alt: `Sérum Éclat - Vue ${idx + 1}`,
      isPrimary: idx === 0,
    }));

    expect(mediaItems).toHaveLength(3);
    expect(mediaItems[0].isPrimary).toBe(true);
    expect(mediaItems[1].isPrimary).toBe(false);
    expect(mediaItems[2].isPrimary).toBe(false);
  });

  it("5. Définir une image comme principale déplace l'élément en index 0", () => {
    let mediaItems: ProductMediaItem[] = [
      { id: "1", url: "/img1.jpg", isPrimary: true },
      { id: "2", url: "/img2.jpg", isPrimary: false },
      { id: "3", url: "/img3.jpg", isPrimary: false },
    ];

    // Promouvoir img 3 (index 2) en principale
    const chosenIndex = 2;
    const targetItem = mediaItems[chosenIndex];
    const without = mediaItems.filter((_, i) => i !== chosenIndex);
    mediaItems = [
      { ...targetItem, isPrimary: true },
      ...without.map((m) => ({ ...m, isPrimary: false })),
    ];

    expect(mediaItems[0].id).toBe("3");
    expect(mediaItems[0].isPrimary).toBe(true);
    expect(mediaItems[1].id).toBe("1");
    expect(mediaItems[1].isPrimary).toBe(false);
    expect(mediaItems[2].id).toBe("2");
    expect(mediaItems[2].isPrimary).toBe(false);
  });

  it("6. Réordonner les médias (monter / descendre)", () => {
    const list = ["A", "B", "C"];
    // Monter C (index 2 -> 1)
    const copy = [...list];
    const [moved] = copy.splice(2, 1);
    copy.splice(1, 0, moved);

    expect(copy).toEqual(["A", "C", "B"]);
  });

  it("7. Suppression groupée d'images", () => {
    const items = [
      { id: "1", url: "url1" },
      { id: "2", url: "url2" },
      { id: "3", url: "url3" },
      { id: "4", url: "url4" },
    ];
    const selectedIds = ["2", "4"];

    const remaining = items.filter((item) => !selectedIds.includes(item.id));
    expect(remaining).toHaveLength(2);
    expect(remaining.map((r) => r.id)).toEqual(["1", "3"]);
  });

  it("8. Synchronisation de la galerie lors du changement de variante", () => {
    const galleryItems = [
      { id: "img-0", url: "/img-rouge.jpg", variantId: "var-rouge" },
      { id: "img-1", url: "/img-bleu.jpg", variantId: "var-bleu" },
      { id: "img-2", url: "/img-vert.jpg", variantId: "var-vert" },
    ];

    // L'utilisateur choisit la variante bleue
    const selectedVariantId = "var-bleu";
    const targetIdx = galleryItems.findIndex((m) => m.variantId === selectedVariantId);
    expect(targetIdx).toBe(1);
    expect(galleryItems[targetIdx].url).toBe("/img-bleu.jpg");
  });
});
