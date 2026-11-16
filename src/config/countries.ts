/**
 * Source unique de vérité des 54 pays d'Afrique pour la plateforme Novika / AfriBuilder.
 * Conforme à la spécification Prompt 05-P :
 * - Codes ISO 3166-1 alpha-2
 * - Noms officiels en français
 * - Devises ISO 4217 (XOF, XAF, NGN, GHS, KES, etc. - XOF et XAF strictement distincts)
 * - Indicatifs téléphoniques E.164
 * - Tri alphabétique français avec gestion des accents via Intl.Collator('fr', { sensitivity: 'base' })
 * - Recherche insensible à la casse et aux accents
 */

export interface AfricanCountryConfig {
  code: string; // ISO 3166-1 alpha-2 (ex: TG, CI, SN, BJ, etc.)
  name: string; // Nom en français (ex: "Côte d'Ivoire", "Égypte")
  currency: string; // ISO 4217 (ex: "XOF", "XAF", "NGN", "GHS", "MAD")
  dialCode: string; // Indicatif E.164 (ex: "+225", "+228", "+221")
  region: "west" | "central" | "east" | "southern" | "north";
  defaultVatRate?: number; // Taux de TVA indicatif
  platformEligible: boolean; // Si supporté au niveau plateforme Novika
  majorCities?: string[];
}

export const ALL_54_AFRICAN_COUNTRIES: AfricanCountryConfig[] = [
  // Afrique du Sud
  { code: "ZA", name: "Afrique du Sud", currency: "ZAR", dialCode: "+27", region: "southern", platformEligible: true, majorCities: ["Johannesburg", "Le Cap", "Durban"] },
  // Algérie
  { code: "DZ", name: "Algérie", currency: "DZD", dialCode: "+213", region: "north", platformEligible: true, majorCities: ["Alger", "Oran", "Constantine"] },
  // Angola
  { code: "AO", name: "Angola", currency: "AOA", dialCode: "+244", region: "central", platformEligible: true, majorCities: ["Luanda", "Huambo", "Lobito"] },
  // Bénin
  { code: "BJ", name: "Bénin", currency: "XOF", dialCode: "+229", region: "west", platformEligible: true, defaultVatRate: 18, majorCities: ["Cotonou", "Porto-Novo", "Parakou", "Abomey-Calavi"] },
  // Botswana
  { code: "BW", name: "Botswana", currency: "BWP", dialCode: "+267", region: "southern", platformEligible: true, majorCities: ["Gaborone", "Francistown"] },
  // Burkina Faso
  { code: "BF", name: "Burkina Faso", currency: "XOF", dialCode: "+226", region: "west", platformEligible: true, defaultVatRate: 18, majorCities: ["Ouagadougou", "Bobo-Dioulasso", "Koudougou"] },
  // Burundi
  { code: "BI", name: "Burundi", currency: "BIF", dialCode: "+257", region: "east", platformEligible: true, majorCities: ["Bujumbura", "Gitega"] },
  // Cameroun
  { code: "CM", name: "Cameroun", currency: "XAF", dialCode: "+237", region: "central", platformEligible: true, defaultVatRate: 19.25, majorCities: ["Douala", "Yaoundé", "Bafoussam", "Garoua"] },
  // Cap-Vert
  { code: "CV", name: "Cap-Vert", currency: "CVE", dialCode: "+238", region: "west", platformEligible: true, majorCities: ["Praia", "Mindelo"] },
  // République centrafricaine
  { code: "CF", name: "République centrafricaine", currency: "XAF", dialCode: "+236", region: "central", platformEligible: false, majorCities: ["Bangui", "Bimbo"] },
  // Comores
  { code: "KM", name: "Comores", currency: "KMF", dialCode: "+269", region: "east", platformEligible: true, majorCities: ["Moroni", "Mutsamudu"] },
  // République du Congo
  { code: "CG", name: "République du Congo", currency: "XAF", dialCode: "+242", region: "central", platformEligible: true, defaultVatRate: 18, majorCities: ["Brazzaville", "Pointe-Noire"] },
  // République démocratique du Congo
  { code: "CD", name: "République démocratique du Congo", currency: "CDF", dialCode: "+243", region: "central", platformEligible: true, defaultVatRate: 16, majorCities: ["Kinshasa", "Lubumbashi", "Goma"] },
  // Côte d'Ivoire
  { code: "CI", name: "Côte d'Ivoire", currency: "XOF", dialCode: "+225", region: "west", platformEligible: true, defaultVatRate: 18, majorCities: ["Abidjan", "Bouaké", "Yamoussoukro", "San-Pédro"] },
  // Djibouti
  { code: "DJ", name: "Djibouti", currency: "DJF", dialCode: "+253", region: "east", platformEligible: true, majorCities: ["Djibouti", "Ali Sabieh"] },
  // Égypte
  { code: "EG", name: "Égypte", currency: "EGP", dialCode: "+20", region: "north", platformEligible: true, majorCities: ["Le Caire", "Alexandrie", "Gizeh"] },
  // Érythrée
  { code: "ER", name: "Érythrée", currency: "ERN", dialCode: "+291", region: "east", platformEligible: false, majorCities: ["Asmara", "Keren"] },
  // Eswatini
  { code: "SZ", name: "Eswatini", currency: "SZL", dialCode: "+268", region: "southern", platformEligible: true, majorCities: ["Mbabane", "Manzini"] },
  // Éthiopie
  { code: "ET", name: "Éthiopie", currency: "ETB", dialCode: "+251", region: "east", platformEligible: true, majorCities: ["Addis-Abeba", "Dire Dawa", "Hawassa"] },
  // Gabon
  { code: "GA", name: "Gabon", currency: "XAF", dialCode: "+241", region: "central", platformEligible: true, defaultVatRate: 18, majorCities: ["Libreville", "Port-Gentil", "Franceville"] },
  // Gambie
  { code: "GM", name: "Gambie", currency: "GMD", dialCode: "+220", region: "west", platformEligible: true, majorCities: ["Banjul", "Serekunda"] },
  // Ghana
  { code: "GH", name: "Ghana", currency: "GHS", dialCode: "+233", region: "west", platformEligible: true, defaultVatRate: 15, majorCities: ["Accra", "Kumasi", "Tamale", "Takoradi"] },
  // Guinée
  { code: "GN", name: "Guinée", currency: "GNF", dialCode: "+224", region: "west", platformEligible: true, defaultVatRate: 18, majorCities: ["Conakry", "Nzérékoré", "Kankan", "Kindia"] },
  // Guinée-Bissau
  { code: "GW", name: "Guinée-Bissau", currency: "XOF", dialCode: "+245", region: "west", platformEligible: true, defaultVatRate: 18, majorCities: ["Bissau", "Bafatá"] },
  // Guinée équatoriale
  { code: "GQ", name: "Guinée équatoriale", currency: "XAF", dialCode: "+240", region: "central", platformEligible: true, majorCities: ["Malabo", "Bata"] },
  // Kenya
  { code: "KE", name: "Kenya", currency: "KES", dialCode: "+254", region: "east", platformEligible: true, defaultVatRate: 16, majorCities: ["Nairobi", "Mombasa", "Kisumu"] },
  // Lesotho
  { code: "LS", name: "Lesotho", currency: "LSL", dialCode: "+266", region: "southern", platformEligible: true, majorCities: ["Maseru", "Teyateyaneng"] },
  // Libéria
  { code: "LR", name: "Libéria", currency: "LRD", dialCode: "+231", region: "west", platformEligible: true, majorCities: ["Monrovia", "Gbarnga"] },
  // Libye
  { code: "LY", name: "Libye", currency: "LYD", dialCode: "+218", region: "north", platformEligible: false, majorCities: ["Tripoli", "Benghazi", "Misrata"] },
  // Madagascar
  { code: "MG", name: "Madagascar", currency: "MGA", dialCode: "+261", region: "east", platformEligible: true, majorCities: ["Antananarivo", "Toamasina", "Antsirabe"] },
  // Malawi
  { code: "MW", name: "Malawi", currency: "MWK", dialCode: "+265", region: "east", platformEligible: true, majorCities: ["Lilongwe", "Blantyre"] },
  // Mali
  { code: "ML", name: "Mali", currency: "XOF", dialCode: "+223", region: "west", platformEligible: true, defaultVatRate: 18, majorCities: ["Bamako", "Sikasso", "Mopti", "Ségou"] },
  // Maroc
  { code: "MA", name: "Maroc", currency: "MAD", dialCode: "+212", region: "north", platformEligible: true, defaultVatRate: 20, majorCities: ["Casablanca", "Rabat", "Marrakech", "Tanger"] },
  // Maurice
  { code: "MU", name: "Maurice", currency: "MUR", dialCode: "+230", region: "east", platformEligible: true, majorCities: ["Port-Louis", "Beau Bassin-Rose Hill"] },
  // Mauritanie
  { code: "MR", name: "Mauritanie", currency: "MRU", dialCode: "+222", region: "west", platformEligible: true, majorCities: ["Nouakchott", "Nouadhibou"] },
  // Mozambique
  { code: "MZ", name: "Mozambique", currency: "MZN", dialCode: "+258", region: "southern", platformEligible: true, majorCities: ["Maputo", "Matola", "Beira"] },
  // Namibie
  { code: "NA", name: "Namibie", currency: "NAD", dialCode: "+264", region: "southern", platformEligible: true, majorCities: ["Windhoek", "Walvis Bay"] },
  // Niger
  { code: "NE", name: "Niger", currency: "XOF", dialCode: "+227", region: "west", platformEligible: true, defaultVatRate: 19, majorCities: ["Niamey", "Maradi", "Zinder"] },
  // Nigéria
  { code: "NG", name: "Nigéria", currency: "NGN", dialCode: "+234", region: "west", platformEligible: true, defaultVatRate: 7.5, majorCities: ["Lagos", "Abuja", "Kano", "Ibadan"] },
  // Ouganda
  { code: "UG", name: "Ouganda", currency: "UGX", dialCode: "+256", region: "east", platformEligible: true, majorCities: ["Kampala", "Entebbe", "Jinja"] },
  // Rwanda
  { code: "RW", name: "Rwanda", currency: "RWF", dialCode: "+250", region: "east", platformEligible: true, defaultVatRate: 18, majorCities: ["Kigali", "Butare", "Gisenyi"] },
  // Sao Tomé-et-Principe
  { code: "ST", name: "Sao Tomé-et-Principe", currency: "STN", dialCode: "+239", region: "central", platformEligible: false, majorCities: ["São Tomé"] },
  // Sénégal
  { code: "SN", name: "Sénégal", currency: "XOF", dialCode: "+221", region: "west", platformEligible: true, defaultVatRate: 18, majorCities: ["Dakar", "Thiès", "Saint-Louis", "Touba", "Mbour"] },
  // Seychelles
  { code: "SC", name: "Seychelles", currency: "SCR", dialCode: "+248", region: "east", platformEligible: true, majorCities: ["Victoria"] },
  // Sierra Leone
  { code: "SL", name: "Sierra Leone", currency: "SLE", dialCode: "+232", region: "west", platformEligible: true, majorCities: ["Freetown", "Bo", "Kenema"] },
  // Somalie
  { code: "SO", name: "Somalie", currency: "SOS", dialCode: "+252", region: "east", platformEligible: false, majorCities: ["Mogadiscio", "Hargeisa"] },
  // Soudan
  { code: "SD", name: "Soudan", currency: "SDG", dialCode: "+249", region: "north", platformEligible: false, majorCities: ["Khartoum", "Omdurman"] },
  // Soudan du Sud
  { code: "SS", name: "Soudan du Sud", currency: "SSP", dialCode: "+211", region: "east", platformEligible: false, majorCities: ["Djouba", "Wau"] },
  // Tanzanie
  { code: "TZ", name: "Tanzanie", currency: "TZS", dialCode: "+255", region: "east", platformEligible: true, majorCities: ["Dar es Salaam", "Dodoma", "Mwanza", "Arusha"] },
  // Tchad
  { code: "TD", name: "Tchad", currency: "XAF", dialCode: "+235", region: "central", platformEligible: true, defaultVatRate: 18, majorCities: ["N'Djaména", "Moundou", "Sarh"] },
  // Togo
  { code: "TG", name: "Togo", currency: "XOF", dialCode: "+228", region: "west", platformEligible: true, defaultVatRate: 18, majorCities: ["Lomé", "Kara", "Sokodé", "Kpalimé", "Atakpamé", "Dapaong"] },
  // Tunisie
  { code: "TN", name: "Tunisie", currency: "TND", dialCode: "+216", region: "north", platformEligible: true, defaultVatRate: 19, majorCities: ["Tunis", "Sfax", "Sousse"] },
  // Zambie
  { code: "ZM", name: "Zambie", currency: "ZMW", dialCode: "+260", region: "southern", platformEligible: true, majorCities: ["Lusaka", "Kitwe", "Ndola"] },
  // Zimbabwe
  { code: "ZW", name: "Zimbabwe", currency: "ZWG", dialCode: "+263", region: "southern", platformEligible: true, majorCities: ["Harare", "Bulawayo"] },
];

/**
 * Collator français configuré selon les exigences de Prompt 05-P.
 * sensitivity: 'base' ignore la casse et les diacritiques (accents) pour le classement alphabétique naturel :
 * ex : Algérie -> Bénin -> Burkina Faso -> Côte d'Ivoire -> Égypte -> Érythrée -> Éthiopie -> Sénégal -> Togo
 */
export const frenchCollator = new Intl.Collator("fr", { sensitivity: "base" });

/**
 * Retourne la liste des 54 pays d'Afrique triés par ordre alphabétique français.
 * Le Togo n'est plus forcé en première position (Prompt 05-P #2).
 */
export function getSortedAfricanCountries(): AfricanCountryConfig[] {
  return [...ALL_54_AFRICAN_COUNTRIES].sort((a, b) => frenchCollator.compare(a.name, b.name));
}

/**
 * Map indexée par code ISO alpha-2
 */
export const AFRICAN_COUNTRIES_BY_CODE: Record<string, AfricanCountryConfig> = Object.fromEntries(
  ALL_54_AFRICAN_COUNTRIES.map((c) => [c.code, c])
);

/**
 * Récupère un pays par son code ISO (insensible à la casse)
 */
export function getCountryByCode(code?: string): AfricanCountryConfig | undefined {
  if (!code) return undefined;
  return AFRICAN_COUNTRIES_BY_CODE[code.toUpperCase()];
}

/**
 * Normalise une chaîne en retirant accents et majuscules pour recherche rapide
 */
export function normalizeSearchString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Filtre les pays par recherche textuelle (nom, code ISO, devise ou indicatif)
 * Insensible à la casse et aux accents.
 */
export function searchAfricanCountries(
  query: string,
  countries: AfricanCountryConfig[] = getSortedAfricanCountries()
): AfricanCountryConfig[] {
  const q = normalizeSearchString(query);
  if (!q) return countries;

  return countries.filter((c) => {
    const matchName = normalizeSearchString(c.name).includes(q);
    const matchCode = c.code.toLowerCase().includes(q);
    const matchCurrency = c.currency.toLowerCase().includes(q);
    const matchDial = c.dialCode.replace("+", "").includes(q.replace("+", ""));
    const matchCity = c.majorCities?.some((city) => normalizeSearchString(city).includes(q));
    return matchName || matchCode || matchCurrency || matchDial || Boolean(matchCity);
  });
}
