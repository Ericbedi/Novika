import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, shopSlug, userRole, count, details, timestamp } = body || {};

    console.info(
      `[AUDIT] [${timestamp || new Date().toISOString()}] shop=${shopSlug} role=${userRole} action=${action} count=${count} details="${details}"`
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
