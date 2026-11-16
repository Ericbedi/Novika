import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, country, currency, whatsapp, ownerEmail } = body;

    if (!name || !slug || !country || !currency) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants (nom, slug, pays, devise)." },
        { status: 400 }
      );
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-");
    const supabase = await createClient();

    // Insertion dans public.shops
    const { data: newShop, error: shopErr } = await (supabase as any)
      .from("shops")
      .insert({
        name: name.trim(),
        slug: cleanSlug,
        country_code: country,
        primary_currency: currency,
        currency_locked: false,
        delivery_policy: "free_local",
        owner_email: ownerEmail || null,
      })
      .select()
      .single();

    if (shopErr) {
      console.warn("[Stores Create API] shops insert error:", shopErr);
    }

    // Insertion conjointe dans public.stores
    await (supabase as any)
      .from("stores")
      .insert({
        id: newShop?.id || `store_${cleanSlug}_${Date.now()}`,
        name: name.trim(),
        slug: cleanSlug,
        country_code: country,
        country_name: country,
        flag: "🌍",
        currency: currency,
        whatsapp_number: whatsapp || "",
        owner_email: ownerEmail || null,
      });

    return NextResponse.json({
      success: true,
      store: {
        id: newShop?.id || `store_${cleanSlug}`,
        name: name.trim(),
        slug: cleanSlug,
        country,
        currency,
        whatsappNumber: whatsapp || "",
        role: "owner",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
