import { CloserClosingStats, UtmCampaignStats } from "@/server/data/types";

export interface CategorySale {
  category: string;
  revenue: number;
  percentage: number;
  orders: number;
}

export interface CountrySale {
  country: string;
  countryName: string;
  flag: string;
  orders: number;
  deliveredRate: number;
  revenue: number;
}

export interface CitySale {
  city: string;
  count: number;
}

export interface SalesOverview {
  grossSales: number;
  discounts: number;
  returns: number;
  netSales: number;
  averageOrderValue: number;
  deliveredOrders: number;
  totalOrders: number;
  salesByCategory: CategorySale[];
  salesByCountry: CountrySale[];
  salesByCity: CitySale[];
}

export const MOCK_SALES_OVERVIEW: SalesOverview = {
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

export interface LiveLocation {
  city: string;
  count: number;
}

export interface LiveStats {
  currentVisitors: number;
  activeCarts: number;
  checkoutsInProgress: number;
  liveLocations: LiveLocation[];
}

export const MOCK_LIVE_STATS: LiveStats = {
  currentVisitors: 0,
  activeCarts: 0,
  checkoutsInProgress: 0,
  liveLocations: [],
};
