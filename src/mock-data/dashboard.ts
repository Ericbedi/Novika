import {
  ChartDayData,
  DashboardKpi,
  StatusDistributionItem,
  TopProduct,
} from "@/server/data/types";

export type PeriodType = "today" | "yesterday" | "last7" | "last30" | "thisMonth" | "custom";

const EMPTY_KPI: DashboardKpi = {
  visitors: { value: 0, delta: 0, isUpGood: true },
  totalSales: { value: 0, delta: 0, isUpGood: true },
  deliveredSales: { value: 0, delta: 0, isUpGood: true },
  ordersCount: { value: 0, delta: 0, isUpGood: true },
  conversionRate: { value: 0, delta: 0, isUpGood: true },
  pendingOrdersCount: 0,
  todayDeliveriesCount: 0,
};

export const MOCK_KPIS_BY_PERIOD: Record<PeriodType, DashboardKpi> = {
  today: { ...EMPTY_KPI },
  yesterday: { ...EMPTY_KPI },
  last7: { ...EMPTY_KPI },
  last30: { ...EMPTY_KPI },
  thisMonth: { ...EMPTY_KPI },
  custom: { ...EMPTY_KPI },
};

export const MOCK_CHART_DAYS: ChartDayData[] = [];
export const MOCK_STATUS_DISTRIBUTION: StatusDistributionItem[] = [];
export const MOCK_TOP_PRODUCTS: TopProduct[] = [];
