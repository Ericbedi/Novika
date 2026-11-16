import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Invalider les cookies de session et d'authentification
    cookieStore.delete("sb-access-token");
    cookieStore.delete("sb-refresh-token");
    cookieStore.delete("afribuilder_session");
    cookieStore.delete("afribuilder_auth");

    const response = NextResponse.json(
      { success: true, message: "Déconnexion réussie et session invalidée côté serveur" },
      { status: 200 }
    );

    // Supprimer explicitement les en-têtes Set-Cookie
    response.cookies.set("afribuilder_session", "", { maxAge: 0, path: "/" });
    response.cookies.set("sb-access-token", "", { maxAge: 0, path: "/" });
    response.cookies.set("sb-refresh-token", "", { maxAge: 0, path: "/" });

    return response;
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Erreur lors de la déconnexion" },
      { status: 500 }
    );
  }
}
