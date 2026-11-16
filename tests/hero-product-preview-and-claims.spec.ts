import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { landingContent } from "../content/landing.fr";
import { FORBIDDEN_COPY_TERMS, CLAIMS_REGISTRY, validateCopySafety } from "../content/claims";

test.describe("Prompt 05-L : Hero de la page d'accueil Novika (Visuel produit + Textes vérifiables)", () => {
  // =========================================================================
  // 1. TESTS DE SÉCURITÉ RÉDACTIONNELLE (claims.ts et landing.fr.ts)
  // =========================================================================

  test("C1. Aucun terme interdit ('garanti', 'zéro perte', '100%') dans claims.ts et landing.fr.ts", () => {
    const claimsPath = path.resolve(__dirname, "../content/claims.ts");
    const landingPath = path.resolve(__dirname, "../content/landing.fr.ts");

    const claimsContent = fs.readFileSync(claimsPath, "utf8");
    const landingContentRaw = fs.readFileSync(landingPath, "utf8");

    // Les termes sur-promettants stricts imposés par Prompt 05-L
    const forbiddenPhrases = [
      "garanti",
      "zéro perte",
      "zero perte",
      "100 %",
      "100%",
    ];

    // Dans landing.fr.ts : AUCUNE occurrence autorisée
    const lowerLanding = landingContentRaw.toLowerCase();
    for (const phrase of forbiddenPhrases) {
      const regex = new RegExp(`\\b${phrase.replace("%", "\\%")}\\b`, "i");
      const found = regex.test(lowerLanding) || lowerLanding.includes(phrase);
      expect(found, `Terme interdit "${phrase}" trouvé dans landing.fr.ts`).toBe(false);
    }

    // Vérifie les déclarations autorisées dans claims.ts
    expect(CLAIMS_REGISTRY.cod_payment_rule.statement).toBe("Le client paie à la livraison");
    expect(CLAIMS_REGISTRY.no_blocked_orders.statement).toBe("Aucune commande bloquée · Fiche closeuse");
    expect(CLAIMS_REGISTRY.free_delivery_zones.statement).toBe("Livraison gratuite automatique par zone");
  });

  test("C2. Les pastilles du Hero sont alimentées par landingContent.hero.pills sans écriture en dur", () => {
    expect(landingContent.hero.pills).toBeDefined();
    expect(landingContent.hero.pills.length).toBe(3);

    const pillTexts = landingContent.hero.pills.map((p) => p.text);
    expect(pillTexts).toContain("Le client paie à la livraison");
    expect(pillTexts).toContain("Livraison gratuite automatique par zone");
    expect(pillTexts).toContain("Aucune commande bloquée · Fiche closeuse");

    // Vérifie que les anciennes formulations ne sont plus présentes
    expect(pillTexts).not.toContain("Paiement à la livraison garanti");
    expect(pillTexts).not.toContain("Zéro perte de commande · Fiche closeuse");
  });

  // =========================================================================
  // 2. TESTS INTERFACE HERO BUREAU (≥ 1024px) : 2 COLONNES ET VISUEL PRODUIT
  // =========================================================================

  test("H1. Bureau : 2 colonnes, texte à gauche, visuel produit HeroProductPreview à droite", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("http://localhost:3000/");

    // Badge
    const badge = page.locator("text=Conçu exclusivement pour le commerce en Afrique");
    await expect(badge).toBeVisible();

    // Titre et sous-titre
    const title = page.locator("h1:has-text('Vendez en paiement à la livraison')");
    await expect(title).toBeVisible();

    // 3 Pastilles de réassurance avec textes vérifiables
    await expect(page.locator("text=Le client paie à la livraison")).toBeVisible();
    await expect(page.locator("text=Livraison gratuite automatique par zone")).toBeVisible();
    await expect(page.locator("text=Aucune commande bloquée · Fiche closeuse")).toBeVisible();

    // Boutons d'action Hero sur une seule ligne
    const ctaPrimary = page.locator("#hero-cta-btn");
    const ctaSecondary = page.locator("#hero-see-how-it-works-btn");
    await expect(ctaPrimary).toBeVisible();
    await expect(ctaSecondary).toBeVisible();

    // Mention d'accès gratuit visible sous les boutons
    await expect(
      page.locator("text=Accès gratuit sur invitation pendant la phase bêta privée")
    ).toBeVisible();

    // Visuel HeroProductPreview
    const visual = page.locator("[aria-hidden='true']:has-text('app.novika.africa/lome-lux')");
    await expect(visual).toBeVisible();

    // Éléments du tableau de bord Novika dans le visuel
    await expect(page.locator("text=Nouvelle commande reçue").first()).toBeVisible();
    await expect(page.locator("text=Objectif de CA encaissé").first()).toBeVisible();
    await expect(page.locator("text=4 250 000 / 6 000 000 FCFA")).toBeVisible();

    // Les 4 familles de statuts dans les commandes récentes
    await expect(page.locator("text=En route").first()).toBeVisible();
    await expect(page.locator("text=Livrée").first()).toBeVisible();
    await expect(page.locator("text=Confirmée").first()).toBeVisible();

    // Cadre téléphone superposé avec la frise de suivi client (Prompt 05-T)
    await expect(page.locator("text=Suivi colis")).toBeVisible();
    await expect(page.locator("text=Reçue & validée")).toBeVisible();
    await expect(page.locator("text=En route (Livreur assigné)")).toBeVisible();

    // Mention discrète obligatoire : Aperçu — données d'exemple
    await expect(page.locator("text=Aperçu — données d'exemple")).toBeVisible();
  });

  // =========================================================================
  // 3. TESTS MOBILE (< 768px) : AUCUN DÉBORDEMENT HORIZONTAL
  // =========================================================================

  test("H2. Mobile : Une colonne, aucun défilement horizontal, texte lisible et boutons visibles", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("http://localhost:3000/");

    // Vérifie que les boutons et pastilles sont lisibles
    await expect(page.locator("text=Le client paie à la livraison")).toBeVisible();
    await expect(page.locator("text=Aucune commande bloquée · Fiche closeuse")).toBeVisible();
    await expect(page.locator("#hero-cta-btn")).toBeVisible();

    // Aucun débordement horizontal (scrollWidth <= clientWidth)
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });
});
