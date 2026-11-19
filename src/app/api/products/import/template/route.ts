import { NextResponse } from "next/server";
import { NOVIKA_SAMPLE_TEMPLATE } from "@/lib/csv-import-engine";

export async function GET() {
  return new NextResponse(NOVIKA_SAMPLE_TEMPLATE, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="modele_import_produits_novika.csv"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
