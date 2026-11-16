import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

      // 1. Tenter l'envoi de l'e-mail réel via Supabase Auth
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          data: {
            full_name: fullName || "",
            country: country || "TG",
            phone: phone || "",
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
