import { CashbookEntry, Expense, FinancePeriodSummary } from "@/server/data/types";

export const MOCK_FINANCE_SUMMARY: Record<string, FinancePeriodSummary> = {
  last7: {
    collectedRevenue: 0,
    deliveredCount: 0,
    productCost: 0,
    adSpend: 0,
    shippingCost: 0,
    otherExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
  },
  last30: {
    collectedRevenue: 0,
    deliveredCount: 0,
    productCost: 0,
    adSpend: 0,
    shippingCost: 0,
    otherExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
  },
  today: {
    collectedRevenue: 0,
    deliveredCount: 0,
    productCost: 0,
    adSpend: 0,
    shippingCost: 0,
    otherExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
  },
};

export const MOCK_EXPENSES: Expense[] = [];
export const MOCK_CASHBOOK: CashbookEntry[] = [];
