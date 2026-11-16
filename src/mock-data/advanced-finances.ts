/**
 * Données de test pour les modules C2 (Caisse / Comptes), C3 (Dépenses, Revenus, Transferts),
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
export const MOCK_ACCOUNTS: AccountRecord[] = [
  {
    id: "acc_01",
    name: "Caisse Espèces Siège (Lomé)",
    type: "cash",
    currency: "XOF",
    balance: 1450000,
    accountNumber: "CSH-LOM-01",
    isArchived: false,
    lastReconciliationDate: "14/11/2026",
    lastReconciliationDiscrepancy: 0,
  },
  {
    id: "acc_02",
    name: "Wave Business (Côte d'Ivoire)",
    type: "momo",
    operatorName: "Wave",
    currency: "XOF",
    balance: 3820000,
    accountNumber: "+225 07 89 23 44 11",
    isArchived: false,
    lastReconciliationDate: "15/11/2026",
    lastReconciliationDiscrepancy: 0,
  },
  {
    id: "acc_03",
    name: "Orange Money Marchand (Abidjan)",
    type: "momo",
    operatorName: "Orange Money",
    currency: "XOF",
    balance: 1950000,
    accountNumber: "+225 07 45 12 33 00",
    isArchived: false,
    lastReconciliationDate: "13/11/2026",
    lastReconciliationDiscrepancy: 5000,
  },
  {
    id: "acc_04",
    name: "TMoney Business (Togo)",
    type: "momo",
    operatorName: "TMoney",
    currency: "XOF",
    balance: 890000,
    accountNumber: "+228 90 12 34 56",
    isArchived: false,
    lastReconciliationDate: "14/11/2026",
    lastReconciliationDiscrepancy: 0,
  },
  {
    id: "acc_05",
    name: "Compte Bancaire Ecobank Courant",
    type: "bank",
    operatorName: "Ecobank",
    currency: "XOF",
    balance: 8450000,
    accountNumber: "TG054 01001 02345678901 45",
    isArchived: false,
    lastReconciliationDate: "10/11/2026",
    lastReconciliationDiscrepancy: 0,
  },
  {
    id: "acc_06",
    name: "Carte Visa Publicité (Dépenses Ads)",
    type: "card",
    operatorName: "Visa UBA",
    currency: "USD",
    balance: 125000, // 1 250,00 USD
    accountNumber: "•••• 4419",
    isArchived: false,
    lastReconciliationDate: "12/11/2026",
    lastReconciliationDiscrepancy: 0,
  },
  {
    id: "acc_07",
    name: "Cash en mains - Mamadou Express (Abidjan)",
    type: "courier_transit",
    operatorName: "Livreur Mamadou",
    currency: "XOF",
    balance: 245000,
    accountNumber: "LIV-ABJ-04",
    isArchived: false,
    lastReconciliationDate: "15/11/2026",
    lastReconciliationDiscrepancy: 0,
  },
  {
    id: "acc_08",
    name: "Cash en mains - Koffi Moto-Course (Lomé)",
    type: "courier_transit",
    operatorName: "Livreur Koffi",
    currency: "XOF",
    balance: 85000,
    accountNumber: "LIV-LOM-02",
    isArchived: false,
    lastReconciliationDate: "15/11/2026",
    lastReconciliationDiscrepancy: 0,
  },
  {
    id: "acc_09",
    name: "Ancien compte Moov Money 2025 (Clôturé)",
    type: "momo",
    operatorName: "Moov Money",
    currency: "XOF",
    balance: 0,
    accountNumber: "+228 99 88 77 66",
    isArchived: true,
  },
];

// 2. DÉPENSES (C3)
export const MOCK_EXPENSES_ADVANCED: ExpenseRecord[] = [
  {
    id: "exp_101",
    description: "Recharge carte Visa pour Meta Ads (Campagne Whitening Serum)",
    category: "Publicité Meta",
    amount: 350000,
    currency: "XOF",
    accountId: "acc_06",
    accountName: "Carte Visa Publicité (Dépenses Ads)",
    country: "CI",
    date: "15/11/2026",
    attachmentName: "facture_meta_nov_15.pdf",
    status: "approved",
    createdBy: "Directeur Marketing",
    approvedBy: "Propriétaire",
  },
  {
    id: "exp_102",
    description: "Cartons d'emballage renforcés 3 couches (1000 unités)",
    category: "Emballage & Colisage",
    amount: 85000,
    currency: "XOF",
    accountId: "acc_01",
    accountName: "Caisse Espèces Siège (Lomé)",
    country: "TG",
    date: "14/11/2026",
    attachmentName: "recu_cartonnerie_adawlato.jpg",
    status: "approved",
    createdBy: "Gestionnaire Stock",
    approvedBy: "Propriétaire",
  },
  {
    id: "exp_103",
    description: "Carburant tournée livraisons urgentes Abidjan Nord",
    category: "Transport & Carburant",
    amount: 25000,
    currency: "XOF",
    accountId: "acc_07",
    accountName: "Cash en mains - Mamadou Express (Abidjan)",
    country: "CI",
    date: "14/11/2026",
    status: "approved",
    createdBy: "Livreur Mamadou",
    approvedBy: "Superviseur Logistique",
  },
  {
    id: "exp_104",
    description: "Achat nouveau smartphone pro pour closeuse Aïcha",
    category: "Matériel & Téléphonie",
    amount: 140000,
    currency: "XOF",
    accountId: "acc_02",
    accountName: "Wave Business (Côte d'Ivoire)",
    country: "CI",
    date: "13/11/2026",
    attachmentName: "devis_samsung_galaxy.pdf",
    status: "pending_approval",
    createdBy: "Responsable Équipe",
  },
  {
    id: "exp_105",
    description: "Abonnement mensuel Fibre Optique agence Lomé",
    category: "Télécom & Internet",
    amount: 35000,
    currency: "XOF",
    accountId: "acc_04",
    accountName: "TMoney Business (Togo)",
    country: "TG",
    date: "12/11/2026",
    attachmentName: "quittance_togocom.pdf",
    status: "approved",
    createdBy: "Admin",
    approvedBy: "Propriétaire",
  },
];

// 3. REVENUS (C3)
export const MOCK_REVENUES_ADVANCED: RevenueRecord[] = [
  {
    id: "rev_01",
    description: "Encaissement espèces commande COD #CMD-2026-089 (Crème Anti-Taches)",
    category: "Vente COD",
    amount: 24900,
    currency: "XOF",
    accountId: "acc_07",
    accountName: "Cash en mains - Mamadou Express (Abidjan)",
    country: "CI",
    date: "15/11/2026 14:15",
    referenceType: "cod_delivery",
    referenceNumber: "CMD-2026-089",
  },
  {
    id: "rev_02",
    description: "Encaissement espèces commande COD #CMD-2026-088 (Pack 3 Sérums)",
    category: "Vente COD",
    amount: 45000,
    currency: "XOF",
    accountId: "acc_08",
    accountName: "Cash en mains - Koffi Moto-Course (Lomé)",
    country: "TG",
    date: "15/11/2026 12:40",
    referenceType: "cod_delivery",
    referenceNumber: "CMD-2026-088",
  },
  {
    id: "rev_03",
    description: "Paiement en ligne prépayé commande #CMD-2026-085 via Wave",
    category: "Pré-paiement Client",
    amount: 32000,
    currency: "XOF",
    accountId: "acc_02",
    accountName: "Wave Business (Côte d'Ivoire)",
    country: "CI",
    date: "14/11/2026 18:05",
    referenceType: "prepayment",
    referenceNumber: "CMD-2026-085",
  },
  {
    id: "rev_04",
    description: "Vente en gros 50 packs savon kojic - Institut Beauté Cotonou",
    category: "Vente B2B / Gros",
    amount: 285000,
    currency: "XOF",
    accountId: "acc_05",
    accountName: "Compte Bancaire Ecobank Courant",
    country: "BJ",
    date: "12/11/2026 11:00",
    referenceType: "b2b_sale",
    referenceNumber: "FAC-B2B-014",
  },
];

// 4. TRANSFERTS (C3)
export const MOCK_TRANSFERS: TransferRecord[] = [
  {
    id: "tr_01",
    fromAccountId: "acc_02",
    fromAccountName: "Wave Business (Côte d'Ivoire)",
    toAccountId: "acc_05",
    toAccountName: "Compte Bancaire Ecobank Courant",
    amountFrom: 1500000,
    currencyFrom: "XOF",
    amountTo: 1485000,
    currencyTo: "XOF",
    fxRate: 1.0,
    transferFee: 15000, // 1% frais de retrait/virement
    date: "14/11/2026",
    notes: "Rapatriement hebdomadaire des encaissements Wave vers la banque",
  },
  {
    id: "tr_02",
    fromAccountId: "acc_05",
    fromAccountName: "Compte Bancaire Ecobank Courant",
    toAccountId: "acc_06",
    toAccountName: "Carte Visa Publicité (Dépenses Ads)",
    amountFrom: 310000,
    currencyFrom: "XOF",
    amountTo: 50000, // 500,00 USD
    currencyTo: "USD",
    fxRate: 0.001613, // 1 USD = 620 XOF
    transferFee: 4500,
    date: "11/11/2026",
    notes: "Recharge budget pub Facebook pour le week-end",
  },
];

// 5. CHARGES RÉCURRENTES (C3)
export const MOCK_RECURRING_CHARGES: RecurringChargeRecord[] = [
  {
    id: "rec_01",
    name: "Loyer bureau & stock Abidjan (Cocody)",
    amount: 350000,
    currency: "XOF",
    frequency: "monthly",
    nextDueDate: "01/12/2026",
    accountId: "acc_05",
    accountName: "Compte Bancaire Ecobank Courant",
    category: "Loyer & Charges locatives",
    isPaused: false,
  },
  {
    id: "rec_02",
    name: "Abonnement WhatsApp CRM Multi-agents",
    amount: 45000,
    currency: "XOF",
    frequency: "monthly",
    nextDueDate: "25/11/2026",
    accountId: "acc_06",
    accountName: "Carte Visa Publicité (Dépenses Ads)",
    category: "Logiciels & Outils SaaS",
    isPaused: false,
  },
  {
    id: "rec_03",
    name: "Forfaits data internet flotte closeuses (4 lignes)",
    amount: 40000,
    currency: "XOF",
    frequency: "monthly",
    nextDueDate: "28/11/2026",
    accountId: "acc_02",
    accountName: "Wave Business (Côte d'Ivoire)",
    category: "Télécom & Internet",
    isPaused: false,
  },
];

// 6. DÉPENSES PUBLICITAIRES & ANALYSE DU CPA RÉEL (C4)
export const MOCK_AD_SPEND: AdSpendRecord[] = [
  {
    id: "ad_01",
    platform: "meta",
    campaignName: "CI_TOF_Crème_AntiTaches_Video03",
    country: "CI",
    date: "14/11/2026",
    spendAmount: 85000,
    currency: "XOF",
    deliveredOrdersCount: 22, // 22 livraisons réelles encaissées
    deliveredRevenue: 547800, // 547 800 XOF
    impressions: 48200,
    clicks: 1420,
  },
  {
    id: "ad_02",
    platform: "tiktok",
    campaignName: "TG_TOF_Serum_TeintEclat_Trend",
    country: "TG",
    date: "14/11/2026",
    spendAmount: 45000,
    currency: "XOF",
    deliveredOrdersCount: 14,
    deliveredRevenue: 348600,
    impressions: 62400,
    clicks: 2180,
  },
  {
    id: "ad_03",
    platform: "meta",
    campaignName: "SN_TOF_Savon_Kojic_Carrousel",
    country: "SN",
    date: "13/11/2026",
    spendAmount: 65000,
    currency: "XOF",
    deliveredOrdersCount: 16,
    deliveredRevenue: 398400,
    impressions: 39100,
    clicks: 1150,
  },
  {
    id: "ad_04",
    platform: "google",
    campaignName: "BJ_Search_Cosmetique_Naturelle",
    country: "BJ",
    date: "12/11/2026",
    spendAmount: 30000,
    currency: "XOF",
    deliveredOrdersCount: 7,
    deliveredRevenue: 174300,
    impressions: 12500,
    clicks: 640,
  },
  {
    id: "ad_05",
    platform: "snapchat",
    campaignName: "CI_Story_PackDécouverte_Youth",
    country: "CI",
    date: "11/11/2026",
    spendAmount: 25000,
    currency: "XOF",
    deliveredOrdersCount: 5,
    deliveredRevenue: 124500,
    impressions: 28900,
    clicks: 890,
  },
];
