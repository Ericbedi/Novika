/**
 * Base de données des Pays Africains & Raccordement Devises / Fuseaux IANA / TVA
 * Couvre l'Afrique de l'Ouest, Centrale, de l'Est, Australe et du Nord.
 */

export interface AfricanCountry {
  code: string; // ISO 3166-1 alpha-2 (ex: TG, CI, SN, BJ)
  codeAlpha3: string; // ISO 3166-1 alpha-3 (ex: TGO, CIV, SEN, BEN)
  name: string; // Nom usuel en français
  flagEmoji: string; // Emoji drapeau
  currencyCode: string; // Code devise ISO 4217 (ex: XOF, XAF, GHS, NGN)
  phoneDialCode: string; // Indicatif téléphonique E.164 (ex: +228, +225)
  timezone: string; // Fuseau horaire IANA (ex: Africa/Lome, Africa/Abidjan)
  defaultVatRate: number; // Taux de TVA par défaut (en %, ex: 18 pour l'UEMOA)
  region: "west" | "central" | "east" | "southern" | "north";
  majorCities: string[]; // Villes principales pour les livraisons COD
}

export const AFRICAN_COUNTRIES: Record<string, AfricanCountry> = {
  // === AFRIQUE DE L'OUEST ===
  TG: {
    code: "TG",
    codeAlpha3: "TGO",
    name: "Togo",
    flagEmoji: "🇹🇬",
    currencyCode: "XOF",
    phoneDialCode: "+228",
    timezone: "Africa/Lome",
    defaultVatRate: 18,
    region: "west",
    majorCities: ["Lomé", "Kara", "Sokodé", "Kpalimé", "Atakpamé", "Dapaong"],
  },
  CI: {
    code: "CI",
    codeAlpha3: "CIV",
    name: "Côte d'Ivoire",
    flagEmoji: "🇨🇮",
    currencyCode: "XOF",
    phoneDialCode: "+225",
    timezone: "Africa/Abidjan",
    defaultVatRate: 18,
    region: "west",
    majorCities: ["Abidjan", "Bouaké", "Yamoussoukro", "San-Pédro", "Korhogo", "Daloa"],
  },
  SN: {
    code: "SN",
    codeAlpha3: "SEN",
    name: "Sénégal",
    flagEmoji: "🇸🇳",
    currencyCode: "XOF",
    phoneDialCode: "+221",
    timezone: "Africa/Dakar",
    defaultVatRate: 18,
    region: "west",
    majorCities: ["Dakar", "Thiès", "Saint-Louis", "Touba", "Mbour", "Ziguinchor"],
  },
  BJ: {
    code: "BJ",
    codeAlpha3: "BEN",
    name: "Bénin",
    flagEmoji: "🇧🇯",
    currencyCode: "XOF",
    phoneDialCode: "+229",
    timezone: "Africa/Porto-Novo",
    defaultVatRate: 18,
    region: "west",
    majorCities: ["Cotonou", "Porto-Novo", "Parakou", "Abomey-Calavi", "Bohicon", "Ouidah"],
  },
  BF: {
    code: "BF",
    codeAlpha3: "BFA",
    name: "Burkina Faso",
    flagEmoji: "🇧🇫",
    currencyCode: "XOF",
    phoneDialCode: "+226",
    timezone: "Africa/Ouagadougou",
    defaultVatRate: 18,
    region: "west",
    majorCities: ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Ouahigouya"],
  },
  ML: {
    code: "ML",
    codeAlpha3: "MLI",
    name: "Mali",
    flagEmoji: "🇲🇱",
    currencyCode: "XOF",
    phoneDialCode: "+223",
    timezone: "Africa/Bamako",
    defaultVatRate: 18,
    region: "west",
    majorCities: ["Bamako", "Sikasso", "Mopti", "Koutiala", "Kayes", "Ségou"],
  },
  NE: {
    code: "NE",
    codeAlpha3: "NER",
    name: "Niger",
    flagEmoji: "🇳🇪",
    currencyCode: "XOF",
    phoneDialCode: "+227",
    timezone: "Africa/Niamey",
    defaultVatRate: 19,
    region: "west",
    majorCities: ["Niamey", "Maradi", "Zinder", "Tahoua", "Agadez"],
  },
  GN: {
    code: "GN",
    codeAlpha3: "GIN",
    name: "Guinée (Conakry)",
    flagEmoji: "🇬🇳",
    currencyCode: "GNF",
    phoneDialCode: "+224",
    timezone: "Africa/Conakry",
    defaultVatRate: 18,
    region: "west",
    majorCities: ["Conakry", "Nzérékoré", "Kankan", "Kindia", "Labé"],
  },
  GH: {
    code: "GH",
    codeAlpha3: "GHA",
    name: "Ghana",
    flagEmoji: "🇬🇭",
    currencyCode: "GHS",
    phoneDialCode: "+233",
    timezone: "Africa/Accra",
    defaultVatRate: 15,
    region: "west",
    majorCities: ["Accra", "Kumasi", "Tamale", "Takoradi", "Tema", "Cape Coast"],
  },
  NG: {
    code: "NG",
    codeAlpha3: "NGA",
    name: "Nigéria",
    flagEmoji: "🇳🇬",
    currencyCode: "NGN",
    phoneDialCode: "+234",
    timezone: "Africa/Lagos",
    defaultVatRate: 7.5,
    region: "west",
    majorCities: ["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt", "Benin City"],
  },

  // === AFRIQUE CENTRALE ===
  CM: {
    code: "CM",
    codeAlpha3: "CMR",
    name: "Cameroun",
    flagEmoji: "🇨🇲",
    currencyCode: "XAF",
    phoneDialCode: "+237",
    timezone: "Africa/Douala",
    defaultVatRate: 19.25,
    region: "central",
    majorCities: ["Douala", "Yaoundé", "Garoua", "Bafoussam", "Bamenda", "Kribi"],
  },
  GA: {
    code: "GA",
    codeAlpha3: "GAB",
    name: "Gabon",
    flagEmoji: "🇬🇦",
    currencyCode: "XAF",
    phoneDialCode: "+241",
    timezone: "Africa/Libreville",
    defaultVatRate: 18,
    region: "central",
    majorCities: ["Libreville", "Port-Gentil", "Franceville", "Oyem", "Moanda"],
  },
  CG: {
    code: "CG",
    codeAlpha3: "COG",
    name: "Congo (Brazzaville)",
    flagEmoji: "🇨🇬",
    currencyCode: "XAF",
    phoneDialCode: "+242",
    timezone: "Africa/Brazzaville",
    defaultVatRate: 18,
    region: "central",
    majorCities: ["Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi"],
  },
  CD: {
    code: "CD",
    codeAlpha3: "COD",
    name: "RD Congo (Kinshasa)",
    flagEmoji: "🇨🇩",
    currencyCode: "CDF",
    phoneDialCode: "+243",
    timezone: "Africa/Kinshasa",
    defaultVatRate: 16,
    region: "central",
    majorCities: ["Kinshasa", "Lubumbashi", "Goma", "Kisangani", "Bukavu", "Mbuji-Mayi"],
  },
  TD: {
    code: "TD",
    codeAlpha3: "TCD",
    name: "Tchad",
    flagEmoji: "🇹🇩",
    currencyCode: "XAF",
    phoneDialCode: "+235",
    timezone: "Africa/Ndjamena",
    defaultVatRate: 18,
    region: "central",
    majorCities: ["N'Djaména", "Moundou", "Sarh", "Abéché"],
  },

  // === AFRIQUE DE L'EST ===
  KE: {
    code: "KE",
    codeAlpha3: "KEN",
    name: "Kenya",
    flagEmoji: "🇰🇪",
    currencyCode: "KES",
    phoneDialCode: "+254",
    timezone: "Africa/Nairobi",
    defaultVatRate: 16,
    region: "east",
    majorCities: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"],
  },
  RW: {
    code: "RW",
    codeAlpha3: "RWA",
    name: "Rwanda",
    flagEmoji: "🇷🇼",
    currencyCode: "RWF",
    phoneDialCode: "+250",
    timezone: "Africa/Kigali",
    defaultVatRate: 18,
    region: "east",
    majorCities: ["Kigali", "Gisenyi", "Butare", "Ruhengeri"],
  },
  TZ: {
    code: "TZ",
    codeAlpha3: "TZA",
    name: "Tanzanie",
    flagEmoji: "🇹🇿",
    currencyCode: "TZS",
    phoneDialCode: "+255",
    timezone: "Africa/Dar_es_Salaam",
    defaultVatRate: 18,
    region: "east",
    majorCities: ["Dar es Salaam", "Mwanza", "Arusha", "Dodoma", "Zanzibar City"],
  },
  UG: {
    code: "UG",
    codeAlpha3: "UGA",
    name: "Ouganda",
    flagEmoji: "🇺🇬",
    currencyCode: "UGX",
    phoneDialCode: "+256",
    timezone: "Africa/Kampala",
    defaultVatRate: 18,
    region: "east",
    majorCities: ["Kampala", "Entebbe", "Jinja", "Gulu", "Mbarara"],
  },

  // === AFRIQUE DU NORD ===
  MA: {
    code: "MA",
    codeAlpha3: "MAR",
    name: "Maroc",
    flagEmoji: "🇲🇦",
    currencyCode: "MAD",
    phoneDialCode: "+212",
    timezone: "Africa/Casablanca",
    defaultVatRate: 20,
    region: "north",
    majorCities: ["Casablanca", "Rabat", "Marrakech", "Tanger", "Fès", "Agadir"],
  },
  DZ: {
    code: "DZ",
    codeAlpha3: "DZA",
    name: "Algérie",
    flagEmoji: "🇩🇿",
    currencyCode: "DZD",
    phoneDialCode: "+213",
    timezone: "Africa/Algiers",
    defaultVatRate: 19,
    region: "north",
    majorCities: ["Alger", "Oran", "Constantine", "Annaba", "Blida"],
  },
  TN: {
    code: "TN",
    codeAlpha3: "TUN",
    name: "Tunisie",
    flagEmoji: "🇹🇳",
    currencyCode: "TND",
    phoneDialCode: "+216",
    timezone: "Africa/Tunis",
    defaultVatRate: 19,
    region: "north",
    majorCities: ["Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte"],
  },

  // === AFRIQUE AUSTRALE ===
  ZA: {
    code: "ZA",
    codeAlpha3: "ZAF",
    name: "Afrique du Sud",
    flagEmoji: "🇿🇦",
    currencyCode: "ZAR",
    phoneDialCode: "+27",
    timezone: "Africa/Johannesburg",
    defaultVatRate: 15,
    region: "southern",
    majorCities: ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Gqeberha"],
  },
};

/**
 * Récupère les métadonnées d'un pays par son code ISO 2
 */
export function getCountryByCode(code?: string | null): AfricanCountry {
  if (!code) return AFRICAN_COUNTRIES.TG;
  const upper = code.toUpperCase();
  return AFRICAN_COUNTRIES[upper] || AFRICAN_COUNTRIES.TG;
}

/**
 * Liste des pays classés pour les sélecteurs
 */
export const ALL_AFRICAN_COUNTRIES = Object.values(AFRICAN_COUNTRIES);
