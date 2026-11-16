import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Veuillez renseigner votre adresse e-mail et votre mot de passe." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Comptes de démonstration prédéfinis
    if (
      normalizedEmail === "admin@novika.com" ||
      normalizedEmail === "promises@afribuilder.africa" ||
      normalizedEmail === "owner@novika.com"
    ) {
      if (password === "wrongpass" || password.length < 6) {
        return NextResponse.json(
          { error: "E-mail ou mot de passe incorrect." },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          email: normalizedEmail,
          fullName: "Administrateur Novika",
          role: "owner",
          isDemo: true,
          hasStores: true,
          stores: [
            {
              id: "store_tg_01",
              name: "Lomé Glow Cosmétiques",
              slug: "lome-glow",
              country: "TG",
              currency: "XOF",
            },
          ],
        },
      });
    }

    // Rôles démo (closer, rider, agency)
    if (
      normalizedEmail.includes("closer") ||
      normalizedEmail.includes("rider") ||
      normalizedEmail.includes("agency")
    ) {
      if (password === "wrongpass" || password.length < 6) {
        return NextResponse.json(
          { error: "E-mail ou mot de passe incorrect." },
          { status: 401 }
        );
      }
      const role = normalizedEmail.includes("closer")
        ? "closer"
        : normalizedEmail.includes("rider")
        ? "rider"
        : "agency";
      return NextResponse.json({
        success: true,
        user: {
          email: normalizedEmail,
          fullName: `Collaborateur ${role}`,
          role: role,
          isDemo: true,
          hasStores: true,
        },
      });
    }

    // 2. Recherche du compte marchand réel dans Supabase table merchant_accounts
    const supabase = await createClient();
    const { data: userRecord } = await (supabase as any)
      .from("merchant_accounts")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!userRecord) {
      return NextResponse.json(
        {
          error: "Compte introuvable. Veuillez d'abord créer votre compte vendeur.",
          code: "ACCOUNT_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // 3. Vérification si l'e-mail a été validé par code
    if (!userRecord.is_verified) {
      return NextResponse.json(
        {
          error: "Votre compte n'est pas encore activé. Veuillez saisir le code à 6 chiffres reçu par e-mail.",
          code: "EMAIL_NOT_VERIFIED",
          email: normalizedEmail,
        },
        { status: 403 }
      );
    }

    // 4. Contrôle du mot de passe
    if (userRecord.password_hash !== password) {
      return NextResponse.json(
        { error: "E-mail ou mot de passe incorrect." },
        { status: 401 }
      );
    }

    // 5. Recherche des boutiques de cet utilisateur spécifique
    const { data: userShops } = await supabase
      .from("shops")
      .select("id, name, slug, country_code, primary_currency")
      .eq("owner_email", normalizedEmail);

    const hasStores = Boolean(userShops && userShops.length > 0);

    return NextResponse.json({
      success: true,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        fullName: userRecord.full_name,
        country: userRecord.country,
        role: userRecord.role || "owner",
        hasStores,
        stores: userShops || [],
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
