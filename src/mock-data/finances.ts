import { CashbookEntry, Expense, FinancePeriodSummary } from "@/server/data/types";

export const MOCK_FINANCE_SUMMARY: Record<string, FinancePeriodSummary> = {
  last7: {
    collectedRevenue: 2480000, // Encaissé en espèces
    deliveredCount: 98,
    productCost: 686000, // Prix de revient unitaire x commandes livrées
    adSpend: 420000, // Publicités Facebook/TikTok
    shippingCost: 196000, // Frais payés aux livreurs partenaires (2000 FCFA / colis)
    otherExpenses: 125000, // Emballages, abonnements, etc.
    netProfit: 1053000, // 2 480 000 - (686 000 + 420 000 + 196 000 + 125 000)
    profitMargin: 42.4,
  },
  last30: {
    collectedRevenue: 10180000,
    deliveredCount: 412,
    productCost: 2884000,
    adSpend: 1650000,
    shippingCost: 824000,
    otherExpenses: 450000,
    netProfit: 4372000,
    profitMargin: 42.9,
  },
  today: {
    collectedRevenue: 375000,
    deliveredCount: 15,
    productCost: 105000,
    adSpend: 62000,
    shippingCost: 30000,
    otherExpenses: 15000,
    netProfit: 163000,
    profitMargin: 43.4,
  },
};

export const MOCK_EXPENSES: Expense[] = [
  {
    id: "exp_01",
    label: "Campagne Meta Ads (Scaling Café Vitality Abidjan)",
    amount: 250000,
    date: "14/11/2026",
    category: "ads",
    categoryLabel: "Publicité Meta",
    notes: "Facture CB reçue #FB-992384",
  },
  {
    id: "exp_02",
    label: "Campagne TikTok Ads (Sérum Visage Lomé)",
    amount: 170000,
    date: "13/11/2026",
    category: "ads",
    categoryLabel: "Publicité TikTok",
    notes: "Recharge compte publicitaire TikTok",
  },
  {
    id: "exp_03",
    label: "Achat cartons emballages & pochettes kraft (500 pcs)",
    amount: 45000,
    date: "12/11/2026",
    category: "packaging",
    categoryLabel: "Emballage & Colisage",
    notes: "Fournisseur Marché d'Adawlato Lomé",
  },
  {
    id: "exp_04",
    label: "Abonnement WhatsApp Business Multi-agents",
    amount: 30000,
    date: "10/11/2026",
    category: "software",
    categoryLabel: "Logiciels & Outils",
    notes: "Plateforme de closing WhatsApp",
  },
  {
    id: "exp_05",
    label: "Prime closing hebdomadaire - Aïcha Diallo",
    amount: 50000,
    date: "09/11/2026",
    category: "salary",
    categoryLabel: "Commissions Closeuse",
    notes: "98% de confirmation atteinte cette semaine",
  },
];

export const MOCK_CASHBOOK: CashbookEntry[] = [
  {
    id: "cb_01",
    date: "15/11/2026 à 11:30",
    type: "entry",
    label: "Retour de tournée livreur Mamadou Express (Abidjan)",
    amount: 135000,
    category: "Encaissement COD",
    notes: "5 colis livrés, espèces vérifiées",
    impactsNetProfit: true,
  },
  {
    id: "cb_02",
    date: "15/11/2026 à 09:15",
    type: "expense",
    label: "Règlement courses livreur Koffi Moto-Course (Lomé)",
    amount: 18000,
    category: "Frais de livraison",
    notes: "12 livraisons effectuées à 1 500 FCFA/colis",
    impactsNetProfit: true,
  },
  {
    id: "cb_03",
    date: "14/11/2026 à 17:00",
    type: "withdrawal",
    label: "Retrait bancaire / virement propriétaire (bénéfice perso)",
    amount: 500000,
    category: "Retrait Propriétaire",
    notes: "Virement compte personnel Ecobank — Ne compte pas dans le résultat net !",
    impactsNetProfit: false, // CLAIREMENT AFFICHÉ : Ne compte pas dans le résultat net
  },
  {
    id: "cb_04",
    date: "14/11/2026 à 14:20",
    type: "entry",
    label: "Dépôt espèces tournée livreur Ibrahima (Dakar)",
    amount: 85000,
    category: "Encaissement COD",
    notes: "Tournée Mermoz et Almadies",
    impactsNetProfit: true,
  },
  {
    id: "cb_05",
    date: "13/11/2026 à 12:00",
    type: "expense",
    label: "Paiement approvisionnement stock local",
    amount: 320000,
    category: "Coût produits",
    notes: "Réception lot 80 Sérums Visage",
    impactsNetProfit: true,
  },
];
