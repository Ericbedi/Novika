import { CloserClosingStats, UtmCampaignStats } from "@/server/data/types";

export const MOCK_SALES_OVERVIEW = {
  grossSales: 4120000,
  discounts: 270000,
  returns: 180000,
  netSales: 3670000,
  averageOrderValue: 26850,
  deliveredOrders: 98,
  totalOrders: 248,
  salesByCategory: [
    { category: "Santé & Nutrition", revenue: 1710000, percentage: 46, orders: 114 },
    { category: "Beauté & Soins", revenue: 1170000, percentage: 32, orders: 78 },
    { category: "Fitness & Minceur", revenue: 780000, percentage: 21, orders: 52 },
    { category: "Autres accessoires", revenue: 460000, percentage: 12, orders: 34 },
  ],
  salesByCountry: [
    { country: "CI", countryName: "Côte d'Ivoire", flag: "🇨🇮", revenue: 1650000, orders: 104, deliveredRate: 88 },
    { country: "TG", countryName: "Togo", flag: "🇹🇬", revenue: 1240000, orders: 82, deliveredRate: 94 },
    { country: "SN", countryName: "Sénégal", flag: "🇸🇳", revenue: 760000, orders: 42, deliveredRate: 83 },
    { country: "BJ", countryName: "Bénin", flag: "🇧🇯", revenue: 470000, orders: 20, deliveredRate: 80 },
  ],
  salesByCity: [
    { city: "Abidjan", country: "CI", orders: 94, revenue: 1480000 },
    { city: "Lomé", country: "TG", orders: 82, revenue: 1240000 },
    { city: "Dakar", country: "SN", orders: 42, revenue: 760000 },
    { city: "Cotonou", country: "BJ", orders: 20, revenue: 470000 },
    { city: "Bouaké", country: "CI", orders: 10, revenue: 170000 },
  ],
};

export const MOCK_CLOSING_STATS: CloserClosingStats[] = [
  {
    closerId: "cls_01",
    closerName: "Aïcha Diallo",
    assignedOrders: 135,
    confirmedOrders: 131,
    confirmationRate: 97.0,
    deliveredOrders: 118,
    deliveryRate: 90.1,
    deliveredRevenue: 2980000,
  },
  {
    closerId: "cls_02",
    closerName: "Esther Lawson",
    assignedOrders: 85,
    confirmedOrders: 78,
    confirmationRate: 91.8,
    deliveredOrders: 69,
    deliveryRate: 88.5,
    deliveredRevenue: 1750000,
  },
  {
    closerId: "cls_03",
    closerName: "Mariam Coulibaly",
    assignedOrders: 28,
    confirmedOrders: 24,
    confirmationRate: 85.7,
    deliveredOrders: 20,
    deliveryRate: 83.3,
    deliveredRevenue: 510000,
  },
];

export const MOCK_UTM_CAMPAIGNS: UtmCampaignStats[] = [
  {
    campaign: "campagne_cafe_abidjan",
    source: "Facebook Ads",
    visitors: 4820,
    orders: 114,
    conversionRate: 2.36,
    revenue: 1710000,
    adSpend: 250000,
    roas: 6.84,
  },
  {
    campaign: "serum_glow_lome",
    source: "TikTok Ads",
    visitors: 2450,
    orders: 78,
    conversionRate: 3.18,
    revenue: 1170000,
    adSpend: 170000,
    roas: 6.88,
  },
  {
    campaign: "minceur_dakar_promo",
    source: "Facebook Ads",
    visitors: 1180,
    orders: 36,
    conversionRate: 3.05,
    revenue: 540000,
    adSpend: 95000,
    roas: 5.68,
  },
];

export const MOCK_LIVE_STATS = {
  currentVisitors: 47,
  activeCarts: 12,
  checkoutsInProgress: 5,
  liveLocations: [
    { city: "Abidjan", count: 21 },
    { city: "Lomé", count: 14 },
    { city: "Dakar", count: 8 },
    { city: "Cotonou", count: 4 },
  ],
};
