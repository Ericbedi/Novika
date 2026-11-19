import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/config/routes";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const emailParam = requestUrl.searchParams.get("email");
  const nextParam = requestUrl.searchParams.get("next");

  let confirmedEmail = emailParam ? emailParam.trim().toLowerCase() : null;

  try {
    const supabase = await createClient();

    // 1. Échange du code PKCE pour session si présent
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.user?.email) {
        confirmedEmail = data.user.email.toLowerCase();
      }
    } else if (tokenHash) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "email",
      });
      if (!error && data?.user?.email) {
        confirmedEmail = data.user.email.toLowerCase();
      }
    }

    // 2. Activer le compte marchand associé
    if (confirmedEmail) {
      await (supabase as any)
        .from("merchant_accounts")
        .update({
          is_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("email", confirmedEmail);
    }
  } catch (err) {
    console.warn("[Auth Callback Notice]:", err);
  }

  // 3. Rediriger l'utilisateur vers /connexion avec indication de succès
  const targetEmail = confirmedEmail || "";
  const destination = nextParam
    ? (nextParam.startsWith("http") ? nextParam : `${requestUrl.origin}${nextParam}`)
    : `${requestUrl.origin}${ROUTES.login}?${targetEmail ? `email=${encodeURIComponent(targetEmail)}&` : ""}verified=true`;

  return NextResponse.redirect(destination);
}
