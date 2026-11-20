import { NextRequest, NextResponse } from "next/server";
import { getInvitationByToken, acceptInvitation } from "@/server/auth/team-invitations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token d'invitation manquant." }, { status: 400 });
    }

    const check = getInvitationByToken(token);
    if (!check.valid || !check.invitation) {
      return NextResponse.json(
        { error: check.error, code: check.code },
        { status: check.code === "NOT_FOUND" ? 404 : 410 }
      );
    }

    return NextResponse.json({
      success: true,
      invitation: {
        email: check.invitation.email,
        role: check.invitation.role,
        country: check.invitation.country,
        expiresAt: check.invitation.expiresAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, name, password, phone } = body;

    if (!token || !name || !password) {
      return NextResponse.json(
        { error: "Veuillez renseigner votre nom complet et votre mot de passe." },
        { status: 400 }
      );
    }

    const result = acceptInvitation({ token, name, password, phone });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      member: result.member,
      message: "Votre compte a été activé avec succès. Vous pouvez maintenant vous connecter.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
