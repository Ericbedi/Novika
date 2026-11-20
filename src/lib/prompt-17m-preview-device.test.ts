import { describe, it, expect, beforeEach } from "vitest";
import {
  PREVIEW_DEVICES,
  PREVIEW_DEVICE_LIST,
  DEFAULT_PREVIEW_DEVICE,
  PREVIEW_DEVICE_STORAGE_KEY,
  PREVIEW_ORIENTATION_STORAGE_KEY,
  getStoredPreviewDevice,
  setStoredPreviewDevice,
  getStoredPreviewOrientation,
  setStoredPreviewOrientation,
  clearStoredPreviewSettings,
  getEffectiveDimensions,
  PreviewDeviceId,
} from "@/lib/preview-device";

describe("Prompt 17-M : Aperçu mobile iPhone 15 Pro Max par défaut & sélecteur d'appareil", () => {
  beforeEach(() => {
    clearStoredPreviewSettings();
  });

  describe("1. Configuration des appareils & iPhone 15 Pro Max par défaut", () => {
    it("définit l'iPhone 15 Pro Max comme appareil par défaut", () => {
      expect(DEFAULT_PREVIEW_DEVICE).toBe("iphone-15-pro-max");
    });

    it("contient exactement les 5 appareils requis avec leurs dimensions officielles", () => {
      expect(PREVIEW_DEVICE_LIST).toHaveLength(5);

      // iPhone 15 Pro Max : 430 × 932 px
      const ip15 = PREVIEW_DEVICES["iphone-15-pro-max"];
      expect(ip15.width).toBe(430);
      expect(ip15.height).toBe(932);
      expect(ip15.frameType).toBe("dynamic-island");
      expect(ip15.safeAreaTop).toBe(59);
      expect(ip15.safeAreaBottom).toBe(34);

      // iPhone 13 : 390 × 844 px
      const ip13 = PREVIEW_DEVICES["iphone-13"];
      expect(ip13.width).toBe(390);
      expect(ip13.height).toBe(844);
      expect(ip13.frameType).toBe("notch");
      expect(ip13.safeAreaTop).toBe(47);
      expect(ip13.safeAreaBottom).toBe(34);

      // Android petit écran : 360 × 800 px
      const android = PREVIEW_DEVICES["android-small"];
      expect(android.width).toBe(360);
      expect(android.height).toBe(800);
      expect(android.frameType).toBe("punch-hole");

      // Tablette : 768 × 1024 px
      const tablet = PREVIEW_DEVICES["tablet"];
      expect(tablet.width).toBe(768);
      expect(tablet.height).toBe(1024);

      // Ordinateur : 1280 × 800 px
      const desktop = PREVIEW_DEVICES["desktop"];
      expect(desktop.width).toBe(1280);
      expect(desktop.height).toBe(800);
      expect(desktop.type).toBe("desktop");
    });
  });

  describe("2. Mémorisation par utilisateur (localStorage)", () => {
    it("retourne iPhone 15 Pro Max lorsque le stockage est vide", () => {
      expect(getStoredPreviewDevice()).toBe("iphone-15-pro-max");
    });

    it("mémorise l'appareil sélectionné et le restaure à la réouverture", () => {
      setStoredPreviewDevice("iphone-13");
      expect(getStoredPreviewDevice()).toBe("iphone-13");

      setStoredPreviewDevice("android-small");
      expect(getStoredPreviewDevice()).toBe("android-small");
    });

    it("se replie sur iPhone 15 Pro Max si une valeur inconnue est stockée", () => {
      setStoredPreviewDevice("appareil-invalide-xyz" as any);
      expect(getStoredPreviewDevice()).toBe("iphone-15-pro-max");
    });

    it("mémorise et restaure l'orientation (portrait / paysage)", () => {
      expect(getStoredPreviewOrientation()).toBe("portrait");
      setStoredPreviewOrientation("landscape");
      expect(getStoredPreviewOrientation()).toBe("landscape");
      setStoredPreviewOrientation("portrait");
      expect(getStoredPreviewOrientation()).toBe("portrait");
    });
  });

  describe("3. Calcul des dimensions effectives et bascule d'orientation", () => {
    it("inverse la largeur et la hauteur en mode paysage pour les mobiles", () => {
      const ip15 = PREVIEW_DEVICES["iphone-15-pro-max"];
      const portraitDims = getEffectiveDimensions(ip15, "portrait");
      expect(portraitDims.width).toBe(430);
      expect(portraitDims.height).toBe(932);
      expect(portraitDims.isRotated).toBe(false);

      const landscapeDims = getEffectiveDimensions(ip15, "landscape");
      expect(landscapeDims.width).toBe(932);
      expect(landscapeDims.height).toBe(430);
      expect(landscapeDims.isRotated).toBe(true);
    });

    it("ne permute pas les dimensions de l'ordinateur en mode paysage", () => {
      const desktop = PREVIEW_DEVICES["desktop"];
      const dims = getEffectiveDimensions(desktop, "landscape");
      expect(dims.width).toBe(1280);
      expect(dims.height).toBe(800);
      expect(dims.isRotated).toBe(false);
    });
  });

  describe("4. Couverture des 3 largeurs cibles pour la vitrine COD (360, 390, 430 px)", () => {
    it("fournit les 3 largeurs clés pour les tests de non-défilement horizontal", () => {
      const targetWidths = [
        PREVIEW_DEVICES["android-small"].width,
        PREVIEW_DEVICES["iphone-13"].width,
        PREVIEW_DEVICES["iphone-15-pro-max"].width,
      ];

      expect(targetWidths).toEqual([360, 390, 430]);
    });
  });
});
