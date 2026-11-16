import {
  Carrier,
  CityZoneConfig,
  SellerPaymentMethod,
  PaymentProof,
} from "@/server/data/shipping-zone-types";

export const MOCK_CARRIERS: Carrier[] = [
  {
    id: "carrier_utb",
    name: "UTB Relais Express",
    whatsapp: "+22890112233",
    phone: "+22822212345",
    supportedPaymentModes: ["prepaid"],
    averageDeliveryDays: "3 à 5 jours",
    sellerReferenceRate: 2500,
    pickupPoints: [
      {
        id: "pt_utb_kara",
        carrierId: "carrier_utb",
        name: "Agence UTB Kara Centre",
        city: "Kara",
        address: "Grand Marché de Kara, face BCEAO",
        phone: "+22891223344",
        openingHours: "Lun - Sam : 07h00 - 18h30",
      },
      {
        id: "pt_utb_sokode",
        carrierId: "carrier_utb",
        name: "Agence UTB Sokodé Gare",
        city: "Sokodé",
        address: "Carrefour Didaoure, Route Nationale 1",
        phone: "+22891334455",
        openingHours: "Lun - Sam : 07h00 - 18h00",
      },
      {
        id: "pt_utb_kpalime",
        carrierId: "carrier_utb",
        name: "Agence UTB Kpalimé Château",
        city: "Kpalimé",
        address: "Avenue du 13 Janvier",
        phone: "+22891445566",
        openingHours: "Lun - Sam : 07h30 - 18h00",
      },
      {
        id: "pt_utb_dapaong",
        carrierId: "carrier_utb",
        name: "Agence UTB Dapaong Ville",
        city: "Dapaong",
        address: "Boulevard Circulaire, près de la Poste",
        phone: "+22891556677",
        openingHours: "Lun - Sam : 08h00 - 17h30",
      },
    ],
  },
  {
    id: "carrier_laposte_tg",
    name: "La Poste du Togo (ColiPoste)",
    whatsapp: "+22890445566",
    phone: "+22822214400",
    supportedPaymentModes: ["prepaid", "cod_pickup"],
    averageDeliveryDays: "48h à 72h",
    sellerReferenceRate: 2000,
    pickupPoints: [
      {
        id: "pt_poste_atakpame",
        carrierId: "carrier_laposte_tg",
        name: "Hôtel des Postes Atakpamé",
        city: "Atakpamé",
        address: "Place de la Mairie",
        phone: "+22892334411",
        openingHours: "Lun - Ven : 08h00 - 16h30",
      },
    ],
  },
];

export const MOCK_CITY_ZONES: CityZoneConfig[] = [
  // TOGO (TG)
  {
    city: "Lomé",
    countryCode: "TG",
    zoneType: "local",
    paymentMode: "cod",
    estimatedDeliveryTime: "24h à 48h",
    sellerCost: 1000,
    clientDeliveryFee: 0,
  },
  {
    city: "Lomé (Banlieue)",
    countryCode: "TG",
    zoneType: "local",
    paymentMode: "cod",
    estimatedDeliveryTime: "24h à 48h",
    sellerCost: 1500,
    clientDeliveryFee: 0,
  },
  {
    city: "Kara",
    countryCode: "TG",
    zoneType: "expedition",
    paymentMode: "prepaid",
    carrierId: "carrier_utb",
    defaultPickupPointId: "pt_utb_kara",
    estimatedDeliveryTime: "3 à 5 jours",
    sellerCost: 2500,
    clientDeliveryFee: 0,
  },
  {
    city: "Sokodé",
    countryCode: "TG",
    zoneType: "expedition",
    paymentMode: "prepaid",
    carrierId: "carrier_utb",
    defaultPickupPointId: "pt_utb_sokode",
    estimatedDeliveryTime: "3 à 5 jours",
    sellerCost: 2500,
    clientDeliveryFee: 0,
  },
  {
    city: "Kpalimé",
    countryCode: "TG",
    zoneType: "expedition",
    paymentMode: "prepaid",
    carrierId: "carrier_utb",
    defaultPickupPointId: "pt_utb_kpalime",
    estimatedDeliveryTime: "3 à 4 jours",
    sellerCost: 2000,
    clientDeliveryFee: 0,
  },
  {
    city: "Atakpamé",
    countryCode: "TG",
    zoneType: "expedition",
    paymentMode: "prepaid",
    carrierId: "carrier_laposte_tg",
    defaultPickupPointId: "pt_poste_atakpame",
    estimatedDeliveryTime: "3 à 4 jours",
    sellerCost: 2000,
    clientDeliveryFee: 0,
  },
  {
    city: "Dapaong",
    countryCode: "TG",
    zoneType: "expedition",
    paymentMode: "prepaid",
    carrierId: "carrier_utb",
    defaultPickupPointId: "pt_utb_dapaong",
    estimatedDeliveryTime: "4 à 6 jours",
    sellerCost: 3000,
    clientDeliveryFee: 0,
  },
  {
    city: "Bassar (Non desservie)",
    countryCode: "TG",
    zoneType: "not_served",
    paymentMode: "prepaid",
    estimatedDeliveryTime: "Non desservie",
    sellerCost: 0,
    clientDeliveryFee: 0,
  },

  // CÔTE D'IVOIRE (CI)
  {
    city: "Abidjan",
    countryCode: "CI",
    zoneType: "local",
    paymentMode: "cod",
    estimatedDeliveryTime: "24h à 48h",
    sellerCost: 1500,
    clientDeliveryFee: 0,
  },
  {
    city: "Abidjan (Périphérie)",
    countryCode: "CI",
    zoneType: "local",
    paymentMode: "cod",
    estimatedDeliveryTime: "24h à 48h",
    sellerCost: 2000,
    clientDeliveryFee: 0,
  },
  {
    city: "Bouaké",
    countryCode: "CI",
    zoneType: "expedition",
    paymentMode: "prepaid",
    estimatedDeliveryTime: "3 à 5 jours",
    sellerCost: 3000,
    clientDeliveryFee: 0,
  },
  {
    city: "Yamoussoukro",
    countryCode: "CI",
    zoneType: "expedition",
    paymentMode: "prepaid",
    estimatedDeliveryTime: "3 à 4 jours",
    sellerCost: 2500,
    clientDeliveryFee: 0,
  },
  {
    city: "San-Pédro",
    countryCode: "CI",
    zoneType: "expedition",
    paymentMode: "prepaid",
    estimatedDeliveryTime: "3 à 5 jours",
    sellerCost: 3500,
    clientDeliveryFee: 0,
  },
  {
    city: "Odienné (Non desservie)",
    countryCode: "CI",
    zoneType: "not_served",
    paymentMode: "prepaid",
    estimatedDeliveryTime: "Non desservie",
    sellerCost: 0,
    clientDeliveryFee: 0,
  },
];

export const MOCK_SELLER_PAYMENT_METHODS: SellerPaymentMethod[] = [
  {
    id: "pm_tmoney",
    provider: "tmoney",
    providerName: "T-Money (Togocom)",
    accountNumber: "+228 90 12 34 56",
    accountName: "Lomé Glow SARL (Promises Bedi)",
    instructions: "Tapez *145# puis option 1 (Envoi d'argent). Gardez le SMS pour le numéro de transaction.",
    isActive: true,
  },
  {
    id: "pm_flooz",
    provider: "flooz",
    providerName: "Flooz (Moov Africa)",
    accountNumber: "+228 99 88 77 66",
    accountName: "Lomé Glow Cosmétiques",
    instructions: "Tapez *155# puis option 1. Renseignez la référence de transaction après l'envoi.",
    isActive: true,
  },
  {
    id: "pm_wave",
    provider: "wave",
    providerName: "Wave Mobile Money",
    accountNumber: "+225 07 48 29 11 02",
    accountName: "AfriBuilder Ventes",
    instructions: "Scannez le code QR ou transférez directement au numéro indiqué sans frais.",
    isActive: true,
  },
];

export const MOCK_PAYMENT_PROOFS: PaymentProof[] = [
  {
    id: "proof_01",
    orderId: "ord_kara_001",
    orderNumber: "CMD-2026-9042",
    transactionReference: "TXN-TMONEY-9823145",
    paymentMethod: "tmoney",
    senderName: "Essi Koffi",
    senderPhone: "+22890554433",
    amount: 14500,
    currency: "XOF",
    status: "verified",
    verifiedAt: "2026-11-15T14:30:00Z",
    verifiedBy: "Promises Bedi",
    submittedAt: "2026-11-15T12:15:00Z",
  },
  {
    id: "proof_02",
    orderId: "ord_sokode_002",
    orderNumber: "CMD-2026-8812",
    transactionReference: "TXN-FLOOZ-4412903",
    paymentMethod: "flooz",
    senderName: "Mamadou Sylla",
    senderPhone: "+22899112233",
    amount: 22000,
    currency: "XOF",
    status: "pending_verification",
    submittedAt: "2026-11-15T18:45:00Z",
  },
];

export function getZoneByCity(cityName: string, countryCode = "TG"): CityZoneConfig | undefined {
  return MOCK_CITY_ZONES.find(
    (z) =>
      z.city.toLowerCase() === cityName.toLowerCase() &&
      z.countryCode.toUpperCase() === countryCode.toUpperCase()
  );
}

export function getCarrierById(id: string): Carrier | undefined {
  return MOCK_CARRIERS.find((c) => c.id === id);
}

export function getPickupPointById(pointId: string): { carrier?: Carrier; point?: Carrier["pickupPoints"][0] } {
  for (const c of MOCK_CARRIERS) {
    const pt = c.pickupPoints.find((p) => p.id === pointId);
    if (pt) return { carrier: c, point: pt };
  }
  return {};
}
