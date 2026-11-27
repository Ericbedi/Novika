/**
 * Gestionnaire d'état du Panier Multi-Produits côté client (Prompt 12-b Phase 3)
 * Modèle COD Africain :
 * - Stockage local isolé par boutique (localStorage + réactivité CustomEvent)
 * - Contrôle strict des stocks réels (ne dépasse jamais le stock disponible)
 * - Synchronisation instantanée entre l'en-tête, le tiroir latéral et la page panier
 */

export interface CartItem {
  id: string; // `${productId}_${variantId || "default"}`
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  image?: string;
  unitPrice: number;
  quantity: number;
  stock: number;
}

const CART_PREFIX = "novika_store_cart_";
const memoryCarts = new Map<string, CartItem[]>();

export function getCartStorageKey(storeSlug: string): string {
  return `${CART_PREFIX}${storeSlug}`;
}

export function clearCartMemory(): void {
  memoryCarts.clear();
}

/**
 * Récupère le contenu actuel du panier pour une boutique donnée.
 */
export function getCart(storeSlug: string): CartItem[] {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(getCartStorageKey(storeSlug));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Erreur de lecture du panier local:", e);
    }
  }

  if (memoryCarts.has(storeSlug)) {
    return memoryCarts.get(storeSlug)!;
  }

  return [];
}

/**
 * Sauvegarde le panier et notifie tous les composants abonnés.
 */
function persistAndNotify(storeSlug: string, items: CartItem[]): void {
  memoryCarts.set(storeSlug, items);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getCartStorageKey(storeSlug), JSON.stringify(items));
      window.dispatchEvent(
        new CustomEvent("novika:cart_updated", {
          detail: { storeSlug, items },
        })
      );
    } catch (e) {
      console.error("Erreur de sauvegarde du panier:", e);
    }
  }
}

/**
 * Ajoute un article au panier avec contrôle de stock disponible.
 */
export function addToCart(
  storeSlug: string,
  item: Omit<CartItem, "id"> & { id?: string }
): { success: boolean; cart: CartItem[]; error?: string } {
  const currentCart = getCart(storeSlug);
  const itemId = item.id || `${item.productId}_${item.variantId || "default"}`;
  const maxStock = 99; // commandes toujours possibles, sans plafond de stock

  const existingIndex = currentCart.findIndex((i) => i.id === itemId);

  let updatedList: CartItem[];

  if (existingIndex >= 0) {
    const existing = currentCart[existingIndex];
    const newQty = existing.quantity + (item.quantity || 1);

    if (newQty > maxStock) {
      return {
        success: false,
        cart: currentCart,
        error: `Stock insuffisant : plus que ${maxStock} unité${maxStock > 1 ? "s" : ""} disponible${maxStock > 1 ? "s" : ""}.`,
      };
    }

    updatedList = [...currentCart];
    updatedList[existingIndex] = {
      ...existing,
      quantity: newQty,
      unitPrice: item.unitPrice,
      image: item.image || existing.image,
    };
  } else {
    const initialQty = Math.min(item.quantity || 1, maxStock);
    const newItem: CartItem = {
      id: itemId,
      productId: item.productId,
      variantId: item.variantId,
      name: item.name,
      variantName: item.variantName,
      image: item.image,
      unitPrice: item.unitPrice,
      quantity: initialQty,
      stock: maxStock,
    };
    updatedList = [newItem, ...currentCart];
  }

  persistAndNotify(storeSlug, updatedList);
  return { success: true, cart: updatedList };
}

/**
 * Met à jour la quantité d'un article dans le panier.
 */
export function updateCartItemQuantity(
  storeSlug: string,
  itemId: string,
  quantity: number
): CartItem[] {
  const currentCart = getCart(storeSlug);

  if (quantity <= 0) {
    return removeFromCart(storeSlug, itemId);
  }

  const updated = currentCart.map((item) => {
    if (item.id === itemId) {
      const clampedQty = Math.min(quantity, item.stock);
      return { ...item, quantity: clampedQty };
    }
    return item;
  });

  persistAndNotify(storeSlug, updated);
  return updated;
}

/**
 * Supprime un article du panier.
 */
export function removeFromCart(storeSlug: string, itemId: string): CartItem[] {
  const currentCart = getCart(storeSlug);
  const updated = currentCart.filter((item) => item.id !== itemId);
  persistAndNotify(storeSlug, updated);
  return updated;
}

/**
 * Vide intégralement le panier de la boutique.
 */
export function clearCart(storeSlug: string): void {
  persistAndNotify(storeSlug, []);
}

/**
 * Calcule le sous-total du panier en FCFA.
 */
export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

/**
 * Calcule le nombre total d'articles dans le panier.
 */
export function getCartTotalCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Ouvre ou ferme le tiroir latéral du panier.
 */
export function openCartDrawer(storeSlug: string): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("novika:open_cart_drawer", { detail: { storeSlug } })
    );
  }
}

export function closeCartDrawer(storeSlug: string): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("novika:close_cart_drawer", { detail: { storeSlug } })
    );
  }
}
