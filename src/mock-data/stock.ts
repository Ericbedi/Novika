import { StockAdjustment, StockLevel, ReorderItem } from "@/server/data/types";

export const MOCK_STOCK_LEVELS: StockLevel[] = [];
export const MOCK_REORDER_ITEMS: ReorderItem[] = [];
export const MOCK_STOCK_ADJUSTMENTS: StockAdjustment[] = [];

// Helper calculations
export function calculateAvailableStock(physical: number, reserved: number): number {
  return Math.max(0, physical - reserved);
}

export function calculateDaysOfStock(available: number, velocity: number): number {
  if (velocity <= 0) return 999;
  return Math.floor(available / velocity);
}

export function calculateReorderPoint(velocity: number, leadTimeDays: number, safetyStockDays: number): number {
  return Math.ceil(velocity * (leadTimeDays + safetyStockDays));
}

export function calculateSuggestedQuantity(
  velocity: number,
  leadTimeDays: number,
  targetCoverageDays: number,
  available: number,
  inTransit: number
): number {
  const needed = velocity * (leadTimeDays + targetCoverageDays) - available - inTransit;
  return Math.max(0, Math.ceil(needed));
}
