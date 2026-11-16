import { NextRequest, NextResponse } from "next/server";

interface ZoneCheckRequest {
  country?: string;
  query?: string;
  address?: string;
  coords?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

interface KnownZone {
  id: string;
  name: string;
  aliases: string[];
  type: "local" | "shipping" | "unserved";
  delay: string;
  country: string;
  center?: { lat: number; lng: number };
  radiusKm?: number;
}

// Répertoire des zones connues
const KNOWN_ZONES: KnownZone[] = [
  // Togo (TG)
  {
    id: "zone-tg-lome",
    name: "Lomé",
    aliases: ["lome", "agoe", "agoe-nyive", "be", "adidogome", "baguida", "totsi", "kegue", "hedzranawoe", "tokoin"],
    type: "local",
    delay: "Aujourd'hui ou demain",
    country: "TG",
    center: { lat: 6.1375, lng: 1.2125 },
    radiusKm: 25,
  },
  {
    id: "zone-tg-kara",
    name: "Kara",
    aliases: ["kara", "lama-kara", "kozah"],
    type: "shipping",
    delay: "48h à 72h · point de retrait confirmé par téléphone",
    country: "TG",
    center: { lat: 9.5511, lng: 1.1861 },
    radiusKm: 20,
  },
  {
    id: "zone-tg-sokode",
    name: "Sokodé",
    aliases: ["sokode", "tchaoudjo"],
    type: "shipping",
    delay: "48h à 72h · point de retrait confirmé par téléphone",
    country: "TG",
    center: { lat: 8.9833, lng: 1.1333 },
    radiusKm: 20,
  },
  {
    id: "zone-tg-bassar",
    name: "Bassar",
    aliases: ["bassar"],
    type: "unserved",
    delay: "",
    country: "TG",
    center: { lat: 9.25, lng: 0.7833 },
    radiusKm: 15,
  },
  // Côte d'Ivoire (CI)
  {
    id: "zone-ci-abidjan",
    name: "Abidjan",
    aliases: ["abidjan", "cocody", "yopougon", "marcory", "plateau", "treichville", "koumassi", "abobo", "riviera", "deux plateaux"],
    type: "local",
    delay: "Aujourd'hui ou demain",
    country: "CI",
    center: { lat: 5.36, lng: -4.0083 },
    radiusKm: 35,
  },
  // Bénin (BJ)
  {
    id: "zone-bj-cotonou",
    name: "Cotonou",
    aliases: ["cotonou", "haie vive", "cadjehoun", "akpakpa", "menontin", "fidjrosse", "maro-militaire"],
    type: "local",
    delay: "Aujourd'hui ou demain",
    country: "BJ",
    center: { lat: 6.3703, lng: 2.3912 },
    radiusKm: 25,
  },
  // Sénégal (SN)
  {
    id: "zone-sn-dakar",
    name: "Dakar",
    aliases: ["dakar", "plateau", "almadies", "mermoz", "yoff", "ouakam", "maristes", "parcelles"],
    type: "local",
    delay: "Aujourd'hui ou demain",
    country: "SN",
    center: { lat: 14.7167, lng: -17.4677 },
    radiusKm: 30,
  },
];

// Nettoyage et normalisation du texte
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime accents
    .replace(/[^\w\s-]/g, " ")       // Supprime ponctuation
    .replace(/\b(quartier|ville de|pres de|commune de|district de|region de)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Distance de Levenshtein simple pour suggestion
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export async function POST(req: NextRequest) {
  try {
    const body: ZoneCheckRequest = await req.json();
    const { country = "TG", query = "", coords } = body;

    const cleanInput = normalizeText(query);

    // Filtrer par pays si renseigné
    const zonesInCountry = KNOWN_ZONES.filter((z) => !country || z.country === country);

    // 1. Recherche par texte exact ou alias
    if (cleanInput.length >= 2) {
      for (const zone of zonesInCountry) {
        if (
          normalizeText(zone.name) === cleanInput ||
          zone.aliases.some((alias) => normalizeText(alias) === cleanInput || cleanInput.includes(normalizeText(alias)))
        ) {
          if (zone.type === "unserved") {
            return NextResponse.json({
              status: "unserved",
              zoneName: zone.name,
              message: "Cette zone n'est pas desservie pour le moment.",
            });
          }
          if (zone.type === "shipping") {
            return NextResponse.json({
              status: "shipping",
              zoneName: zone.name,
              delay: zone.delay,
              message: `Livraison gratuite par expédition · ${zone.delay}`,
            });
          }
          return NextResponse.json({
            status: "local",
            zoneName: zone.name,
            delay: zone.delay,
            message: `Livraison gratuite à domicile · ${zone.delay}`,
          });
        }
      }

      // 2. Recherche par proximité / faute de frappe pour suggestion (ex: "kra" -> "Kara")
      let bestCandidate: KnownZone | null = null;
      let minDistance = 999;

      for (const zone of zonesInCountry) {
        const normName = normalizeText(zone.name);
        const dist = levenshteinDistance(cleanInput, normName);
        if (dist <= 2 && dist < minDistance) {
          minDistance = dist;
          bestCandidate = zone;
        }
      }

      if (bestCandidate) {
        return NextResponse.json({
          status: "unknown",
          suggestion: bestCandidate.name,
          message: "Nous confirmerons votre zone de livraison par téléphone. Vous pouvez commander.",
        });
      }
    }

    // 3. Signal de coordonnées (si fourni sans texte reconnu)
    if (coords && coords.latitude && coords.longitude) {
      // Coordonnées traitées temporairement sans jamais être journalisées ni enregistrées
      const lat = coords.latitude;
      const lng = coords.longitude;

      for (const zone of zonesInCountry) {
        if (zone.center && zone.radiusKm) {
          // Approximation distance haversine
          const dLat = (zone.center.lat - lat) * 111;
          const dLng = (zone.center.lng - lng) * 111 * Math.cos((lat * Math.PI) / 180);
          const distKm = Math.sqrt(dLat * dLat + dLng * dLng);

          if (distKm <= zone.radiusKm) {
            return NextResponse.json({
              status: zone.type === "unserved" ? "unserved" : zone.type,
              zoneName: zone.name,
              delay: zone.delay,
              suggestion: zone.name,
              message:
                zone.type === "local"
                  ? `Vous semblez être à ${zone.name}. Livraison gratuite à domicile · ${zone.delay}`
                  : `Vous semblez être à ${zone.name}.`,
            });
          }
        }
      }
    }

    // 4. Par défaut : Zone non reconnue (acceptée pour confirmation par la closeuse)
    return NextResponse.json({
      status: "unknown",
      message: "Nous confirmerons votre zone de livraison par téléphone. Vous pouvez commander.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unknown",
        message: "Nous confirmerons votre zone de livraison par téléphone. Vous pouvez commander.",
      },
      { status: 200 } // Ne bloque jamais la commande en cas d'erreur réseau
    );
  }
}
