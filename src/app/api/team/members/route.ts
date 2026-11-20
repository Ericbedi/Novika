import { NextRequest, NextResponse } from "next/server";
import {
  listAllMembers,
  updateMemberRole,
  suspendMember,
  reactivateMember,
  removeMember,
  AllowedRole,
} from "@/server/auth/team-invitations";
import { isOwnerEmail } from "@/config/owner";

export async function GET(req: NextRequest) {
  try {
    const callerEmail = req.cookies.get("novika_user_email")?.value;
    const callerRole = req.cookies.get("novika_active_role")?.value;

    const isAuthorized = isOwnerEmail(callerEmail) || callerRole === "owner" || callerRole === "admin";
    if (!isAuthorized) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const members = listAllMembers();
    return NextResponse.json({ success: true, members });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const callerEmail = req.cookies.get("novika_user_email")?.value;
    const callerRole = req.cookies.get("novika_active_role")?.value;

    const isAuthorized = isOwnerEmail(callerEmail) || callerRole === "owner";
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Seul le propriétaire peut modifier les rôles de l'équipe." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { memberId, newRole } = body as { memberId: string; newRole: AllowedRole };

    if (!memberId || !newRole) {
      return NextResponse.json({ error: "Identifiant du membre et nouveau rôle requis." }, { status: 400 });
    }

    const result = updateMemberRole({
      memberId,
      newRole,
      performedBy: callerEmail || "Propriétaire",
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Rôle mis à jour." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const callerEmail = req.cookies.get("novika_user_email")?.value;
    const callerRole = req.cookies.get("novika_active_role")?.value;

    const isAuthorized = isOwnerEmail(callerEmail) || callerRole === "owner" || callerRole === "admin";
    if (!isAuthorized) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const body = await req.json();
    const { memberId, action } = body as { memberId: string; action: "suspend" | "reactivate" };

    if (!memberId || !action) {
      return NextResponse.json({ error: "Identifiant et action requis." }, { status: 400 });
    }

    if (action === "suspend") {
      const res = suspendMember(memberId, callerEmail || "Admin");
      if (!res.success) return NextResponse.json({ error: res.error }, { status: 400 });
      return NextResponse.json({
        success: true,
        message: "Membre suspendu. Toutes ses sessions ouvertes ont été immédiatement révoquées.",
      });
    } else if (action === "reactivate") {
      const res = reactivateMember(memberId, callerEmail || "Admin");
      if (!res.success) return NextResponse.json({ error: res.error }, { status: 400 });
      return NextResponse.json({ success: true, message: "Membre réactivé avec succès." });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const callerEmail = req.cookies.get("novika_user_email")?.value;
    const callerRole = req.cookies.get("novika_active_role")?.value;

    const isAuthorized = isOwnerEmail(callerEmail) || callerRole === "owner";
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Seul le propriétaire peut retirer un membre de l'équipe." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ error: "Identifiant du membre manquant." }, { status: 400 });
    }

    const result = removeMember(memberId, callerEmail || "Propriétaire");
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Membre retiré de l'équipe. L'historique des commandes a été conservé.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
