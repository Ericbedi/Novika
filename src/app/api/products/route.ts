import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getShopProducts, getShopProductsRaw, saveShopProductsList } from "@/lib/products-store";
import { Product } from "@/server/data/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeSlug = searchParams.get("store") || "lome-glow";
    const productIdOrSlug = searchParams.get("id") || searchParams.get("slug");

    // 1. Tentative de lecture Supabase via la vue unifiée product_availability
    try {
      const supabase = await createClient();
      let query = (supabase as any)
        .from("product_availability")
        .select("*")
        .eq("shop_slug", storeSlug);

      if (productIdOrSlug) {
        // Validation UUID stricte (Prompt 17-O) pour éviter l'erreur PostgreSQL 22P02
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdOrSlug);
        if (isUuid) {
          query = query.or(`slug.eq.${productIdOrSlug},product_id.eq.${productIdOrSlug},short_code.eq.${productIdOrSlug},legacy_id.eq.${productIdOrSlug}`);
        } else {
          query = query.or(`slug.eq.${productIdOrSlug},short_code.eq.${productIdOrSlug},legacy_id.eq.${productIdOrSlug},slug.ilike.${productIdOrSlug}%`);
        }
      }

      const { data: dbRows, error } = await query;

      if (!error && dbRows && dbRows.length > 0) {
        // Toutes les images de chaque produit, dans l'ordre choisi (la vue n'expose que la première)
        const ids = Array.from(new Set(dbRows.map((r: any) => r.product_id)));
        const { data: mediaRows } = await (supabase as any)
          .from("product_media")
          .select("product_id, media_url, position, media_type")
          .in("product_id", ids)
          .order("position", { ascending: true });
        const imagesByProduct = new Map<string, string[]>();
        for (const m of (mediaRows || []) as any[]) {
          if (m.media_type && m.media_type !== "image") continue;
          const list = imagesByProduct.get(m.product_id) || [];
          if (m.media_url && !list.includes(m.media_url)) list.push(m.media_url);
          imagesByProduct.set(m.product_id, list);
        }

        const mappedProducts: Product[] = dbRows.map((r: any) => {
        // Stock jamais saisi = ventes illimitées (le produit n'est pas en rupture à tort)
        const tracked = r.stock_tracked === true;
        const qty = tracked ? Number(r.available_stock) || 0 : 9999;
        return {
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
          images: imagesByProduct.get(r.product_id)?.length ? imagesByProduct.get(r.product_id)! : [r.image_url || "/products/serum-eclat.png"],
          salePrice: Number(r.sale_price) || 0,
          compareAtPrice: Number(r.compare_at_price) || 0,
          costPrice: 0,
          stock: qty,
          trackStock: tracked,
          trackQuantity: tracked,
          status: r.status || "active",
          productStatus: r.status || "active",
          stockStatus: qty > 0 ? "in_stock" : "out_of_stock",
          physicalStock: Number(r.physical_stock) || 0,
          reservedStock: 0,
          availableStock: qty,
          published_to_storefront: Boolean(r.published_to_storefront),
          sku: r.variant_title || "DEFAULT-SKU",
          variants: r.variant_id
            ? [
                {
                  id: r.variant_id,
                  name: r.variant_title || "Standard",
                  price: Number(r.sale_price) || 0,
                  costPrice: 0,
                  stock: qty,
                  sku: r.variant_title || "DEFAULT-SKU",
                  image: r.image_url || "/products/serum-eclat.png",
                },
              ]
            : [],
        };
        });

        saveShopProductsList(storeSlug, mappedProducts);

        return NextResponse.json({
          products: mappedProducts,
          source: "supabase",
        });
      }
    } catch (dbErr) {
      console.warn("[Products API] Supabase fallback to repository:", dbErr);
    }

    // 2. Repli vers le magasin de données local / mémoire
    const localProducts = getShopProducts(storeSlug);
    return NextResponse.json({
      products: localProducts,
      source: "local",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur produits";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
