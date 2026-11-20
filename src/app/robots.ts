import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/boutique/"],
        disallow: [
          "/",
          "/app/",
          "/connexion",
          "/inscription",
          "/rejoindre",
          "/invitation/",
          "/api/",
          "/auth/",
        ],
      },
    ],
  };
}
