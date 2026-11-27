import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthFromRequest } from "@/server/auth/request-auth";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Session absente ou expirée. Reconnectez-vous." }, { status: 401 });
    }
    const body = await req.json();
    const { name, country, currency, whatsapp, brand } = body;
    // Le propriétaire est toujours le compte connecté (jamais une adresse fournie par le client)
    const ownerEmail: string = auth.email;
    const slug = body.slug || (name ? String(name).toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-") : "");

    if (!name || !slug || !country || !currency) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants (nom, slug, pays, devise)." },
        { status: 400 }
      );
    }

    let cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-");
    const supabase = await createClient();
    // Lien déjà pris : on ajoute un numéro (nom-2, nom-3…)
    {
      const base = cleanSlug;
      for (let i = 2; i < 30; i++) {
        const { data: taken } = await (supabase as any).from("shops").select("id").eq("slug", cleanSlug).maybeSingle();
        if (!taken) break;
        cleanSlug = `${base}-${i}`;
      }
    }

    // Règle Novika : 1 e-mail = 1 boutique, sauf les administrateurs de la plateforme (plusieurs marques)
    const admins = (process.env.PLATFORM_ADMIN_EMAILS || "promisesbedi@gmail.com")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const maxShops = admins.includes(ownerEmail.toLowerCase()) ? 20 : 1;
    const { data: ownedShops } = await (supabase as any)
      .from("shops")
      .select("id, slug, name")
      .eq("owner_email", ownerEmail);
    if ((ownedShops?.length || 0) >= maxShops) {
      return NextResponse.json(
        {
          error: "Un compte marchand ne peut créer qu'une seule boutique sur la plateforme.",
          existingStore: ownedShops?.[0],
        },
        { status: 409 }
      );
    }

    const effectiveOwnerEmail = ownerEmail || "promisesbedi@gmail.com";

    const secret = process.env.PRODUCT_SYNC_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Création de boutique non configurée sur le serveur." }, { status: 500 });
    }
    const brandData = {
      ...(brand && typeof brand === "object" ? brand : {}),
      whatsapp: whatsapp || undefined,
    };
    const { data: created, error: shopErr } = await (supabase as any).rpc("shop_create_server", {
      p_secret: secret,
      p_name: name.trim(),
      p_slug: cleanSlug,
      p_country: country,
      p_currency: currency,
      p_owner_email: effectiveOwnerEmail,
      p_city: typeof body.city === "string" ? body.city : "",
      p_brand: brandData,
    });
    if (shopErr || !created?.success) {
      const taken = created?.code === "SLUG_TAKEN";
      return NextResponse.json(
        { error: created?.error || "La boutique n'a pas pu être créée." },
        { status: taken ? 409 : 500 }
      );
    }
    const newShop = { id: created.id };

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
