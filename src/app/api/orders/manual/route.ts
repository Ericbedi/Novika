import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthFromRequest } from "@/server/auth/request-auth";

export const dynamic = "force-dynamic";

/** Création d'une commande manuelle par un membre connecté (WhatsApp, réseaux sociaux, téléphone…). */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return NextResponse.json({ success: false, error: "Session absente ou expirée." }, { status: 401 });

    const body = await req.json();
    const { store, customerName, customerPhone, city, deliveryAddress, country, shippingFee, channel, notes, items } = body;
    if (!store || !customerName || !customerPhone || !city || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "Nom, téléphone, ville et au moins un article sont obligatoires." }, { status: 400 });
    }
    const secret = process.env.PRODUCT_SYNC_SECRET;
    if (!secret) return NextResponse.json({ success: false, error: "Non configuré sur le serveur." }, { status: 500 });

    const supabase = await createClient();
    if (auth.role === "owner") {
      const { data: shop } = await supabase.from("shops").select("owner_email").eq("slug", store).maybeSingle();
      if (shop?.owner_email && shop.owner_email.toLowerCase() !== auth.email) {
        return NextResponse.json({ success: false, error: "Cette boutique ne vous appartient pas." }, { status: 403 });
      }
    }
    const { data, error } = await (supabase as any).rpc("create_manual_order_server", {
      p_secret: secret,
      p_shop_slug: store,
      p_order: {
        customerName,
        customerPhone,
        city,
        deliveryAddress,
        country,
        shippingFee,
        channel,
        notes,
        items: items.map((i: { productId: string; quantity: number }) => ({ productId: i.productId, quantity: i.quantity })),
      },
    });
    if (error || !data?.success) {
      return NextResponse.json({ success: false, error: data?.error || "Commande non enregistrée." }, { status: error ? 500 : 422 });
    }
    return NextResponse.json({ success: true, order: { order_number: data.order_number, total_amount: data.total_amount } });
  } catch {
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}
