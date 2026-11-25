import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reserveStockForOrder } from "@/lib/stock-settings-store";
import { getAuthFromRequest } from "@/server/auth/request-auth";

export const dynamic = "force-dynamic";

/**
 * GET : liste des commandes de la boutique (réservée aux membres connectés).
 * POST : création d'une commande depuis la vitrine publique.
 *   Les prix sont recalculés côté base à partir du produit publié (le client ne fixe pas le montant).
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Session absente ou expirée." }, { status: 401 });
    }
    const storeSlug = req.nextUrl.searchParams.get("store") || "";
    const secret = process.env.PRODUCT_SYNC_SECRET;
    if (!storeSlug || !secret) return NextResponse.json({ success: true, orders: [] });

    const supabase = await createClient();
    if (auth.role === "owner") {
      const { data: shop } = await supabase.from("shops").select("owner_email").eq("slug", storeSlug).maybeSingle();
      if (shop?.owner_email && shop.owner_email.toLowerCase() !== auth.email) {
        return NextResponse.json({ success: false, error: "Cette boutique ne vous appartient pas." }, { status: 403 });
      }
    }
    const { data, error } = await (supabase as any).rpc("orders_list_server", { p_secret: secret, p_shop_slug: storeSlug });
    if (error || !data?.success) {
      return NextResponse.json({ success: false, error: "Lecture des commandes impossible." }, { status: 500 });
    }
    return NextResponse.json({ success: true, orders: data.orders || [] });
  } catch {
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderNumber,
      customerName,
      customerPhone,
      city,
      deliveryAddress,
      subtotal,
      productId,
      quantity = 1,
      storeSlug,
      items,
    } = body;

    if (!orderNumber || !customerName || !customerPhone || !city || !storeSlug) {
      return NextResponse.json(
        { success: false, error: "Champs obligatoires manquants (nom, téléphone, ville)." },
        { status: 400 }
      );
    }

    const targetProductId = productId || (Array.isArray(items) && items[0]?.id) || null;
    if (!targetProductId) {
      return NextResponse.json({ success: false, error: "Produit manquant." }, { status: 400 });
    }
    const orderQty = Math.min(Math.max(Number(quantity) || 1, 1), 50);

    // Politique de stock de la boutique (si configurée)
    const stockRes = reserveStockForOrder({
      storeSlug,
      productId: targetProductId,
      quantity: orderQty,
      orderNumber,
      isCloserConfirmation: false,
    });
    if (!stockRes.success && stockRes.orderStatus === "rejected_out_of_stock") {
      return NextResponse.json(
        { success: false, error: stockRes.error || "Ce produit est actuellement épuisé.", code: "OUT_OF_STOCK" },
        { status: 409 }
      );
    }

    const secret = process.env.PRODUCT_SYNC_SECRET;
    if (!secret) {
      return NextResponse.json({ success: false, error: "Commande non configurée sur le serveur." }, { status: 500 });
    }

    const supabase = await createClient();
    const { data, error } = await (supabase as any).rpc("create_order_server", {
      p_secret: secret,
      p_shop_slug: storeSlug,
      p_order: {
        orderNumber,
        customerName,
        customerPhone,
        city,
        deliveryAddress,
        subtotal,
        productId: targetProductId,
        quantity: orderQty,
      },
    });

    if (error || !data?.success) {
      console.error("[Orders API] création refusée:", error?.message || data?.error);
      return NextResponse.json(
        { success: false, error: data?.error || "Votre commande n'a pas pu être enregistrée. Réessayez." },
        { status: error ? 500 : 422 }
      );
    }

    return NextResponse.json({
      success: true,
      order: { order_number: data.order_number, total_amount: data.total_amount, status: "pending" },
    });
  } catch (err: unknown) {
    console.error("[Orders API] erreur:", err instanceof Error ? err.message : err);
    return NextResponse.json({ success: false, error: "Erreur serveur, réessayez." }, { status: 500 });
  }
}
