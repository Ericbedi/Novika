"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/server/data/types";
import {
  getNavigationConfig,
  MOCK_NAV_COUNTS,
  NavItemConfig,
  NavGroupConfig,
} from "@/config/navigation";

interface SidebarNavProps {
  basePath: string;
  activeRole: UserRole;
  onNavigate?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileDrawer?: boolean;
  className?: string;
  onOpenSearch?: () => void;
  onToggleNotifications?: (rect?: DOMRect) => void;
  isNotificationsOpen?: boolean;
  unreadNotificationsCount?: number;
}

export function SidebarNav({
  basePath,
  activeRole,
  onNavigate,
  isCollapsed = false,
  onToggleCollapse,
  isMobileDrawer = false,
  className,
  onOpenSearch,
  onToggleNotifications,
  isNotificationsOpen = false,
  unreadNotificationsCount = 3,
}: SidebarNavProps) {
  const pathname = usePathname();
  const config = getNavigationConfig(basePath, activeRole);
  const notifBtnRef = useRef<HTMLButtonElement>(null);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent));
    }
  }, []);

  // Déterminer quel groupe doit être ouvert par défaut (celui qui contient la route active)
  const findActiveGroupId = (): string | null => {
    for (const group of config.groups) {
      for (const item of group.items) {
        const fullHref = `${basePath}${item.pathSuffix}`;
        if (pathname === fullHref || (item.pathSuffix && pathname.startsWith(fullHref))) {
          return group.id;
        }
      }
    }
    return null;
  };

  const [openGroupId, setOpenGroupId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("novika_sidebar_open_group") || localStorage.getItem("afribuilder_sidebar_open_group");
      if (saved) return saved;
    }
    return findActiveGroupId() || config.groups[0]?.id || null;
  });

  // Mise à jour de l'accordéon si la route change
  useEffect(() => {
    const activeGroup = findActiveGroupId();
    if (activeGroup && activeGroup !== openGroupId) {
      setOpenGroupId(activeGroup);
      if (typeof window !== "undefined") {
        localStorage.setItem("novika_sidebar_open_group", activeGroup);
      }
    }
  }, [pathname, basePath]);

  const toggleGroup = (groupId: string) => {
    setOpenGroupId((prev) => {
      const next = prev === groupId ? null : groupId;
      if (typeof window !== "undefined") {
        if (next) localStorage.setItem("novika_sidebar_open_group", next);
        else localStorage.removeItem("novika_sidebar_open_group");
      }
      return next;
    });
  };

  // Filtrer les éléments par rôle actif
  const isItemAllowed = (item: NavItemConfig) => item.allowedRoles.includes(activeRole);
  const isGroupAllowed = (group: NavGroupConfig) => {
    if (!group.allowedRoles.includes(activeRole)) return false;
    return group.items.some(isItemAllowed);
  };

  const allowedStandalone = config.standaloneRoot.filter(isItemAllowed);
  const allowedGroups = config.groups.filter(isGroupAllowed);

  const isFounderDemoStore = basePath.includes("lome-glow");
  const effectiveUnreadNotifications = isFounderDemoStore ? unreadNotificationsCount : 0;

  // Vérifier si un groupe a une action en attente (badge > 0)
  const groupHasPendingAction = (group: NavGroupConfig): boolean => {
    if (!isFounderDemoStore) return false;
    return group.items.some((item) => {
      if (!isItemAllowed(item) || !item.badgeKey) return false;
      return (MOCK_NAV_COUNTS[item.badgeKey] || 0) > 0;
    });
  };

  // Rendu d'une pastille de compteur normalisée (hauteur 20px, min-w 24px, texte 12px semi-gras)
  const renderBadge = (item: NavItemConfig) => {
    if (!item.badgeKey || !isFounderDemoStore) return null;
    const count = MOCK_NAV_COUNTS[item.badgeKey] || 0;
    if (count <= 0) return null;

    const displayCount = count > 99 ? "99+" : count.toString();
    const accessibleLabel = item.badgeLabel
      ? item.badgeLabel(count)
      : `${count} élément${count > 1 ? "s" : ""}`;

    return (
      <span
        role="status"
        aria-label={accessibleLabel}
        title={accessibleLabel}
        className={cn(
          "inline-flex items-center justify-center h-5 min-w-[24px] px-1.5 rounded-full text-[12px] font-semibold leading-none shrink-0 ml-auto transition-colors",
          item.isUrgentBadge
            ? "bg-[#C2410C] text-white shadow-2xs font-bold"
            : "bg-black/[0.06] text-[#666660]"
        )}
      >
        {displayCount}
      </span>
    );
  };

  const itemHeightClass = isMobileDrawer
    ? "h-[44px]"
    : "h-[38px] max-[700px]:h-[34px]";

  const handleNotificationsClick = () => {
    if (onToggleNotifications) {
      const rect = notifBtnRef.current?.getBoundingClientRect();
      onToggleNotifications(rect);
    }
  };

  return (
    <nav
      aria-label="Menu principal"
      className={cn(
        "flex flex-col select-none overflow-x-hidden min-w-0 transition-all duration-200",
        isCollapsed ? "w-[72px]" : "w-full",
        className
      )}
    >
      {/* Bouton de basculement Réduit / Déplié (bureau) */}
      {onToggleCollapse && (
        <div className="hidden lg:flex items-center justify-end px-2 py-0.5 mb-1 shrink-0">
          <button
            id="btn-sidebar-collapse-toggle"
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Développer le menu (256px)" : "Réduire le menu (72px)"}
            aria-label={isCollapsed ? "Développer le menu" : "Réduire le menu"}
            className="p-1 rounded-lg text-[#888880] hover:text-[#111111] hover:bg-black/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/[0.15] cursor-pointer"
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* ENTRÉES RACINES DÉPLACÉES DANS LA NAVIGATION : RECHERCHER & NOTIFICATIONS */}
      {/* ======================================================== */}
      <div id="nav-top-divider" className="space-y-1 mb-2 pb-2 border-b border-black/[0.08] min-w-0">
        {/* Entrée 1 : Rechercher (44px, icône 20px, Ctrl K) */}
        <button
          type="button"
          id="btn-nav-search"
          onClick={() => {
            if (onOpenSearch) onOpenSearch();
            if (onNavigate) onNavigate();
          }}
          title={isCollapsed ? "Rechercher (Ctrl K)" : undefined}
          className={cn(
            "w-full h-11 flex items-center gap-3 px-2.5 rounded-xl text-[14px] font-semibold text-[#111111] hover:bg-black/[0.04] transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/[0.15] cursor-pointer text-left min-w-0",
            isCollapsed && "justify-center px-0"
          )}
        >
          <Search className="h-5 w-5 text-[#666660] group-hover:text-[#111111] shrink-0" />
          {!isCollapsed && (
            <>
              <span className="truncate flex-1 min-w-0 font-medium">Rechercher</span>
              <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/[0.06] text-[#666660] border border-black/[0.08] shrink-0">
                {isMac ? "⌘ K" : "Ctrl K"}
              </kbd>
            </>
          )}
        </button>

        {/* Entrée 2 : Notifications (44px, icône 20px, pastille compteur) */}
        <button
          ref={notifBtnRef}
          type="button"
          id="btn-nav-notifications"
          onClick={handleNotificationsClick}
          title={isCollapsed ? `Notifications (${effectiveUnreadNotifications})` : undefined}
          className={cn(
            "w-full h-11 flex items-center gap-3 px-2.5 rounded-xl text-[14px] font-semibold text-[#111111] hover:bg-black/[0.04] transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/[0.15] cursor-pointer text-left relative min-w-0",
            isNotificationsOpen && "bg-black/[0.06]",
            isCollapsed && "justify-center px-0"
          )}
        >
          <div className="relative shrink-0">
            <Bell className="h-5 w-5 text-[#666660] group-hover:text-[#111111]" />
            {isCollapsed && effectiveUnreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#C2410C]" />
            )}
          </div>
          {!isCollapsed && (
            <>
              <span className="truncate flex-1 min-w-0 font-medium">Notifications</span>
              {effectiveUnreadNotifications > 0 && (
                <span
                  role="status"
                  aria-label={`${effectiveUnreadNotifications} notifications non lues`}
                  className={cn(
                    "inline-flex items-center justify-center h-5 min-w-[22px] px-1.5 rounded-full text-[11px] font-bold shrink-0 ml-auto",
                    effectiveUnreadNotifications > 0
                      ? "bg-[#C2410C] text-white"
                      : "bg-black/[0.06] text-[#666660]"
                  )}
                >
                  {effectiveUnreadNotifications > 9 ? "9+" : effectiveUnreadNotifications}
                </span>
              )}
            </>
          )}
        </button>
      </div>

      <div className="space-y-3 min-w-0 overflow-x-hidden">
        {/* Éléments racine sans sous-menu (Accueil, Boutique) */}
        <div className="space-y-0.5 min-w-0">
          {allowedStandalone.map((item) => {
            const Icon = item.icon;
            const fullHref = `${basePath}${item.pathSuffix}`;
            const isActive =
              item.pathSuffix === ""
                ? pathname === basePath
                : pathname === fullHref || pathname.startsWith(`${fullHref}/`);

            const storeSlug = basePath.replace("/app/", "");
            const isStoreItem = item.id === "nav-store";
            const canPreview = activeRole === "owner" || activeRole === "admin";

            if (isStoreItem && !isCollapsed) {
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between rounded-xl transition-all group min-w-0 pr-1.5",
                    itemHeightClass,
                    isActive
                      ? "bg-[#111111] text-[#FAF8F5] shadow-xs font-bold"
                      : "text-[#111111] hover:bg-black/[0.04]"
                  )}
                >
                  <Link
                    href={fullHref}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    title={item.name}
                    className="flex items-center gap-2.5 px-2.5 flex-1 min-w-0 h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/[0.15] rounded-xl text-[14px] font-semibold"
                  >
                    <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-[#FAF8F5]" : "text-[#666660] group-hover:text-[#111111]")} />
                    <span className="truncate flex-1 min-w-0">{item.name}</span>
                  </Link>

                  {canPreview && (
                    <a
                      id="btn-sidebar-store-preview"
                      href={`/boutique/${storeSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Voir la boutique (s'ouvre dans un nouvel onglet)"
                      aria-label="Voir la boutique (s'ouvre dans un nouvel onglet)"
                      className={cn(
                        "p-1.5 rounded-lg transition-colors shrink-0 ml-1 flex items-center justify-center min-w-[32px] h-[32px]",
                        isActive
                          ? "text-[#FAF8F5]/80 hover:text-white hover:bg-white/10"
                          : "text-[#888880] hover:text-[#111111] hover:bg-black/5"
                      )}
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.id}
                href={fullHref}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                title={item.name}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 rounded-xl text-[14px] font-semibold transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/[0.15] min-w-0",
                  itemHeightClass,
                  isActive
                    ? "bg-[#111111] text-[#FAF8F5] shadow-xs font-bold"
                    : "text-[#111111] hover:bg-black/[0.04]"
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-[#FAF8F5]" : "text-[#666660] group-hover:text-[#111111]")} />
                {!isCollapsed && <span className="truncate flex-1 min-w-0">{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* Groupes repliables (Ventes, Produits, Finances, Stats) */}
        <div className="space-y-2 pt-1 min-w-0">
          {allowedGroups.map((group) => {
            const GroupIcon = group.icon;
            const isOpen = openGroupId === group.id && !isCollapsed;
            const allowedItems = group.items.filter(isItemAllowed);
            const hasPending = groupHasPendingAction(group);
            const groupId = `nav-group-${group.id}`;

            return (
              <div key={group.id} className="min-w-0 overflow-x-hidden">
                <button
                  type="button"
                  id={groupId}
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                  title={group.name}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wider text-[#666660] hover:text-[#111111] hover:bg-black/[0.03] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/[0.15] cursor-pointer min-w-0",
                    itemHeightClass,
                    isCollapsed ? "justify-center px-0" : "justify-between"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 truncate">
                    <GroupIcon className="h-4 w-4 text-[#888880] shrink-0" />
                    {!isCollapsed && <span className="truncate">{group.name}</span>}
                  </div>

                  {!isCollapsed && (
                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                      {hasPending && !isOpen && (
                        <span className="h-2 w-2 rounded-full bg-[#C2410C]" />
                      )}
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 text-[#888880] transition-transform duration-200 shrink-0",
                          isOpen && "rotate-90"
                        )}
                      />
                    </div>
                  )}
                </button>

                {/* Sous-éléments ouverts */}
                {isOpen && (
                  <div className="pl-4 pr-1 mt-1 space-y-0.5 border-l border-black/[0.08] ml-4 min-w-0 overflow-x-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    {allowedItems.map((item) => {
                      const ItemIcon = item.icon;
                      const fullHref = `${basePath}${item.pathSuffix}`;
                      const isActive =
                        item.pathSuffix === ""
                          ? pathname === basePath
                          : pathname === fullHref || pathname.startsWith(`${fullHref}/`);

                      return (
                        <Link
                          key={item.id}
                          href={fullHref}
                          onClick={onNavigate}
                          aria-current={isActive ? "page" : undefined}
                          title={item.name}
                          className={cn(
                            "flex items-center justify-between gap-2 px-2.5 rounded-xl text-[13px] font-medium transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/[0.15] min-w-0",
                            itemHeightClass,
                            isActive
                              ? "bg-[#111111] text-[#FAF8F5] font-bold shadow-2xs"
                              : "text-[#333330] hover:bg-black/[0.04] hover:text-[#111111]"
                          )}
                        >
                          <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                            <ItemIcon
                              className={cn(
                                "h-3.5 w-3.5 shrink-0 transition-colors",
                                isActive ? "text-[#FAF8F5]" : "text-[#888880] group-hover:text-[#111111]"
                              )}
                            />
                            <span className="truncate">{item.shortName || item.name}</span>
                          </div>
                          {renderBadge(item)}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
