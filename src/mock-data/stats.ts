import { CloserClosingStats, UtmCampaignStats } from "@/server/data/types";

export const MOCK_SALES_OVERVIEW = {
  grossSales: 0,
  discounts: 0,
  returns: 0,
  netSales: 0,
  averageOrderValue: 0,
  deliveredOrders: 0,
  totalOrders: 0,
  salesByCategory: [],
  salesByCountry: [],
  salesByCity: [],
};

export const MOCK_CLOSING_STATS: CloserClosingStats[] = [];
export const MOCK_UTM_CAMPAIGNS: UtmCampaignStats[] = [];

export const MOCK_LIVE_STATS = {
  currentVisitors: 0,
  activeCarts: 0,
  checkoutsInProgress: 0,
  liveLocations: [],
};
