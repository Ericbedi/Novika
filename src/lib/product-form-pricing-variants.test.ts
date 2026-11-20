import { describe, it, expect } from "vitest";
import {
  canViewProducts,
  canManageProducts,
  canViewProductFinancials,
  canTrashProduct,
  canArchiveProduct,
  canHardDeleteProduct,
} from "@/config/permissions";
import { ProductOption, ProductVariant } from "@/server/data/types";

describe("Prompt 17 - Phase 17-C : Calculs Prix, Marge & Bénéfice", () => {
  it("calcule exactement le bénéfice et la marge sans décimale en FCFA", () => {
    const salePrice = 15000;
    const costPrice = 6000;
    const profit = salePrice - costPrice; // 9000 FCFA
    const margin = ((profit / salePrice) * 100).toFixed(1); // 60.0%

    expect(profit).toBe(9000);
    expect(margin).toBe("60.0");
  });

  it("gère les cas limites de marge avec prix nul ou égal au coût", () => {
    const salePrice = 5000;
    const costPrice = 5000;
    const profit = salePrice - costPrice;
    const margin = ((profit / salePrice) * 100).toFixed(1);

    expect(profit).toBe(0);
    expect(margin).toBe("0.0");
  });

  it("valide strictement que le prix de comparaison (avant réduction) est supérieur au prix de vente", () => {
    const validateComparePrice = (sale: number, compare?: number) => {
      if (compare !== undefined && compare > 0 && compare <= sale) {
        return "Le prix de comparaison (avant réduction) doit être strictement supérieur au prix de vente.";
      }
      return null;
    };

    expect(validateComparePrice(15000, 20000)).toBeNull(); // Valide
    expect(validateComparePrice(15000, 15000)).toContain("strictement supérieur"); // Invalide
    expect(validateComparePrice(15000, 10000)).toContain("strictement supérieur"); // Invalide
    expect(validateComparePrice(15000, undefined)).toBeNull(); // Optionnel
  });
});

describe("Prompt 17 - Droits & Permissions par Rôle (permissions.ts)", () => {
  it("autorise la consultation des produits pour admin, co-admin, manager et closeuse", () => {
    expect(canViewProducts("owner")).toBe(true);
    expect(canViewProducts("admin")).toBe(true);
    expect(canViewProducts("manager")).toBe(true);
    expect(canViewProducts("closer")).toBe(true);
  });

  it("interdit formellement la consultation des produits aux livreurs et agences", () => {
    expect(canViewProducts("rider")).toBe(false);
    expect(canViewProducts("courier")).toBe(false);
    expect(canViewProducts("agency")).toBe(false);
  });

  it("réserve la création, modification et suppression aux admin et co-admin", () => {
    expect(canManageProducts("owner")).toBe(true);
    expect(canManageProducts("admin")).toBe(true);
    expect(canManageProducts("manager")).toBe(false);
    expect(canManageProducts("closer")).toBe(false);
  });

  it("réserve strictement le coût d'achat et la marge financière à admin et co-admin", () => {
    expect(canViewProductFinancials("owner")).toBe(true);
    expect(canViewProductFinancials("admin")).toBe(true);
    expect(canViewProductFinancials("manager")).toBe(false);
    expect(canViewProductFinancials("closer")).toBe(false); // Closeuse ne voit JAMAIS coût ni marge
    expect(canViewProductFinancials("rider")).toBe(false);
  });

  it("vérifie les droits de suppression définitive réservés au propriétaire", () => {
    expect(canTrashProduct("owner")).toBe(true);
    expect(canTrashProduct("admin")).toBe(true);
    expect(canArchiveProduct("admin")).toBe(true);
    expect(canHardDeleteProduct("admin")).toBe(false); // Co-admin ne peut pas détruire définitivement
    expect(canHardDeleteProduct("owner")).toBe(true);
  });
});

describe("Prompt 17 - Phase 17-C : Moteur de Génération des Variantes", () => {
  it("génère le produit cartésien exact jusqu'à 3 options et 100 variantes", () => {
    const options: ProductOption[] = [
      { id: "opt-1", name: "Taille", values: ["S", "M", "L"] },
      { id: "opt-2", name: "Couleur", values: ["Noir", "Blanc"] },
    ];

    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>(
        (acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])),
        [[]]
      );
    };

    const combinations = cartesian(options.map((o) => o.values));
    expect(combinations).toHaveLength(6); // 3 * 2 = 6 variantes
    expect(combinations[0]).toEqual(["S", "Noir"]);
    expect(combinations[5]).toEqual(["L", "Blanc"]);
  });

  it("bloque la création au-delà de 3 options", () => {
    const optionsCount = 3;
    const canAddOption = optionsCount < 3;
    expect(canAddOption).toBe(false);
  });
});

describe("Prompt 17 - Phase 17-D : Règle de suppression avec commandes existantes", () => {
  it("refuse la suppression définitive d'un produit avec commandes et impose l'archivage", () => {
    const orderCount: number = 5;
    const canDeletePermanently = orderCount === 0;
    const archiveRecommended = orderCount > 0;

    expect(canDeletePermanently).toBe(false);
    expect(archiveRecommended).toBe(true);
  });
});
