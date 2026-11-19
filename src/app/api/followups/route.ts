import { NextRequest, NextResponse } from "next/server";
import { getMemoryFollowups } from "@/app/api/followups/outcome/route";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const closerId = searchParams.get("closerId");
    const role = searchParams.get("role") || "admin";

    let list = getMemoryFollowups();

    // Règle Prompt 05-RL : La closeuse ne voit que ses rappels
    if (role === "closer" && closerId) {
      list = list.filter((f) => f.assignedTo.id === closerId);
    }

    if (status) {
      list = list.filter((f) => f.status === status);
    }

    return NextResponse.json({
      success: true,
      followups: list,
      count: list.length,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
