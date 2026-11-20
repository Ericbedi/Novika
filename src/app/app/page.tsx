import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppIndexPage() {
  try {
    const supabase = await createClient();
    const { data: shops } = await (supabase as any)
      .from("shops")
      .select("slug")
      .order("created_at", { ascending: true })
      .limit(1);

    if (shops && shops.length > 0 && shops[0]?.slug) {
      redirect(`/app/${shops[0].slug}`);
    }
  } catch (e: any) {
    if (e?.digest?.startsWith("NEXT_REDIRECT")) throw e;
  }

  // Si aucune boutique n'existe en base : AppShell affiche proprement l'état zéro
  return <AppShell initialStoreSlug="" children={null} />;
}
