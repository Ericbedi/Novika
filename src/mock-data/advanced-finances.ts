/**
 * Données financières pour les modules C2 (Caisse / Comptes), C3 (Dépenses, Revenus, Transferts),
 * et C4 (Publicités & CPA réel).
 * Tous les montants monétaires sont stockés sous forme d'entiers dans la plus petite unité (subunits/cents).
 */

export interface AccountRecord {
  id: string;
  name: string;
  type: "cash" | "bank" | "momo" | "card" | "courier_transit";
  operatorName?: string; // ex: Wave, Orange Money, MTN, Moov, TMoney, Ecobank
  currency: string; // ISO 4217 (ex: XOF, XAF, GHS)
  balance: number; // En subunits (ex: 2 450 000 XOF -> 2450000)
  accountNumber?: string;
  isArchived: boolean;
  lastReconciliationDate?: string;
  lastReconciliationDiscrepancy?: number;
}

export interface ExpenseRecord {
  id: string;
  description: string;
  category: string;
  amount: number; // En subunits
  currency: string;
  accountId: string;
  accountName: string;
  country: string; // TG, CI, SN, BJ, etc.
  date: string;
  attachmentName?: string;
  status: "approved" | "pending_approval" | "reversed";
  isReversal?: boolean;
  reversalOfId?: string;
  createdBy: string;
  approvedBy?: string;
}

export interface RevenueRecord {
  id: string;
  description: string;
  category: string;
  amount: number; // En subunits
  currency: string;
  accountId: string;
  accountName: string;
  country: string;
  date: string;
  referenceType: "cod_delivery" | "b2b_sale" | "prepayment" | "other";
  referenceNumber?: string;
}

export interface TransferRecord {
  id: string;
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  amountFrom: number;
  currencyFrom: string;
  amountTo: number;
  currencyTo: string;
  fxRate: number;
  transferFee: number;
  date: string;
  notes?: string;
}

export interface RecurringChargeRecord {
  id: string;
  name: string;
  amount: number;
  currency: string;
  frequency: "daily" | "weekly" | "monthly" | "annual";
  nextDueDate: string;
  accountId: string;
  accountName: string;
  category: string;
  isPaused: boolean;
}

export interface AdSpendRecord {
  id: string;
  platform: "meta" | "tiktok" | "google" | "snapchat";
  campaignName: string;
  country: string;
  date: string;
  spendAmount: number; // En subunits
  currency: string;
  deliveredOrdersCount: number; // Commandes réellement livrées attribuées
  deliveredRevenue: number; // CA livré encaissé
  impressions: number;
  clicks: number;
}

// 1. COMPTES & CAISSES (C2)
export const MOCK_ACCOUNTS: AccountRecord[] = [];

// 2. DÉPENSES OPÉRATIONNELLES (C3)
export const MOCK_EXPENSES_ADVANCED: ExpenseRecord[] = [];

// 3. REVENUS NON-COD ENCAISSÉS (C3)
export const MOCK_REVENUES_ADVANCED: RevenueRecord[] = [];

// 4. TRANSFERTS INTER-COMPTES (C3)
export const MOCK_TRANSFERS: TransferRecord[] = [];

// 5. CHARGES RÉCURRENTES & ABONNEMENTS (C3)
export const MOCK_RECURRING_CHARGES: RecurringChargeRecord[] = [];

// 6. DÉPENSES PUBLICITAIRES & ATTRIBUTION RÉELLE (C4)
export const MOCK_AD_SPEND: AdSpendRecord[] = [];
