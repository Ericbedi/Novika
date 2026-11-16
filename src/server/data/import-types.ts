export type ImportMode = "create_only" | "update_only" | "create_and_update";
export type ImportBatchStatus = "pending" | "dry_run" | "processing" | "completed" | "failed" | "cancelled";
export type ImportStockMode = "set" | "add";

export interface ImportBatch {
  id: string;
  storeId: string;
  fileName: string;
  fileSizeBytes: number;
  encoding: "utf-8" | "windows-1252";
  separator: ";" | "," | "\t";
  status: ImportBatchStatus;
  mode: ImportMode;
  newProductsStatus: "draft" | "active";
  stockMode: ImportStockMode;
  autoCreateCollections: boolean;
  autoCreateSuppliers: boolean;
  targetCountries: string[]; // e.g. ["TG", "CI", "SN", "BJ"]
  
  // Statistiques
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  errorCount: number;
  ignoredCount: number;
  
  createdBy: string;
  createdByName: string;
  createdAt: string;
  completedAt?: string;
  canRollback: boolean;
  createdProductIds: string[];
}

export interface ImportRowResult {
  rowNumber: number;
  rawIdentifier?: string;
  title?: string;
  sku?: string;
  status: "valid" | "created" | "updated" | "error" | "ignored";
  columnName?: string;
  errorMessage?: string;
  warningMessage?: string;
  parsedData?: Record<string, any>;
}

export interface DryRunSummary {
  totalRows: number;
  creationsCount: number;
  updatesCount: number;
  errorsCount: number;
  ignoredCount: number;
  warningsCount: number;
  canProceed: boolean;
  rowResults: ImportRowResult[];
}

export interface PreviewToken {
  token: string;
  targetId: string; // product id or store slug
  storeId: string;
  type: "product" | "store";
  expiresAt: string;
  createdAt: string;
  isRevoked: boolean;
}
