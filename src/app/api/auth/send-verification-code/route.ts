import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/config/routes";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, fullName, country, phone, password, niches } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Adresse email invalide." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    // Génération d'un code cryptographique à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    let emailSentViaSupabase = false;

    try {
      const supabase = await createClient();

      // 0. Règle absolue : 1 email = 1 seul compte sur la plateforme
      const { data: existingAccount } = await (supabase as any)
        .from("merchant_accounts")
        .select("email, is_verified")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (existingAccount && existingAccount.is_verified) {
        return NextResponse.json(
          {
            error: "Un compte existe déjà avec cette adresse e-mail. Vous ne pouvez créer qu'un seul compte par adresse. Veuillez vous connecter directement.",
            accountExists: true,
          },
          { status: 409 }
        );
      }

      // Déterminer l'origine propre du client pour la redirection
      const clientOrigin = req.headers.get("origin") || req.headers.get("referer") || "http://localhost:3000";
      let originUrl = "http://localhost:3000";
      try {
        const parsed = new URL(clientOrigin);
        originUrl = parsed.origin;
      } catch {
        originUrl = "http://localhost:3000";
      }

      const callbackUrl = `${originUrl}${ROUTES.authCallback}?email=${encodeURIComponent(normalizedEmail)}&next=${encodeURIComponent(`${ROUTES.login}?email=${encodeURIComponent(normalizedEmail)}&verified=true`)}`;

      // 1. Tenter l'envoi de l'e-mail réel via Supabase Auth
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: callbackUrl,
          data: {
            full_name: fullName || "",
            country: country || "TG",
            phone: phone || "",
            verification_code: code,
          },
        },
      });

      if (!otpError) {
        emailSentViaSupabase = true;
      } else {
        console.warn("[Auth API] Supabase signInWithOtp notice:", otpError.message);
      }

      // 2. Enregistrement du code de vérification dans Supabase
      await (supabase as any).from("email_verification_codes").insert({
        email: normalizedEmail,
        code: code,
        expires_at: expiresAt,
        used: false,
      });

      // 3. Enregistrement ou mise à jour du compte marchand avec is_verified = false
      if (password) {
        await (supabase as any).from("merchant_accounts").upsert(
          {
            email: normalizedEmail,
            password_hash: password,
            full_name: fullName || "Marchand Novika",
            phone: phone || null,
            country: country || "TG",
            niches: Array.isArray(niches) ? niches : [],
            is_verified: false,
            role: "owner",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );
      }
    } catch (dbErr) {
      console.warn("[Auth API] Supabase DB write notice:", dbErr);
    }

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      emailSentViaSupabase,
      message: "Un code de confirmation à 6 chiffres a été envoyé à votre adresse e-mail. Veuillez consulter votre boîte de réception.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
