import { describe, it, expect } from "vitest";
import {
  validateProductImageFile,
  parseVideoUrl,
  MAX_PRODUCT_IMAGES,
  MAX_IMAGE_SIZE_BYTES,
} from "./image-utils";

describe("image-utils (Prompt 15)", () => {
  it("valide les constantes de configuration", () => {
    expect(MAX_PRODUCT_IMAGES).toBe(20);
    expect(MAX_IMAGE_SIZE_BYTES).toBe(5 * 1024 * 1024);
  });

  it("accepte les images valides (JPG, PNG, WebP, AVIF) sous 5 Mo", () => {
    const validJpg = { name: "photo.jpg", size: 2 * 1024 * 1024, type: "image/jpeg" };
    const validPng = { name: "banner.png", size: 4.5 * 1024 * 1024, type: "image/png" };
    const validWebp = { name: "produit.webp", size: 800 * 1024, type: "image/webp" };
    const validAvif = { name: "produit.avif", size: 500 * 1024, type: "image/avif" };

    expect(validateProductImageFile(validJpg).valid).toBe(true);
    expect(validateProductImageFile(validPng).valid).toBe(true);
    expect(validateProductImageFile(validWebp).valid).toBe(true);
    expect(validateProductImageFile(validAvif).valid).toBe(true);
  });

  it("rejette les images dépassant 5 Mo avec un message d'erreur clair", () => {
    const oversizedFile = {
      name: "lourde_photo.jpg",
      size: 6.2 * 1024 * 1024,
      type: "image/jpeg",
    };
    const res = validateProductImageFile(oversizedFile);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("dépasse la limite autorisée de 5 Mo");
    expect(res.error).toContain("6.2 Mo");
  });

  it("rejette les formats non autorisés (PDF, GIF, SVG, EXE)", () => {
    const pdf = { name: "document.pdf", size: 1024 * 1024, type: "application/pdf" };
    const exe = { name: "virus.exe", size: 500, type: "application/octet-stream" };

    expect(validateProductImageFile(pdf).valid).toBe(false);
    expect(validateProductImageFile(pdf).error).toContain("Formats acceptés : JPG, PNG, WebP, AVIF");
    expect(validateProductImageFile(exe).valid).toBe(false);
  });

  it("analyse correctement les URLs YouTube", () => {
    const standard = parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(standard.type).toBe("youtube");
    expect(standard.embedUrl).toContain("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");

    const shortUrl = parseVideoUrl("https://youtu.be/dQw4w9WgXcQ");
    expect(shortUrl.type).toBe("youtube");
    expect(shortUrl.embedUrl).toContain("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");

    const shorts = parseVideoUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ");
    expect(shorts.type).toBe("youtube");
    expect(shorts.embedUrl).toContain("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });

  it("analyse correctement les URLs Vimeo", () => {
    const vimeo = parseVideoUrl("https://vimeo.com/76979871");
    expect(vimeo.type).toBe("vimeo");
    expect(vimeo.embedUrl).toContain("https://player.vimeo.com/video/76979871");
  });

  it("analyse correctement les fichiers MP4 directs", () => {
    const mp4 = parseVideoUrl("https://cdn.example.com/demo.mp4");
    expect(mp4.type).toBe("mp4");
    expect(mp4.embedUrl).toBe("https://cdn.example.com/demo.mp4");
  });

  it("gère les URLs invalides sans planter", () => {
    expect(parseVideoUrl("").type).toBe("invalid");
    expect(parseVideoUrl("not a url").type).toBe("invalid");
    expect(parseVideoUrl("https://example.com/not-video").type).toBe("invalid");
  });
});
