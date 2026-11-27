import { Store, Product } from "@/server/data/types";
import { StorefrontData } from "@/server/data/storefront-types";
import { formatStoreSlugToName, createEmptyStorefront, ResolvedStorefront, setMemoryStore, setMemoryStorefront } from "./storefront-resolver";
import { saveShopProductsList } from "./products-store";
import { createClient } from "./supabase/server";
import { applyHomeConfig } from "./storefront-home-config";

export async function resolveStorefrontDataAsync(storeSlug: string): Promise<ResolvedStorefront> {
  let store: Store = {
    id: `store_${storeSlug}`,
    name: formatStoreSlugToName(storeSlug),
    slug: storeSlug,
    country: "TG",
    countryName: "Togo",
    flag: "🇹🇬",
    currency: "XOF",
    whatsappNumber: "",
    role: "owner",
  };

  let products: Product[] = [];

  try {
    const supabase = await createClient();

    // 1. Boutique
    const { data: dbShop } = await (supabase as any)
      .from("shops")
      .select("*")
      .eq("slug", storeSlug)
      .maybeSingle();

    if (dbShop) {
      store = {
        id: dbShop.id,
        name: dbShop.name,
        slug: dbShop.slug,
        country: dbShop.country_code || "TG",
        countryName: dbShop.country_code === "CI" ? "Côte d'Ivoire" : "Togo",
        flag: dbShop.country_code === "CI" ? "🇨🇮" : "🇹🇬",
        currency: dbShop.primary_currency || "XOF",
        whatsappNumber: "",
        role: "owner",
      };
    }

    // 2. Produits depuis product_availability
    const { data: dbProducts } = await (supabase as any)
      .from("product_availability")
      .select("*")
      .eq("shop_slug", storeSlug);

    if (dbProducts && dbProducts.length > 0) {
      // La vue renvoie une ligne par variante : on garde un seul exemplaire par produit
      const seenIds = new Set<string>();
      const uniqueRows = (dbProducts as any[]).filter((r) => {
        if (seenIds.has(r.product_id)) return false;
        seenIds.add(r.product_id);
        return true;
      });
      products = uniqueRows.map((r: any) => ({
        id: r.product_id,
        legacy_id: r.legacy_id || undefined,
        name: r.name,
        title: r.name,
        slug: r.slug,
        shortCode: r.short_code || r.slug?.slice(0, 6) || "prod01",
        short_code: r.short_code || r.slug?.slice(0, 6) || "prod01",
        description: r.description || "",
        category: r.category || "Santé & Bien-être",
        collection: r.category || "Santé & Bien-être",
        images: [r.image_url || "/products/serum-eclat.png"],
        salePrice: Number(r.sale_price) || 0,
        compareAtPrice: Number(r.compare_at_price) || 0,
        costPrice: 0,
        stock: r.stock_tracked === false || Number(r.available_stock) <= 0 ? 9999 : Number(r.available_stock),
        status: r.status || "active",
        productStatus: r.status || "active",
        stockStatus: "in_stock" as const,
        physicalStock: Number(r.physical_stock) || 0,
        reservedStock: 0,
        availableStock: r.stock_tracked === false || Number(r.available_stock) <= 0 ? 9999 : Number(r.available_stock),
        published_to_storefront: Boolean(r.published_to_storefront),
        sku: r.variant_title || "DEFAULT-SKU",
        variants: r.variant_id
          ? [
              {
                id: r.variant_id,
                name: r.variant_title || "Standard",
                price: Number(r.sale_price) || 0,
                costPrice: 0,
                stock: 9999,
                sku: r.variant_title || "DEFAULT-SKU",
                image: r.image_url || "/products/serum-eclat.png",
              },
            ]
          : [],
      }));

      // Enregistrement en mémoire pour que les routes enfants et fonctions synchrones aient accès aux produits
      saveShopProductsList(storeSlug, products);
    }
  } catch (err) {
    console.warn("[Storefront Resolver Server] Supabase lookup error:", err);
  }

  const activeProducts = (products || []).filter(
    (p) => (p.productStatus === "active" || p.status === "active") && !p.hiddenFromCatalog
  );

  // Identité et personnalisation enregistrées par le vendeur (même rendu sur mobile et navigateur)
  let brand: { tagline?: string; description?: string; whatsapp?: string } = {};
  let homeConfig: unknown = {};
  try {
    const supabase = await createClient();
    const [b, h] = await Promise.all([
      (supabase as any).rpc("shop_brand_public", { p_slug: storeSlug }),
      (supabase as any).rpc("shop_home_public", { p_slug: storeSlug }),
    ]);
    if (b?.data?.brand && typeof b.data.brand === "object") brand = b.data.brand;
    homeConfig = h?.data || {};
  } catch {
    /* valeurs par défaut */
  }

  let storefront: StorefrontData = createEmptyStorefront(storeSlug, store.name, brand);
  storefront = applyHomeConfig(storefront, homeConfig);
  storefront.isPublished = true;

  const isPreparationMode = !storefront.isPublished || activeProducts.length === 0;

  setMemoryStore(storeSlug, store);
  setMemoryStorefront(storeSlug, storefront);

  return {
    store,
    storefront,
    products,
    activeProducts,
    deliveredOrdersCount: 0,
    averageRating: null,
    totalReviewsCount: 0,
    isPreparationMode,
    canPublish: activeProducts.length > 0,
  };
}
