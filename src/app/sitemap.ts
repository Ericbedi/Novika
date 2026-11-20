import type { MetadataRoute } from "next";
import { MOCK_STORES } from "@/mock-data/stores";
import { getAllCustomDomainsGlobal } from "@/lib/custom-domains";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://novika-delta.vercel.app";
  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Parcourir les boutiques actives
  for (const store of MOCK_STORES) {
    // Si la boutique a un domaine personnalisé actif
    const allDomains = getAllCustomDomainsGlobal();
    const primary = allDomains.find((d) => d.storeSlug === store.slug && d.isPrimary && d.status === "active");

    const storeRoot = primary ? `https://${primary.domain}` : `${baseUrl}/boutique/${store.slug}`;

    // Vitrine 3 pages UNIQUEMENT (Prompt 21-b)
    sitemapEntries.push(
      {
        url: storeRoot,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
      },
      {
        url: `${storeRoot}/catalogue`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: `${storeRoot}/contact`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      }
    );
  }

  return sitemapEntries;
}
