import { describe, it, expect } from "vitest";
import { validateProductSheet, ProductSheetContent } from "./product-sheet-validator";
import { isSsrfSafeUrl } from "./ai-product-ingestion";

describe("Prompt 07 : Garde-fous et Validateur de Fiche Produit IA", () => {
  const validSheet: ProductSheetContent = {
    seoTitle: "Café Bio Champignon Vitality | Énergie Matinale",
    metaDescription: "Boostez votre énergie avec le Café Bio Champignon Vitality. Livraison rapide et paiement à la livraison à Abidjan et Lomé.",
    headlines: [
      "Retrouvez une énergie durable chaque matin",
      "Le café naturel qui prend soin de votre journée",
      "Dites adieu aux coups de fatigue après le repas",
    ],
    blocks: {
      problemAgitation: "Les longues journées sous la chaleur peuvent épuiser votre concentration.",
      solutionPresentation: "Une infusion bio combinant café arabica et extraits de champignons bienfaisants.",
      keyBenefits: [
        "Énergie continue sans tremblements",
        "Digestion facile et agréable",
        "Préparation instantanée en 30 secondes",
        "Ingrédients naturels rigoureusement sélectionnés",
      ],
      technicalSpecs: "Boîte de 20 sachets de 10g. Emballage hermétique.",
      objectionsHandling: "Vous pouvez vérifier le colis avec le livreur avant de régler.",
      socialProof: "",
      codReassurance: "Livraison sous 24h à 48h. Paiement en espèces ou Mobile Money à la réception.",
      offerAndPackaging: "24 900 FCFA pour le pack duo.",
      callToAction: "Commandez votre pack aujourd'hui.",
    },
  };

  describe("Garde-fou 1 : Chiffres inventés (preuves = aucune)", () => {
    it("refuse tout pourcentage ou volume fictif si preuves réelles est 'aucune'", () => {
      const sheetWithFakeNumbers: ProductSheetContent = {
        ...validSheet,
        blocks: {
          ...validSheet.blocks,
          socialProof: "Déjà plus de 15 000 clients satisfaits avec 98% de résultats positifs !",
        },
      };

      const result = validateProductSheet(sheetWithFakeNumbers, {
        realProofs: "aucune",
        sellingPrice: 24900,
        comparePrice: 35000,
      });

      expect(result.canPublish).toBe(false);
      expect(result.issues.some((i) => i.code === "invented_metrics")).toBe(true);
    });

    it("accepte la fiche si aucune statistique inventée n'est présente", () => {
      const result = validateProductSheet(validSheet, {
        realProofs: "aucune",
        sellingPrice: 24900,
        comparePrice: 35000,
      });

      expect(result.issues.some((i) => i.code === "invented_metrics")).toBe(false);
    });
  });

  describe("Garde-fou 2 : Allégations de santé interdites", () => {
    it("détecte et bloque les promesses médicales de guérison ou maladie", () => {
      const sheetWithHealthClaim: ProductSheetContent = {
        ...validSheet,
        blocks: {
          ...validSheet.blocks,
          solutionPresentation: "Ce produit permet de guérir définitivement la maladie et l'hypertension.",
        },
      };

      const result = validateProductSheet(sheetWithHealthClaim, {
        category: "Santé & Nutrition",
        sellingPrice: 24900,
        comparePrice: 35000,
      });

      expect(result.canPublish).toBe(false);
      expect(result.issues.some((i) => i.code === "health_claims")).toBe(true);
    });
  });

  describe("Garde-fou 3 : Espaces réservés [à préciser]", () => {
    it("bloque la publication tant qu'il subsiste une mention '[à préciser]'", () => {
      const sheetWithPlaceholder: ProductSheetContent = {
        ...validSheet,
        blocks: {
          ...validSheet.blocks,
          codReassurance: "Livraison assurée sous [à préciser] jours avec garantie de [à préciser].",
        },
      };

      const result = validateProductSheet(sheetWithPlaceholder, {
        sellingPrice: 24900,
        comparePrice: 35000,
      });

      expect(result.canPublish).toBe(false);
      expect(result.issues.some((i) => i.code === "missing_reassurance")).toBe(true);
    });
  });

  describe("Garde-fou 4 : Prix barré de référence", () => {
    it("bloque la publication si le prix barré est inférieur ou égal au prix de vente", () => {
      const result = validateProductSheet(validSheet, {
        sellingPrice: 25000,
        comparePrice: 20000, // Invalide : inférieur au prix de vente
      });

      expect(result.canPublish).toBe(false);
      expect(result.issues.some((i) => i.code === "invalid_compare_price")).toBe(true);
    });
  });

  describe("Protection SSRF sur l'extraction d'URL externe", () => {
    it("bloque formellement les adresses locales, métadonnées cloud et IP privées", () => {
      expect(isSsrfSafeUrl("http://localhost:3000/produit").isSafe).toBe(false);
      expect(isSsrfSafeUrl("http://127.0.0.1:8080").isSafe).toBe(false);
      expect(isSsrfSafeUrl("http://169.254.169.254/latest/meta-data").isSafe).toBe(false);
      expect(isSsrfSafeUrl("http://192.168.1.1/admin").isSafe).toBe(false);
      expect(isSsrfSafeUrl("http://10.0.0.1/secrets").isSafe).toBe(false);
      expect(isSsrfSafeUrl("ftp://monsite.com/produit").isSafe).toBe(false);
    });

    it("autorise les URLs externes publiques légitimes", () => {
      expect(isSsrfSafeUrl("https://exemple-boutique.com/produit-123").isSafe).toBe(true);
      expect(isSsrfSafeUrl("http://fournisseur-afrique.com/catalogue").isSafe).toBe(true);
    });
  });
});
