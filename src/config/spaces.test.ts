import { describe, it, expect } from "vitest";
import {
  getDefaultSpaceForRole,
  isPathAllowedForRole,
  sanitizeInternalRedirect,
} from "./spaces";

describe("Configuration des espaces et validation anti-redirection (Prompt 06-L)", () => {
  describe("getDefaultSpaceForRole", () => {
    it("renvoie l'espace vendeur complet pour le rôle owner", () => {
      expect(getDefaultSpaceForRole("owner", "cotonou-tech")).toBe("/app/cotonou-tech");
    });

    it("renvoie l'espace closing (commandes) pour le rôle closer", () => {
      expect(getDefaultSpaceForRole("closer", "abidjan-prestige")).toBe(
        "/app/abidjan-prestige/commandes"
      );
    });

    it("renvoie l'espace tournée/livraison pour le rôle rider", () => {
      expect(getDefaultSpaceForRole("rider", "lome-glow")).toBe("/app/lome-glow/tournee");
    });

    it("renvoie l'espace agence avec filtre dédié pour le rôle agency", () => {
      expect(getDefaultSpaceForRole("agency", "dakar-vital")).toBe(
        "/app/dakar-vital/commandes?view=agency"
      );
    });

    it("renvoie l'espace plateforme pour le rôle control", () => {
      expect(getDefaultSpaceForRole("control")).toBe("/platform-admin");
    });
  });

  describe("isPathAllowedForRole", () => {
    it("autorise owner sur toutes les sections /app", () => {
      expect(isPathAllowedForRole("/app/lome-glow/finances", "owner")).toBe(true);
      expect(isPathAllowedForRole("/app/lome-glow/reglages", "owner")).toBe(true);
      expect(isPathAllowedForRole("/app/lome-glow/produits", "owner")).toBe(true);
    });

    it("bloque closer sur les finances, réglages et sourcing", () => {
      expect(isPathAllowedForRole("/app/lome-glow/finances", "closer")).toBe(false);
      expect(isPathAllowedForRole("/app/lome-glow/reglages", "closer")).toBe(false);
      expect(isPathAllowedForRole("/app/lome-glow/sourcing", "closer")).toBe(false);
      expect(isPathAllowedForRole("/app/lome-glow/commandes", "closer")).toBe(true);
      expect(isPathAllowedForRole("/app/lome-glow/clients", "closer")).toBe(true);
    });

    it("bloque rider sur finances, produits et réglages", () => {
      expect(isPathAllowedForRole("/app/lome-glow/finances", "rider")).toBe(false);
      expect(isPathAllowedForRole("/app/lome-glow/produits", "rider")).toBe(false);
      expect(isPathAllowedForRole("/app/lome-glow/tournee", "rider")).toBe(true);
      expect(isPathAllowedForRole("/app/lome-glow/livraisons", "rider")).toBe(true);
    });
  });

  describe("sanitizeInternalRedirect (Sécurité Open Redirect)", () => {
    const defaultOwnerSpace = "/app/lome-glow";
    const defaultRiderSpace = "/app/lome-glow/tournee";

    it("accepte les chemins internes valides pour le rôle", () => {
      expect(sanitizeInternalRedirect("/app/lome-glow/commandes", "owner")).toBe(
        "/app/lome-glow/commandes"
      );
      expect(sanitizeInternalRedirect("/app/lome-glow/tournee", "rider")).toBe(
        "/app/lome-glow/tournee"
      );
    });

    it("rejette les URLs absolues HTTP et HTTPS externes", () => {
      expect(sanitizeInternalRedirect("https://site-malveillant.com", "owner")).toBe(
        defaultOwnerSpace
      );
      expect(sanitizeInternalRedirect("http://evil.com/phishing", "owner")).toBe(
        defaultOwnerSpace
      );
    });

    it("rejette les redirections relatives au protocole (//)", () => {
      expect(sanitizeInternalRedirect("//site-malveillant.com", "owner")).toBe(
        defaultOwnerSpace
      );
      expect(sanitizeInternalRedirect("//evil.com/app/lome-glow", "owner")).toBe(
        defaultOwnerSpace
      );
    });

    it("rejette les barres obliques inversées et doubles barres obliques (/\\, \\\\)", () => {
      expect(sanitizeInternalRedirect("/\\site-externe.com", "owner")).toBe(
        defaultOwnerSpace
      );
      expect(sanitizeInternalRedirect("\\\\evil.com", "owner")).toBe(defaultOwnerSpace);
    });

    it("rejette les schémas javascript: et data:", () => {
      expect(sanitizeInternalRedirect("javascript:alert(1)", "owner")).toBe(
        defaultOwnerSpace
      );
      expect(sanitizeInternalRedirect("/javascript:alert(1)", "owner")).toBe(
        defaultOwnerSpace
      );
      expect(sanitizeInternalRedirect("data:text/html,malicious", "owner")).toBe(
        defaultOwnerSpace
      );
    });

    it("redirige vers l'espace par défaut si le chemin interne n'est pas autorisé pour le rôle", () => {
      // Un livreur ne peut pas accéder aux finances privées
      expect(sanitizeInternalRedirect("/app/lome-glow/finances", "rider")).toBe(
        defaultRiderSpace
      );
      // Une closeuse ne peut pas accéder aux réglages
      expect(sanitizeInternalRedirect("/app/lome-glow/reglages", "closer")).toBe(
        "/app/lome-glow/commandes"
      );
    });

    it("utilise l'espace par défaut quand aucun redirect n'est fourni", () => {
      expect(sanitizeInternalRedirect(null, "owner")).toBe(defaultOwnerSpace);
      expect(sanitizeInternalRedirect("", "owner")).toBe(defaultOwnerSpace);
    });
  });
});
