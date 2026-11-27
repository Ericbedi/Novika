import { describe, it, expect, beforeEach } from "vitest";
import {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  clearCartMemory,
  getCartSubtotal,
  getCartTotalCount,
} from "./cart-store";

describe("Prompt 12-b Phase 3 : Panier Multi-Produits (cart-store)", () => {
  const storeA = "lome-glow";
  const storeB = "cotonou-tech";

  beforeEach(() => {
    clearCartMemory();
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  it("1. Retourne un panier vide par défaut", () => {
    const cart = getCart(storeA);
    expect(cart).toEqual([]);
    expect(getCartTotalCount(cart)).toBe(0);
    expect(getCartSubtotal(cart)).toBe(0);
  });

  it("2. Ajoute un article avec succès et calcule le total", () => {
    const res = addToCart(storeA, {
      productId: "prod_01",
      name: "Sérum Éclat Niacinamide",
      unitPrice: 15000,
      quantity: 2,
      stock: 10,
      image: "/images/serum.webp",
    });

    expect(res.success).toBe(true);
    expect(res.cart).toHaveLength(1);
    expect(res.cart[0].name).toBe("Sérum Éclat Niacinamide");
    expect(res.cart[0].quantity).toBe(2);

    expect(getCartTotalCount(res.cart)).toBe(2);
    expect(getCartSubtotal(res.cart)).toBe(30000);
  });

  it("3. Incrémente la quantité quand on ajoute à nouveau le même produit/variante", () => {
    addToCart(storeA, {
      productId: "prod_01",
      variantId: "var_50ml",
      name: "Crème Hydratante 50ml",
      unitPrice: 10000,
      quantity: 1,
      stock: 5,
    });

    const secondAdd = addToCart(storeA, {
      productId: "prod_01",
      variantId: "var_50ml",
      name: "Crème Hydratante 50ml",
      unitPrice: 10000,
      quantity: 2,
      stock: 5,
    });

    expect(secondAdd.success).toBe(true);
    expect(secondAdd.cart).toHaveLength(1);
    expect(secondAdd.cart[0].quantity).toBe(3);
    expect(getCartSubtotal(secondAdd.cart)).toBe(30000);
  });

  it("4. Commandes toujours possibles : la quantité peut dépasser le stock affiché", () => {
    addToCart(storeA, {
      productId: "prod_rare",
      name: "Édition Limitée Or",
      unitPrice: 50000,
      quantity: 2,
      stock: 3,
    });

    // Tentative d'ajouter 2 unités supplémentaires alors qu'il n'en reste qu'une (stock max = 3)
    const overflowAdd = addToCart(storeA, {
      productId: "prod_rare",
      name: "Édition Limitée Or",
      unitPrice: 50000,
      quantity: 2,
      stock: 3,
    });

    expect(overflowAdd.success).toBe(true);
    expect(getCart(storeA)[0].quantity).toBe(4);
  });

  it("5. Met à jour la quantité d'un article (plafond 99, sans lien avec le stock)", () => {
    addToCart(storeA, {
      productId: "prod_02",
      name: "Savon Noir d'Afrique",
      unitPrice: 3000,
      quantity: 1,
      stock: 4,
    });

    const updated = updateCartItemQuantity(storeA, "prod_02_default", 3);
    expect(updated[0].quantity).toBe(3);

    // Le stock ne limite plus la commande
    const more = updateCartItemQuantity(storeA, "prod_02_default", 10);
    expect(more[0].quantity).toBe(10);
  });

  it("6. updateCartItemQuantity avec quantité 0 supprime l'article", () => {
    addToCart(storeA, {
      productId: "prod_03",
      name: "Huile de Baobab Pure",
      unitPrice: 8000,
      quantity: 2,
      stock: 10,
    });

    const afterZero = updateCartItemQuantity(storeA, "prod_03_default", 0);
    expect(afterZero).toHaveLength(0);
  });

  it("7. Supprime un article spécifique avec removeFromCart", () => {
    addToCart(storeA, {
      productId: "prod_a",
      name: "Article A",
      unitPrice: 5000,
      quantity: 1,
      stock: 10,
    });
    addToCart(storeA, {
      productId: "prod_b",
      name: "Article B",
      unitPrice: 7000,
      quantity: 1,
      stock: 10,
    });

    expect(getCart(storeA)).toHaveLength(2);

    const remaining = removeFromCart(storeA, "prod_a_default");
    expect(remaining).toHaveLength(1);
    expect(remaining[0].productId).toBe("prod_b");
  });

  it("8. clearCart vide intégralement le panier", () => {
    addToCart(storeA, {
      productId: "p1",
      name: "P1",
      unitPrice: 1000,
      quantity: 1,
      stock: 5,
    });
    addToCart(storeA, {
      productId: "p2",
      name: "P2",
      unitPrice: 2000,
      quantity: 1,
      stock: 5,
    });

    clearCart(storeA);
    expect(getCart(storeA)).toEqual([]);
  });

  it("9. Isolation stricte entre boutiques différentes", () => {
    addToCart(storeA, {
      productId: "prod_lome",
      name: "Lomé Exclusive",
      unitPrice: 12000,
      quantity: 1,
      stock: 5,
    });

    addToCart(storeB, {
      productId: "prod_cotonou",
      name: "Cotonou Tech",
      unitPrice: 25000,
      quantity: 3,
      stock: 10,
    });

    const cartA = getCart(storeA);
    const cartB = getCart(storeB);

    expect(cartA).toHaveLength(1);
    expect(cartA[0].name).toBe("Lomé Exclusive");

    expect(cartB).toHaveLength(1);
    expect(cartB[0].name).toBe("Cotonou Tech");
    expect(cartB[0].quantity).toBe(3);
  });
});
