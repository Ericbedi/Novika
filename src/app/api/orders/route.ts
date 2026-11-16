import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeSlug = searchParams.get("store") || "lome-glow";

    const supabase = await createClient();

    // Query store id from slug
    const { data: storeData } = await supabase
      .from("shops")
      .select("id")
      .eq("slug", storeSlug)
      .maybeSingle();

    const storeId = storeData?.id;

    let query = supabase
      .from("orders")
      .select(`
        id,
        order_number,
        customer_name,
        customer_phone,
        city,
        country,
        currency,
        delivery_address,
        status,
        status_reason,
        subtotal,
        shipping_fee,
        total_amount,
        created_at,
        updated_at,
        order_items (
          id,
          product_name,
          quantity,
          unit_price,
          total_price,
          image
        )
      `)
      .order("created_at", { ascending: false });

    if (storeId) {
      query = query.eq("store_id", storeId);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.warn("[Orders API] Supabase query warning:", error.message);
      return NextResponse.json({
        success: false,
        error: error.message,
        orders: [],
      });
    }

    return NextResponse.json({
      success: true,
      orders: orders || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
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
      country,
      currency,
      deliveryAddress,
      subtotal,
      shippingFee = 0,
      totalAmount,
      productId,
      productTitle,
      productImage,
      quantity = 1,
      storeSlug = "lome-glow",
      trackingToken,
    } = body;

    if (!orderNumber || !customerName || !customerPhone || !city) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants (numéro, nom, téléphone, ville)." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find store if possible
    const { data: store } = await supabase
      .from("shops")
      .select("id")
      .eq("slug", storeSlug)
      .maybeSingle();

    const storeId = store?.id || null;

    // Insert into orders
    const { data: insertedOrder, error: orderErr } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: customerName,
        customer_phone: customerPhone,
        city: city,
        country: country || "TG",
        currency: currency || "XOF",
        delivery_address: deliveryAddress || null,
        subtotal: Math.round(Number(subtotal) || 0),
        shipping_fee: Math.round(Number(shippingFee) || 0),
        total_amount: Math.round(Number(totalAmount) || 0),
        status: "NOUVELLE",
        store_id: storeId,
      })
      .select()
      .single();

    if (orderErr) {
      console.warn("[Orders API] Supabase order insert error:", orderErr);
      return NextResponse.json(
        { error: orderErr.message },
        { status: 500 }
      );
    }

    // Insert order item
    if (insertedOrder) {
      await supabase.from("order_items").insert({
        order_id: insertedOrder.id,
        product_name: productTitle || "Article COD",
        quantity: Number(quantity) || 1,
        unit_price: Math.round(Number(subtotal) / (Number(quantity) || 1)),
        total_price: Math.round(Number(subtotal)),
        image: productImage || null,
        product_id: productId || null,
      });

      // Insert tracking token if provided
      if (trackingToken && storeId) {
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("tracking_tokens").insert({
          order_id: insertedOrder.id,
          store_id: storeId,
          token_hash: trackingToken,
          expires_at: expiresAt,
        });
      }
    }

    return NextResponse.json({
      success: true,
      order: insertedOrder,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
