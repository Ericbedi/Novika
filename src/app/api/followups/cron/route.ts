import { NextRequest, NextResponse } from "next/server";
import { checkOverdueFollowups } from "@/lib/followups";
import { getMemoryFollowups, setMemoryFollowups } from "@/app/api/followups/outcome/route";

export async function GET(req: NextRequest) {
  try {
    const followups = getMemoryFollowups();
    const now = new Date();

    const report = checkOverdueFollowups(followups, now);

    // Mettre à jour les rappels expirés en mémoire
    if (report.expiredFollowups.length > 0) {
      const expiredIds = report.expiredFollowups.map((f) => f.id);
      const updated = followups.map((f) =>
        expiredIds.includes(f.id) ? { ...f, status: "expired" as const } : f
      );
      setMemoryFollowups(updated);
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      dueNowCount: report.dueNowCount,
      managerAlertCount: report.managerAlertFollowups.length,
      reassignableCount: report.reassignableFollowups.length,
      expiredCount: report.expiredFollowups.length,
      managerAlertIds: report.managerAlertFollowups.map((f) => f.id),
      reassignableIds: report.reassignableFollowups.map((f) => f.id),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
