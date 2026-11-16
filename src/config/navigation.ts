import React from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  RotateCcw,
  Truck,
  ShoppingCart,
  Users,
  Package,
  Layers,
  FolderTree,
  Store,
  Wallet,
  CheckCircle2,
  BarChart3,
  Radio,
  Settings,
  ShieldCheck,
  Receipt as ReceiptIcon,
  Target,
  FileText,
  Globe2,
  TrendingUp,
  Filter,
  LucideIcon,
} from "lucide-react";
import { UserRole } from "@/server/data/types";

export type BadgeKey = "orders" | "followups" | "deliveries" | "abandoned" | "remittances" | "receipts";

export interface NavItemConfig {
  id: string;
  name: string;
  shortName?: string;
  pathSuffix: string; // e.g. "" for home, "/commandes", etc.
  icon: LucideIcon;
  allowedRoles: UserRole[];
  badgeKey?: BadgeKey;
  isUrgentBadge?: boolean;
  badgeLabel?: (count: number) => string;
}

export interface NavGroupConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  allowedRoles: UserRole[];
  items: NavItemConfig[];
}

export interface NavigationConfig {
  standaloneRoot: NavItemConfig[];
  groups: NavGroupConfig[];
}

export const getNavigationConfig = (basePath: string, role: UserRole = "owner"): NavigationConfig => {
  // Navigation spécifique pour rôles restreints
  if (role === "closer") {
    return {
      standaloneRoot: [],
      groups: [
        {
          id: "group-closer-orders",
          name: "Commandes",
          icon: ShoppingBag,
          allowedRoles: ["closer"],
          items: [
            {
              id: "item-closer-orders",
              name: "Mes commandes",
              pathSuffix: "/commandes",
              icon: ShoppingBag,
              allowedRoles: ["closer"],
              badgeKey: "orders",
              isUrgentBadge: true,
              badgeLabel: (count) => `${count} commande${count > 1 ? "s" : ""}`,
            },
            {
              id: "item-closer-followups",
              name: "Relances",
              pathSuffix: "/commandes/relances",
              icon: RotateCcw,
              allowedRoles: ["closer"],
              badgeKey: "followups",
              isUrgentBadge: true,
              badgeLabel: (count) => `${count} relance${count > 1 ? "s" : ""}`,
            },
            {
              id: "item-closer-abandoned",
              name: "Abandonnées",
              pathSuffix: "/commandes/abandonnees",
              icon: ShoppingCart,
              allowedRoles: ["closer"],
              badgeKey: "abandoned",
            },
            {
              id: "item-closer-receipts",
              name: "Reçus à envoyer",
              pathSuffix: "/commandes/recus",
              icon: ReceiptIcon,
              allowedRoles: ["closer"],
              badgeKey: "receipts",
              isUrgentBadge: true,
            },
          ],
        },
      ],
    };
  }

  if (role === "rider" || role === "courier") {
    return {
      standaloneRoot: [],
      groups: [
        {
          id: "group-rider-deliveries",
          name: "Mes livraisons",
          icon: Truck,
          allowedRoles: ["rider", "courier"],
          items: [
            {
              id: "item-rider-todo",
              name: "À faire",
              pathSuffix: "/livraisons",
              icon: Truck,
              allowedRoles: ["rider", "courier"],
              badgeKey: "deliveries",
              isUrgentBadge: true,
              badgeLabel: (count) => `${count} livraison${count > 1 ? "s" : ""}`,
            },
            {
              id: "item-rider-done",
              name: "Terminées",
              pathSuffix: "/livraisons?tab=done",
              icon: CheckCircle2,
              allowedRoles: ["rider", "courier"],
            },
          ],
        },
      ],
    };
  }

  if (role === "agency") {
    return {
      standaloneRoot: [],
      groups: [
        {
          id: "group-agency-orders",
          name: "Commandes",
          icon: ShoppingBag,
          allowedRoles: ["agency"],
          items: [
            {
              id: "item-agency-received",
              name: "Reçues",
              pathSuffix: "/commandes",
              icon: ShoppingBag,
              allowedRoles: ["agency"],
              badgeKey: "orders",
              isUrgentBadge: true,
            },
            {
              id: "item-agency-assigned",
              name: "Assignées à mes livreurs",
              pathSuffix: "/commandes?view=agency",
              icon: Truck,
              allowedRoles: ["agency"],
            },
            {
              id: "item-agency-remittances",
              name: "Remises d'espèces",
              pathSuffix: "/finances/reversements",
              icon: CheckCircle2,
              allowedRoles: ["agency"],
              badgeKey: "remittances",
            },
            {
              id: "item-agency-couriers",
              name: "Mes livreurs",
              pathSuffix: "/livraisons/livreurs",
              icon: Users,
              allowedRoles: ["agency"],
            },
          ],
        },
      ],
    };
  }

  // Navigation complète pour Admin (owner), Co-admin (admin) et Manager
  return {
    standaloneRoot: [
      {
        id: "nav-home",
        name: "Accueil",
        pathSuffix: "",
        icon: LayoutDashboard,
        allowedRoles: ["owner", "admin", "manager"],
      },
      {
        id: "nav-store",
        name: "Boutique",
        pathSuffix: "/boutique-en-ligne",
        icon: Store,
        allowedRoles: ["owner", "admin"],
      },
    ],
    groups: [
      {
        id: "group-sales",
        name: "Ventes",
        icon: ShoppingBag,
        allowedRoles: ["owner", "admin", "manager"],
        items: [
          {
            id: "item-orders",
            name: "Commandes",
            pathSuffix: "/commandes",
            icon: ShoppingBag,
            allowedRoles: ["owner", "admin", "manager"],
            badgeKey: "orders",
            isUrgentBadge: true,
            badgeLabel: (count) => `${count} commande${count > 1 ? "s" : ""} à traiter`,
          },
          {
            id: "item-followups",
            name: "Relances",
            pathSuffix: "/commandes/relances",
            icon: RotateCcw,
            allowedRoles: ["owner", "admin", "manager"],
            badgeKey: "followups",
            isUrgentBadge: true,
            badgeLabel: (count) => `${count} relance${count > 1 ? "s" : ""} urgente${count > 1 ? "s" : ""}`,
          },
          {
            id: "item-deliveries",
            name: "Livraisons & Flotte",
            pathSuffix: "/livraisons",
            icon: Truck,
            allowedRoles: ["owner", "admin", "manager"],
            badgeKey: "deliveries",
            isUrgentBadge: false,
            badgeLabel: (count) => `${count} livraison${count > 1 ? "s" : ""} en cours`,
          },
          {
            id: "item-abandoned",
            name: "Paniers abandonnés",
            pathSuffix: "/commandes/abandonnees",
            icon: ShoppingCart,
            allowedRoles: ["owner", "admin", "manager"],
            badgeKey: "abandoned",
            isUrgentBadge: false,
            badgeLabel: (count) => `${count} panier${count > 1 ? "s" : ""} abandonné${count > 1 ? "s" : ""}`,
          },
          {
            id: "item-receipts",
            name: "Reçus",
            pathSuffix: "/commandes/recus",
            icon: ReceiptIcon,
            allowedRoles: ["owner", "admin", "manager"],
            badgeKey: "receipts",
            isUrgentBadge: true,
            badgeLabel: (count) => `${count} reçu${count > 1 ? "s" : ""} à envoyer`,
          },
        ],
      },
      {
        id: "group-products",
        name: "Produits",
        icon: Package,
        allowedRoles: ["owner", "admin", "manager"],
        items: [
          {
            id: "item-products-list",
            name: "Produits",
            pathSuffix: "/produits",
            icon: Package,
            allowedRoles: ["owner", "admin", "manager"],
          },
          {
            id: "item-stock",
            name: "Stock",
            pathSuffix: "/produits/stock",
            icon: Layers,
            allowedRoles: ["owner", "admin", "manager"],
          },
          {
            id: "item-suppliers",
            name: "Fournisseurs",
            pathSuffix: "/produits/fournisseurs",
            icon: Truck,
            allowedRoles: ["owner", "admin"],
          },
          {
            id: "item-purchases",
            name: "Achats fournisseurs",
            pathSuffix: "/produits/achats",
            icon: ShoppingCart,
            allowedRoles: ["owner", "admin"],
          },
          {
            id: "item-collections",
            name: "Collections",
            pathSuffix: "/produits/collections",
            icon: FolderTree,
            allowedRoles: ["owner", "admin"],
          },
        ],
      },
      {
        id: "group-finances",
        name: "Finances",
        icon: Wallet,
        allowedRoles: ["owner", "admin"],
        items: [
          {
            id: "item-pnl",
            name: "Résultat & Dépenses",
            pathSuffix: "/finances",
            icon: Wallet,
            allowedRoles: ["owner", "admin"],
          },
          {
            id: "item-objectifs",
            name: "Objectifs",
            pathSuffix: "/finances/objectifs",
            icon: Target,
            allowedRoles: ["owner", "admin"],
          },
          {
            id: "item-remittances",
            name: "Reversements",
            pathSuffix: "/finances/reversements",
            icon: CheckCircle2,
            allowedRoles: ["owner", "admin"],
            badgeKey: "remittances",
            isUrgentBadge: false,
            badgeLabel: (count) => `${count} reversement${count > 1 ? "s" : ""} en attente`,
          },
        ],
      },
      {
        id: "group-stats",
        name: "Stats",
        icon: BarChart3,
        allowedRoles: ["owner", "admin", "manager"],
        items: [
          {
            id: "item-stats-overview",
            name: "Vue d'ensemble",
            pathSuffix: "/stats",
            icon: BarChart3,
            allowedRoles: ["owner", "admin", "manager"],
          },
          {
            id: "item-stats-live",
            name: "En direct",
            pathSuffix: "/stats/live",
            icon: Radio,
            allowedRoles: ["owner", "admin"],
          },
          {
            id: "item-stats-marches",
            name: "Marchés & Rentabilité",
            shortName: "Marchés",
            pathSuffix: "/stats/marches",
            icon: Globe2,
            allowedRoles: ["owner", "admin", "manager"],
          },
          {
            id: "item-product-performance",
            name: "Performance produit",
            shortName: "Scaling",
            pathSuffix: "/performance-produit",
            icon: TrendingUp,
            allowedRoles: ["owner", "admin", "manager"],
          },
          {
            id: "item-stats-funnel",
            name: "Entonnoir de conversion",
            shortName: "Entonnoir",
            pathSuffix: "/stats/entonnoir",
            icon: Filter,
            allowedRoles: ["owner", "admin", "manager"],
          },
        ],
      },
    ],
  };
};

// Cache simulation des compteurs légers
export const MOCK_NAV_COUNTS: Record<BadgeKey, number> = {
  orders: 42,
  followups: 14,
  deliveries: 18,
  abandoned: 7,
  remittances: 2,
  receipts: 2,
};
