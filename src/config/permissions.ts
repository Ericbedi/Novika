// Source unique des permissions Novika
// Définit les droits d'accès : ressources × actions × rôles × condition de périmètre

import { UserRole } from "@/server/data/types";

export type Resource =
  | "dashboard"
  | "orders"
  | "products"
  | "suppliers"
  | "finances"
  | "stats"
  | "theme"
  | "team"
  | "integrations"
  | "billing"
  | "scaling"
  | "funnel"
  | "pixels";

export type Action = "view" | "create" | "update" | "delete" | "assign" | "export";

export type AccessLevel = "full" | "read" | "restricted" | "none";

export interface PermissionRule {
  resource: Resource;
  role: UserRole;
  level: AccessLevel;
  allowedActions: Action[];
  scopeCondition?: "all" | "assigned_only" | "country_only" | "agency_couriers_only" | "no_financials";
  notes?: string;
}

// Matrice d'accès officielle Novika
export const PERMISSIONS_MATRIX: PermissionRule[] = [
  // Dashboard
  { resource: "dashboard", role: "owner", level: "full", allowedActions: ["view", "export"] },
  { resource: "dashboard", role: "admin", level: "full", allowedActions: ["view", "export"] },
  { resource: "dashboard", role: "manager", level: "restricted", allowedActions: ["view"], scopeCondition: "no_financials" },
  { resource: "dashboard", role: "closer", level: "none", allowedActions: [] },
  { resource: "dashboard", role: "rider", level: "none", allowedActions: [] },
  { resource: "dashboard", role: "courier", level: "none", allowedActions: [] },
  { resource: "dashboard", role: "agency", level: "none", allowedActions: [] },

  // Orders
  { resource: "orders", role: "owner", level: "full", allowedActions: ["view", "create", "update", "delete", "assign", "export"] },
  { resource: "orders", role: "admin", level: "full", allowedActions: ["view", "create", "update", "delete", "assign", "export"] },
  { resource: "orders", role: "manager", level: "full", allowedActions: ["view", "create", "update", "assign", "export"] },
  { resource: "orders", role: "closer", level: "restricted", allowedActions: ["view", "create", "update", "assign"], scopeCondition: "assigned_only" },
  { resource: "orders", role: "rider", level: "restricted", allowedActions: ["view", "update"], scopeCondition: "assigned_only" },
  { resource: "orders", role: "courier", level: "restricted", allowedActions: ["view", "update"], scopeCondition: "assigned_only" },
  { resource: "orders", role: "agency", level: "restricted", allowedActions: ["view", "update", "assign"], scopeCondition: "assigned_only" },

  // Products & Stock
  { resource: "products", role: "owner", level: "full", allowedActions: ["view", "create", "update", "delete", "export"] },
  { resource: "products", role: "admin", level: "full", allowedActions: ["view", "create", "update", "delete", "export"] },
  { resource: "products", role: "manager", level: "read", allowedActions: ["view"] },
  { resource: "products", role: "closer", level: "none", allowedActions: [] },
  { resource: "products", role: "rider", level: "none", allowedActions: [] },
  { resource: "products", role: "courier", level: "none", allowedActions: [] },
  { resource: "products", role: "agency", level: "none", allowedActions: [] },

  // Suppliers & Sourcing
  { resource: "suppliers", role: "owner", level: "full", allowedActions: ["view", "create", "update", "delete"] },
  { resource: "suppliers", role: "admin", level: "full", allowedActions: ["view", "create", "update", "delete"] },
  { resource: "suppliers", role: "manager", level: "none", allowedActions: [] },
  { resource: "suppliers", role: "closer", level: "none", allowedActions: [] },
  { resource: "suppliers", role: "rider", level: "none", allowedActions: [] },
  { resource: "suppliers", role: "courier", level: "none", allowedActions: [] },
  { resource: "suppliers", role: "agency", level: "none", allowedActions: [] },

  // Finances, Objectifs, Reversements
  { resource: "finances", role: "owner", level: "full", allowedActions: ["view", "create", "update", "export"] },
  { resource: "finances", role: "admin", level: "full", allowedActions: ["view", "create", "update", "export"] },
  { resource: "finances", role: "manager", level: "none", allowedActions: [] },
  { resource: "finances", role: "closer", level: "none", allowedActions: [] },
  { resource: "finances", role: "rider", level: "none", allowedActions: [] },
  { resource: "finances", role: "courier", level: "none", allowedActions: [] },
  { resource: "finances", role: "agency", level: "none", allowedActions: [] },

  // Stats
  { resource: "stats", role: "owner", level: "full", allowedActions: ["view", "export"] },
  { resource: "stats", role: "admin", level: "full", allowedActions: ["view", "export"] },
  { resource: "stats", role: "manager", level: "restricted", allowedActions: ["view"], scopeCondition: "no_financials" },
  { resource: "stats", role: "closer", level: "none", allowedActions: [] },
  { resource: "stats", role: "rider", level: "none", allowedActions: [] },
  { resource: "stats", role: "courier", level: "none", allowedActions: [] },
  { resource: "stats", role: "agency", level: "none", allowedActions: [] },

  // Theme & Vitrine
  { resource: "theme", role: "owner", level: "full", allowedActions: ["view", "create", "update"] },
  { resource: "theme", role: "admin", level: "full", allowedActions: ["view", "create", "update"] },
  { resource: "theme", role: "manager", level: "read", allowedActions: ["view"] }, // Aperçu en lecture
  { resource: "theme", role: "closer", level: "none", allowedActions: [] },
  { resource: "theme", role: "rider", level: "none", allowedActions: [] },
  { resource: "theme", role: "courier", level: "none", allowedActions: [] },
  { resource: "theme", role: "agency", level: "none", allowedActions: [] },

  // Team
  { resource: "team", role: "owner", level: "full", allowedActions: ["view", "create", "update", "delete"] },
  { resource: "team", role: "admin", level: "full", allowedActions: ["view", "create", "update", "delete"] },
  { resource: "team", role: "manager", level: "read", allowedActions: ["view"] },
  { resource: "team", role: "closer", level: "none", allowedActions: [] },
  { resource: "team", role: "rider", level: "none", allowedActions: [] },
  { resource: "team", role: "courier", level: "none", allowedActions: [] },
  { resource: "team", role: "agency", level: "restricted", allowedActions: ["view", "create", "update"], scopeCondition: "agency_couriers_only" },

  // Integrations & Settings
  { resource: "integrations", role: "owner", level: "full", allowedActions: ["view", "create", "update", "delete"] },
  { resource: "integrations", role: "admin", level: "restricted", allowedActions: ["view", "create", "update"], scopeCondition: "no_financials" },
  { resource: "integrations", role: "manager", level: "none", allowedActions: [] },
  { resource: "integrations", role: "closer", level: "none", allowedActions: [] },
  { resource: "integrations", role: "rider", level: "none", allowedActions: [] },
  { resource: "integrations", role: "courier", level: "none", allowedActions: [] },
  { resource: "integrations", role: "agency", level: "none", allowedActions: [] },

  // Billing & Danger Zone
  { resource: "billing", role: "owner", level: "full", allowedActions: ["view", "update", "delete"] },
  { resource: "billing", role: "admin", level: "none", allowedActions: [] },
  { resource: "billing", role: "manager", level: "none", allowedActions: [] },
  { resource: "billing", role: "closer", level: "none", allowedActions: [] },
  { resource: "billing", role: "rider", level: "none", allowedActions: [] },
  { resource: "billing", role: "courier", level: "none", allowedActions: [] },
  { resource: "billing", role: "agency", level: "none", allowedActions: [] },

  // Scaling / Performance Produit (Prompt 05-G)
  // Confidentiel : Dépenses publicitaires et rentabilité réservées à Owner et Admin, Manager en lecture seule
  { resource: "scaling", role: "owner", level: "full", allowedActions: ["view", "create", "update", "export"] },
  { resource: "scaling", role: "admin", level: "full", allowedActions: ["view", "create", "update", "export"] },
  { resource: "scaling", role: "manager", level: "read", allowedActions: ["view"], scopeCondition: "no_financials" },
  { resource: "scaling", role: "closer", level: "none", allowedActions: [] },
  { resource: "scaling", role: "rider", level: "none", allowedActions: [] },
  { resource: "scaling", role: "courier", level: "none", allowedActions: [] },
  { resource: "scaling", role: "agency", level: "none", allowedActions: [] },

  // Entonnoir de conversion / Funnel (Prompt 05-E)
  // Statistiques d'acquisition et abandon : Owner et Admin complet, Manager en lecture, autres exclus
  { resource: "funnel", role: "owner", level: "full", allowedActions: ["view", "export"] },
  { resource: "funnel", role: "admin", level: "full", allowedActions: ["view", "export"] },
  { resource: "funnel", role: "manager", level: "read", allowedActions: ["view"] },
  { resource: "funnel", role: "closer", level: "none", allowedActions: [] },
  { resource: "funnel", role: "rider", level: "none", allowedActions: [] },
  { resource: "funnel", role: "courier", level: "none", allowedActions: [] },
  { resource: "funnel", role: "agency", level: "none", allowedActions: [] },

  // Pixels Facebook Meta (Prompt 05-Px)
  // Droits stricts : Admin et Co-Admin ajoutent/modifient/suppriment, Manager en lecture seule, autres exclus
  { resource: "pixels", role: "owner", level: "full", allowedActions: ["view", "create", "update", "delete"] },
  { resource: "pixels", role: "admin", level: "full", allowedActions: ["view", "create", "update", "delete"] },
  { resource: "pixels", role: "manager", level: "read", allowedActions: ["view"] },
  { resource: "pixels", role: "closer", level: "none", allowedActions: [] },
  { resource: "pixels", role: "rider", level: "none", allowedActions: [] },
  { resource: "pixels", role: "courier", level: "none", allowedActions: [] },
  { resource: "pixels", role: "agency", level: "none", allowedActions: [] },
];

/**
 * Vérifie si un rôle possède une action sur une ressource (Refus par défaut).
 */
export function hasPermission(role: UserRole, resource: Resource, action: Action = "view"): boolean {
  const normRole = role === "courier" ? "rider" : role;
  const rule = PERMISSIONS_MATRIX.find(
    (p) => (p.role === normRole || (normRole === "rider" && p.role === "courier")) && p.resource === resource
  );
  if (!rule || rule.level === "none") return false;
  return rule.allowedActions.includes(action);
}

/**
 * Récupère le niveau d'accès d'un rôle sur une ressource
 */
export function getAccessLevel(role: UserRole, resource: Resource): AccessLevel {
  const normRole = role === "courier" ? "rider" : role;
  const rule = PERMISSIONS_MATRIX.find(
    (p) => (p.role === normRole || (normRole === "rider" && p.role === "courier")) && p.resource === resource
  );
  return rule ? rule.level : "none";
}

/**
 * Vérifie si le rôle a le droit de voir le bouton aperçu vitrine (Œil)
 * Réservé à Admin, Co-admin et Manager
 */
export function canViewStorefrontEye(role: UserRole): boolean {
  return role === "owner" || role === "admin" || role === "manager";
}

/**
 * Vérifie si le rôle peut modifier les horaires de travail de l'équipe (Prompts 05-D & 05-H)
 * Réservé à l'Admin propriétaire (owner)
 */
export function canManageTeamSchedules(role: UserRole): boolean {
  return role === "owner";
}

/**
 * Règle stricte Prompt 05-H : SEUL l'Admin propriétaire (owner) peut activer le dimanche.
 * Co-admin et Manager ont un accès en lecture seule.
 */
export function canActivateSunday(role: UserRole): boolean {
  return role === "owner";
}

/**
 * Règle Prompt 05-P : SEUL l'Admin propriétaire (owner) peut modifier l'éligibilité des pays
 * de sa boutique (table shop_countries).
 */
export function canManageShopCountries(role: UserRole): boolean {
  return role === "owner";
}

/**
 * Règle Prompt 05-M : Droits de modification et de gestion d'une boutique.
 * - Admin propriétaire (owner) : modifie tout (slug, nom, logo, statut, suppression).
 * - Co-admin (admin) : modifie nom, description, logo, contact (pas suppression ni slug critique).
 * - Manager, closeuses, livreurs et agences : strictement AUCUN accès en modification (403).
 */
export function canEditStore(role: UserRole): boolean {
  return role === "owner" || role === "admin";
}

export function canChangeStoreSlug(role: UserRole): boolean {
  return role === "owner";
}

export function canDeleteStore(role: UserRole): boolean {
  return role === "owner";
}

export function canChangeStoreCountry(role: UserRole, orderCount: number): boolean {
  return (role === "owner" || role === "admin") && orderCount === 0;
}


/**
 * Transitions de statut autorisées selon le rôle de l'utilisateur (Prompt 05-T).
 * Refus strict par défaut.
 * - Closeuse : Confirmée, Préparée, Injoignable, Reportée, Annulée.
 * - Livreur / Agence : Remise, En route, Livrée, Retournée (uniquement pour les commandes qui lui sont assignées).
 * - Admin / Owner : toutes transitions autorisées.
 */
export function canTransitionOrderStatus(
  role: UserRole,
  targetStatus: string,
  isAssignedToUser: boolean = true
): boolean {
  if (role === "owner" || role === "admin") {
    return true;
  }

  if (role === "closer") {
    const allowedCloserStatuses = ["confirmed", "prepared", "unreachable", "postponed", "cancelled"];
    return allowedCloserStatuses.includes(targetStatus);
  }

  if (role === "rider" || role === "courier" || role === "agency") {
    if (!isAssignedToUser) {
      return false; // Règle stricte : livreur/agence uniquement pour les commandes qui lui sont assignées
    }
    const allowedCourierStatuses = ["handed_over", "in_transit", "delivered", "returned"];
    return allowedCourierStatuses.includes(targetStatus);
  }

  if (role === "manager") {
    const allowedManagerStatuses = [
      "confirmed",
      "prepared",
      "unreachable",
      "postponed",
      "cancelled",
      "handed_over",
    ];
    return allowedManagerStatuses.includes(targetStatus);
  }

  return false;
}

/**
 * Droits d'accès au module Performance Produit / Scaling (Prompt 05-G)
 */
export function canViewScaling(role: UserRole): boolean {
  return role === "owner" || role === "admin" || role === "manager";
}

export function canManageScaling(role: UserRole): boolean {
  return role === "owner" || role === "admin";
}

/**
 * Droits d'accès à l'Entonnoir de Conversion (Prompt 05-E)
 */
export function canViewFunnel(role: UserRole): boolean {
  return role === "owner" || role === "admin" || role === "manager";
}

export function canManageFunnel(role: UserRole): boolean {
  return role === "owner" || role === "admin";
}

/**
 * Droits de suppression de compte par l'utilisateur (Prompt 05-D)
 * - Tout utilisateur peut initier sa suppression de compte.
 * - MAIS si l'utilisateur est Admin propriétaire ("owner") et qu'il possède une équipe active,
 *   il DOIT transférer la propriété avant de pouvoir supprimer son compte.
 */
export function canDeleteAccount(
  role: UserRole,
  activeTeamMembersCount: number = 0
): { allowed: boolean; reason?: string } {
  if (role === "owner" && activeTeamMembersCount > 0) {
    return {
      allowed: false,
      reason:
        "En tant qu'administrateur propriétaire avec une équipe active, vous devez obligatoirement transférer la propriété de votre boutique à un co-admin avant de supprimer votre compte.",
    };
  }
  return { allowed: true };
}

/**
 * Droits d'accès aux Pixels Facebook Meta (Prompt 05-Px)
 * - Admin et Co-Admin (owner / admin) : ajout, modification, suppression.
 * - Manager : lecture seule.
 * - Autres rôles : aucun accès.
 */
export function canViewPixels(role: UserRole): boolean {
  return role === "owner" || role === "admin" || role === "manager";
}

export function canManagePixels(role: UserRole): boolean {
  return role === "owner" || role === "admin";
}

/**
 * Droits d'accès aux Relances / Rappels (Prompt 05-RL)
 * - Closeuse : ses propres rappels et ses commandes.
 * - Manager : toute l'équipe, réassignation, tableau anti-abus.
 * - Admin / Owner : tout, y compris réouverture de commande rejetée.
 * - Livreurs et agences : strictement aucun accès (false).
 */
export function canAccessFollowups(role: UserRole): boolean {
  return role === "owner" || role === "admin" || role === "manager" || role === "closer";
}

export function canReassignFollowups(role: UserRole): boolean {
  return role === "owner" || role === "admin" || role === "manager";
}

export function canReopenRejectedOrders(
  role: UserRole,
  isCorrectedPhoneSubmitted: boolean = false,
  reopenCount: number = 0
): boolean {
  if (role === "owner" || role === "admin" || role === "manager") {
    return true;
  }
  if (role === "closer") {
    return isCorrectedPhoneSubmitted && reopenCount === 0;
  }
  return false;
}

export function canViewCloserPerformance(role: UserRole): boolean {
  return role === "owner" || role === "admin" || role === "manager";
}





