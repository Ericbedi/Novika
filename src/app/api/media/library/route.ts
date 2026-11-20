import { NextRequest, NextResponse } from "next/server";
import { getShopMediaItems, getShopStorageUsage } from "@/lib/media-storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeSlug = searchParams.get("storeSlug") || "lome-glow";
    const searchQuery = searchParams.get("search")?.toLowerCase().trim() || "";
    const filterUsage = searchParams.get("usage"); // "used", "unused", "all"

    let items = getShopMediaItems(storeSlug);

    // Initialisation avec des visuels de mock si la médiathèque est encore vide pour la démo
    if (items.length === 0) {
      items = [
        {
          id: "med_seed_01",
          storeSlug,
          url: "/products/serum-eclat.png",
          originalName: "serum-eclat-100ml.png",
          mimeType: "image/png",
          sizeBytes: 142000,
          altText: "Sérum Éclat Visage",
          usageCount: 2,
          usedIn: [{ type: "product", id: "prod_02", title: "Sérum Éclat" }],
          createdAt: new Date().toISOString(),
        },
        {
          id: "med_seed_02",
          storeSlug,
          url: "/products/mushroom-coffee.png",
          originalName: "mushroom-coffee-bio.png",
          mimeType: "image/png",
          sizeBytes: 215000,
          altText: "Café aux Champignons Adaptogènes",
          usageCount: 1,
          usedIn: [{ type: "product", id: "prod_01", title: "Mushroom Coffee" }],
          createdAt: new Date().toISOString(),
        },
        {
          id: "med_seed_03",
          storeSlug,
          url: "/products/ceinture.png",
          originalName: "ceinture-cuir.png",
          mimeType: "image/png",
          sizeBytes: 98000,
          altText: "Ceinture en Cuir",
          usageCount: 1,
          usedIn: [{ type: "product", id: "prod_03", title: "Ceinture Cuir" }],
          createdAt: new Date().toISOString(),
        },
      ];
    }

    if (searchQuery) {
      items = items.filter(
        (m) =>
          m.originalName.toLowerCase().includes(searchQuery) ||
          (m.altText && m.altText.toLowerCase().includes(searchQuery))
      );
    }

    if (filterUsage === "used") {
      items = items.filter((m) => m.usageCount > 0);
    } else if (filterUsage === "unused") {
      items = items.filter((m) => m.usageCount === 0);
    }

    const quota = getShopStorageUsage(storeSlug);

    return NextResponse.json({
      success: true,
      items,
      quota: {
        usedBytes: quota.totalBytes || 455000,
        maxBytes: 1024 * 1024 * 1024, // 1 Go
        totalItems: items.length,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
