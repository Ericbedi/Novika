import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { ROUTES, STATIC_PAGES_TO_VERIFY } from "./routes";

describe("Vérification stricte de ROUTES (Prompt 06-L & Résolution du bug de déconnexion)", () => {
  it("ROUTES.login pointe impérativement vers la vraie page de connexion (/connexion)", () => {
    expect(ROUTES.login).toBe("/connexion");
  });

  it("Chaque constante statique de STATIC_PAGES_TO_VERIFY correspond à une page ou route existante sur le disque", () => {
    const appDir = path.resolve(process.cwd(), "src/app");

    for (const routePath of STATIC_PAGES_TO_VERIFY) {
      if (routePath === "/") {
        const rootPage = path.join(appDir, "page.tsx");
        expect(fs.existsSync(rootPage), `La page racine ${rootPage} doit exister`).toBe(true);
        continue;
      }

      // Convertir un chemin URL en chemin dossier (ex: "/auth/creer-mot-de-passe" -> "auth/creer-mot-de-passe")
      const relativeDirPath = routePath.replace(/^\//, "");
      const targetDir = path.join(appDir, relativeDirPath);
      const targetPageTsx = path.join(targetDir, "page.tsx");
      const targetRouteTs = path.join(targetDir, "route.ts");

      const pageOrRouteExists = fs.existsSync(targetPageTsx) || fs.existsSync(targetRouteTs);
      expect(
        pageOrRouteExists,
        `La route ${routePath} déclarée dans ROUTES doit correspondre à ${targetPageTsx} ou ${targetRouteTs}`
      ).toBe(true);
    }
  });

  it("Les générateurs dynamiques d'URL produisent des chemins cohérents", () => {
    expect(ROUTES.dashboard("lome-glow")).toBe("/app/lome-glow");
    expect(ROUTES.orders("lome-glow")).toBe("/app/lome-glow/commandes");
    expect(ROUTES.followups("lome-glow")).toBe("/app/lome-glow/commandes/relances");
    expect(ROUTES.products("lome-glow")).toBe("/app/lome-glow/produits");
    expect(ROUTES.storefront("lome-glow")).toBe("/boutique/lome-glow");
    expect(ROUTES.tracking("CMD-10482")).toBe("/suivi/CMD-10482");
  });
});
