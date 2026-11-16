/**
 * Types pour les Intégrations et Sources de Commandes Externes (Google Sheets, Shopify, etc.).
 */

export type OrderSourceType = "google_sheets" | "shopify" | "woocommerce" | "webhook";

export type OrderSourceStatus = "disconnected" | "connected" | "error" | "paused";

export type SyncFrequencyMinutes = 1 | 5 | 15;

export type InitialImportChoice = "only_new" | "from_date" | "all";

export interface ColumnMappingConfig {
  id_commande: string;
  client: string;
  telephone: string;
  email?: string;
  pays?: string;
  sku?: string;
  produit?: string;
  variante?: string;
  quantite?: string;
  prix_unitaire?: string;
  total?: string;
  frais_livraison?: string;
  ville?: string;
  quartier?: string;
  adresse?: string;
  date?: string;
  notes?: string;
  utm_source?: string;
  utm_campaign?: string;
}

export interface OrderSourceConfig {
  id: string;
  storeId: string;
  storeSlug: string;
  type: OrderSourceType;
  name: string;
  status: OrderSourceStatus;
  sheetUrl?: string; // Masqué à l'affichage (ex: https://docs.google.com/spreadsheets/d/1BxiM.../edit)
  sheetId?: string;
  gid?: string;
  sheetName: string; // Nom de l'onglet (ex: "Feuille 1", "Commandes COD")
  defaultCountry: string; // Ex: "CI", "TG", "SN", "BJ"
  dateFormat: string; // "DD/MM/YYYY" ou "YYYY-MM-DD"
  timezone: string; // "Africa/Abidjan", "Africa/Lome", etc.
  autoSyncMinutes: SyncFrequencyMinutes;
  initialImportChoice: InitialImportChoice;
  initialImportDate?: string;
  columnMapping: Partial<ColumnMappingConfig>;
  lastSyncAt?: string;
  nextSyncAt?: string;
  lastError?: string;
  totalOrdersImported: number;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedSheetRow {
  rowNumber: number;
  idCommande: string;
  date?: string;
  client: string;
  telephone: string;
  email?: string;
  pays?: string;
  sku?: string;
  produit?: string;
  variante?: string;
  quantite: number;
  prixUnitaire?: number;
  total?: number;
  fraisLivraison?: number;
  ville?: string;
  quartier?: string;
  adresse?: string;
  notes?: string;
  utmSource?: string;
  utmCampaign?: string;
  raw: Record<string, string>;
  isValid: boolean;
  errors: string[];
}

export interface GroupedOrderData {
  idCommande: string;
  date: string;
  client: string;
  telephone: string;
  email?: string;
  pays: string;
  ville: string;
  quartier?: string;
  adresse: string;
  notes?: string;
  utmSource?: string;
  utmCampaign?: string;
  fraisLivraison: number;
  items: Array<{
    sku?: string;
    productName: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    isDraftProduct?: boolean;
    rowNumber: number;
  }>;
  totalCalculated: number;
  hasTotalMismatch: boolean;
  rowNumbers: number[];
}

export interface ImportBatchReport {
  id: string;
  sourceId: string;
  storeSlug: string;
  startedAt: string;
  completedAt: string;
  status: "success" | "partial_error" | "failed";
  totalRowsRead: number;
  importedOrdersCount: number;
  skippedDuplicatesCount: number;
  rejectedRowsCount: number;
  rejectedDetails: Array<{
    rowNumber: number;
    sourceOrderId?: string;
    reason: string;
    rawSnippet: string;
  }>;
  warnings: string[];
}
