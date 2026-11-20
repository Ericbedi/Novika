import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Les inscriptions publiques sont fermées. L'accès à la plateforme se fait uniquement sur invitation du propriétaire.",
      code: "SIGNUP_CLOSED",
    },
    { status: 403 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error: "Les inscriptions publiques sont fermées. L'accès à la plateforme se fait uniquement sur invitation du propriétaire.",
      code: "SIGNUP_CLOSED",
    },
    { status: 403 }
  );
}
