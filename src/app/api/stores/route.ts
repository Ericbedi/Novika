import { NextRequest, NextResponse } from "next/server";
import { getAllStores } from "@/server/data/store-repository";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    const supabase = await createClient();

    let query = (supabase as any)
      .from("stores")
      .select("*")
      .order("created_at", { ascending: true });

    if (email && email !== "promises@afribuilder.com") {
      query = query.eq("owner_email", email.trim().toLowerCase());
    }

    const { data: dbStores, error } = await query;

    if (!error && dbStores) {
      // Si l'utilisateur n'a pas encore de boutique, renvoyer liste vide (ne pas polluer avec la démo)
      if (email && email !== "promises@afribuilder.com" && dbStores.length === 0) {
        return NextResponse.json({ stores: [], source: "supabase" });
      }

      if (dbStores.length > 0) {
        const mappedStores = dbStores.map((s: any) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          country: s.country_code,
          countryName: s.country_name || s.country_code,
          flag: s.flag || "🌍",
          currency: s.currency,
          whatsappNumber: s.whatsapp_number || "",
          role: "owner" as const,
          status: "active" as const,
          orderCount: 0,
          productCount: 0,
        }));
        return NextResponse.json({ stores: mappedStores, source: "supabase" });
      }
    }
  } catch (err) {
    console.warn("[Stores API] Supabase fallback to local repository:", err);
  }

  // Fallback to local store repository (seulement pour démo ou sans filtre email spécifique)
  const stores = getAllStores();
  return NextResponse.json({ stores, source: "local" });
}
