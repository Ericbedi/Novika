"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  LogOut,
  Menu,
  Settings,
  Store as StoreIcon,
  X,
  Bell,
  Sparkles,
  ShieldCheck,
  Check,
  AlertTriangle,
  ArrowRight,
  MessageSquarePlus,
  Plus,
  User,
  HelpCircle,
  Download,
  ExternalLink,
  Search,
  Building2,
  ArrowUpRight,
  Package,
  Tag,
  TrendingUp,
  Users,
  Laptop,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_STORES, CURRENT_USER } from "@/mock-data/stores";
import { Store, UserRole, USER_ROLE_LABELS } from "@/server/data/types";
import { CountryFlagSvg } from "@/components/app/bits";
import { SidebarNav } from "./sidebar-nav";
import { BetaFeedbackModal } from "@/components/app/beta-feedback-modal";
import { BetaInfoModal } from "./beta-info-modal";

// L'application n'est plus en bêta privée : entrée du menu masquée (repasser à true pour réafficher)
const SHOW_BETA_MENU = false;
import {
  performLogout,
  NOVIKA_AUTH_BROADCAST,
  NOVIKA_LOGOUT_SIGNAL_KEY,
  TAB_CLIENT_ID,
} from "@/lib/auth-client";
import { ROUTES } from "@/config/routes";
import { CommandPalette } from "./command-palette";
import { NotificationsPanel } from "./notifications-panel";
import { CreateStoreModal } from "@/components/app/create-store-modal";
import { PWAInstallProvider, usePWAInstall } from "@/lib/pwa-install-context";
import { brandConfig } from "@/config/brand";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/client";
import { notificationSound } from "@/lib/notification-sound";

interface AppContextType {
  activeStore: Store;
  setActiveStore: (store: Store) => void;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  stores: Store[];
  currentUser?: any;
  openCreateStoreModal: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppShell");
  }
  return context;
}

export function AppShell({
  children,
  initialStoreSlug = "lome-glow",
}: {
  children: React.ReactNode;
  initialStoreSlug?: string;
}) {
  return (
    <PWAInstallProvider>
      <AppShellInner initialStoreSlug={initialStoreSlug}>
        {children}
      </AppShellInner>
    </PWAInstallProvider>
  );
}

const DEFAULT_EMPTY_STORE: Store = {
  id: "store_empty",
  name: "Nouvelle Boutique",
  slug: "",
  country: "TG",
  countryName: "Togo",
  flag: "🇹🇬",
  currency: "XOF",
  whatsappNumber: "",
  role: "owner",
};

function AppShellInner({
  children,
  initialStoreSlug = "",
}: {
  children: React.ReactNode;
  initialStoreSlug?: string;
}) {
  const [storesList, setStoresList] = useState<Store[]>(MOCK_STORES);
  const [activeStore, setActiveStore] = useState<Store>(() => {
    const found = MOCK_STORES.find((s) => s.slug === initialStoreSlug);
    return found || MOCK_STORES[0] || DEFAULT_EMPTY_STORE;
  });
  const [currentUser, setCurrentUser] = useState(CURRENT_USER);
  const [activeRole, setActiveRoleState] = useState<UserRole>("owner");
  const [isUserVerified, setIsUserVerified] = useState(true);

  // Modales et panneaux
  const [isCreateStoreOpen, setIsCreateStoreOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isBetaModalOpen, setIsBetaModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationsTriggerRect, setNotificationsTriggerRect] = useState<DOMRect | null>(null);

  const userMenuRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isUnverifiedFromUrl = searchParams ? searchParams.get("unverified") === "true" : false;

  const { canInstall, isIOS, promptInstall } = usePWAInstall();

  // Écouteur global pour raccourci clavier Ctrl+K / Cmd+K / "/"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "k" && (e.ctrlKey || e.metaKey)) ||
        (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName))
      ) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      let userEmail = localStorage.getItem("novika_user_email") || "";
      let userFullName = localStorage.getItem("novika_user_fullname");

      if (!userEmail) {
        try {
          const rawUser = localStorage.getItem("novika_user");
          if (rawUser) {
            const parsedUser = JSON.parse(rawUser);
            if (parsedUser?.email) {
              userEmail = parsedUser.email;
              userFullName = parsedUser.fullName || parsedUser.name || userFullName;
            }
          }
        } catch (err) {
          console.warn("[App Shell] Erreur parsing novika_user:", err);
        }
      }

      userFullName = userFullName || (userEmail ? userEmail.split("@")[0] : null);

      if (userEmail) {
        const displayName = userFullName || userEmail.split("@")[0];
        setCurrentUser({
          id: `usr_${userEmail.replace(/[^a-zA-Z0-9]/g, "_")}`,
          name: displayName,
          email: userEmail,
          avatar: "/avatars/avatar-default.jpg",
          initials: displayName.slice(0, 2).toUpperCase(),
          defaultRole: "owner" as const,
        });
      }

      let userStores: Store[] = [];
      const customStoresKey = userEmail ? `novika_user_stores_${userEmail}` : "";
      if (customStoresKey) {
        const savedCustomStores = localStorage.getItem(customStoresKey);
        if (savedCustomStores) {
          try {
            const parsed = JSON.parse(savedCustomStores) as Store[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              userStores = parsed;
            }
          } catch (err) {
            console.warn("[App Shell] Erreur lecture custom stores:", err);
          }
        }
      }

      // Si aucune boutique dans le localStorage pour cet utilisateur, vérifier MOCK_STORES ou fallback de la route active
      if (userStores.length === 0) {
        if (Array.isArray(MOCK_STORES) && MOCK_STORES.length > 0) {
          userStores = MOCK_STORES;
        } else if (initialStoreSlug) {
          const fallbackStore: Store = {
            id: `store_${initialStoreSlug}`,
            name: initialStoreSlug.charAt(0).toUpperCase() + initialStoreSlug.slice(1),
            slug: initialStoreSlug,
            country: "TG",
            countryName: "Togo",
            flag: "🇹🇬",
            currency: "XOF",
            whatsappNumber: "+22890000000",
            role: "owner",
            status: "active",
          };
          userStores = [fallbackStore];
        }
      }

      setStoresList(userStores);
      if (userStores.length > 0) {
        const found = userStores.find((s) => s.slug === initialStoreSlug) || userStores[0];
        setActiveStore(found);
      } else {
        router.push("/nouvelle-boutique");
      }

      const savedRole = (localStorage.getItem("novika_active_role") || localStorage.getItem("afribuilder_active_role")) as UserRole | null;
      const urlRole = searchParams?.get("role") as UserRole | null;
      const allowedRolesList: UserRole[] = ["owner", "closer", "rider", "agency"];
      if (urlRole && allowedRolesList.includes(urlRole)) {
        setActiveRoleState(urlRole);
      } else if (savedRole && allowedRolesList.includes(savedRole)) {
        setActiveRoleState(savedRole);
      } else {
        setActiveRoleState("owner");
      }
      const verified = localStorage.getItem("novika_user_verified") || localStorage.getItem("afribuilder_user_verified");
      const urlUnverified =
        window.location.search.includes("unverified=true") ||
        window.location.href.includes("unverified=true");
      if (verified === "false" || urlUnverified) {
        setIsUserVerified(false);
      } else {
        setIsUserVerified(true);
      }

      const savedCollapse = localStorage.getItem("novika_sidebar_collapsed") || localStorage.getItem("afribuilder_sidebar_collapsed");
      if (savedCollapse === "true") {
        setIsSidebarCollapsed(true);
      }
    }
  }, [pathname]);

  // Fermer les popovers au clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Supabase Realtime: Écoute des nouvelles commandes COD pour notification sonore instantanée
  useEffect(() => {
    if (!activeStore?.slug) return;
    try {
      const supabase = createClient();
      const channel = supabase
        .channel(`novika-orders-${activeStore.slug}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "orders",
          },
          (payload) => {
            // Déclenche le son distinctif Kelio (ordre d'encaissement COD)
            notificationSound.playOrderSound();
            console.log("[Supabase Realtime] Nouvelle commande reçue:", payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn("[Supabase Realtime] Erreur souscription commandes:", err);
    }
  }, [activeStore?.slug]);

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    if (typeof window !== "undefined") {
      localStorage.setItem("novika_active_role", role);
    }
  };

  const storeSlug = activeStore?.slug || "";
  const basePath = storeSlug ? `/app/${storeSlug}` : "/app";

  // Permissions par rôle
  const isOwnerOrAdmin = activeRole === "owner" || activeRole === "admin";
  const canViewStorefront = isOwnerOrAdmin || activeRole === "agency";

  const handleCreateStoreSuccess = async (newStoreData: {
    name: string;
    slug: string;
    country: string;
    currency: string;
    whatsapp?: string;
  }) => {
    const userEmail = typeof window !== "undefined" ? localStorage.getItem("novika_user_email") || "owner@novika.com" : "owner@novika.com";

    const newStore: Store = {
      id: `store_${newStoreData.country.toLowerCase()}_${Date.now()}`,
      name: newStoreData.name,
      slug: newStoreData.slug,
      country: newStoreData.country,
      countryName: newStoreData.country === "TG" ? "Togo" : newStoreData.country,
      flag: "🌍",
      currency: newStoreData.currency,
      whatsappNumber: newStoreData.whatsapp || "+22890000000",
      role: "owner",
    };

    setStoresList((prev) => {
      const updated = [...prev, newStore];
      if (typeof window !== "undefined") {
        localStorage.setItem(`novika_user_stores_${userEmail}`, JSON.stringify(updated));
      }
      return updated;
    });

    setActiveStore(newStore);
    setIsCreateStoreOpen(false);

    // Synchronisation vers Supabase
    try {
      await fetch("/api/stores/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newStore,
          ownerEmail: userEmail,
        }),
      });
    } catch (e) {
      console.warn("[AppShell] Store create sync notice:", e);
    }

    router.push(`/app/${newStore.slug}`);
  };

  const handleLogout = async (allDevices = false) => {
    if (typeof window !== "undefined") {
      const offlinePending = localStorage.getItem("afribuilder_offline_queue");
      if (offlinePending) {
        try {
          if (JSON.parse(offlinePending).length > 0) {
            const confirm = window.confirm(
              "Attention : vous avez des commandes ou actions non synchronisées en mode hors-ligne. Vous risquez de perdre ces données en vous déconnectant maintenant. Confirmer la déconnexion ?"
            );
            if (!confirm) return;
          }
        } catch {}
      }
    }

    await performLogout({ allDevices, reason: "voluntary" });
  };

  // Écouteurs de synchronisation multi-onglets et cycle de vie PWA (Prompt 06-L)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let bc: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel(NOVIKA_AUTH_BROADCAST);
        bc.onmessage = (event) => {
          if (event.data?.type === "LOGOUT") {
            if (event.data?.sourceId === TAB_CLIENT_ID) return;
            const msg = event.data?.allDevices ? "all_devices_logged_out" : "logged_out";
            window.location.href = `${ROUTES.login}?message=${msg}`;
          }
        };
      } catch {}
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === NOVIKA_LOGOUT_SIGNAL_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.sourceId === TAB_CLIENT_ID) return;
          const msg = parsed.allDevices ? "all_devices_logged_out" : "logged_out";
          window.location.href = `${ROUTES.login}?message=${msg}`;
        } catch {
          window.location.href = `${ROUTES.login}?message=logged_out`;
        }
      }
    };
    window.addEventListener("storage", handleStorage);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const email =
          localStorage.getItem("novika_user_email") ||
          localStorage.getItem("afribuilder_user_email");
        const verified =
          localStorage.getItem("novika_user_verified") ||
          localStorage.getItem("afribuilder_user_verified");
        if (!email && verified !== "true") {
          router.push(`${ROUTES.login}?message=session_expired`);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      if (bc) bc.close();
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsNotificationsOpen(false);
  }, [pathname]);

  return (
    <AppContext.Provider
      value={{
        activeStore,
        setActiveStore,
        activeRole,
        setActiveRole,
        stores: storesList,
        currentUser,
        openCreateStoreModal: () => {
          // L'assistant en 3 étapes ; la limite de boutiques par compte est contrôlée côté serveur
          router.push("/nouvelle-boutique");
        },
      }}
    >
      <div className="min-h-screen bg-[#F3EFE6] text-[#111111] flex selection:bg-[#1F3A26] selection:text-[#FAF8F5]">
        {/* ======================================================== */}
        {/* BOUTON FLOTTANT MOBILE (44px, zéro barre supérieure) */}
        {/* ======================================================== */}
        <button
          type="button"
          id="btn-mobile-drawer-toggle"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Ouvrir le menu de navigation"
          className="fixed top-3 left-3 z-40 md:hidden h-11 w-11 rounded-full bg-white/95 hover:bg-white text-[#111111] border border-black/[0.1] shadow-md flex items-center justify-center backdrop-blur-md cursor-pointer transition-transform active:scale-95"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* ======================================================== */}
        {/* SIDEBAR FIXE COMPACTE (256px bureau / 72px tablette ou réduit) */}
        {/* ======================================================== */}
        <aside
          aria-label="Barre latérale"
          className={cn(
            "hidden md:flex md:flex-col md:fixed md:inset-y-0 md:z-40 border-r border-black/[0.08] bg-[#FAF8F5] transition-all duration-300 overflow-x-hidden min-w-0 select-none",
            isSidebarCollapsed ? "w-[72px]" : "md:w-[72px] lg:w-[256px]"
          )}
        >
          {/* ======================================================== */}
          {/* EN-TÊTE SIMPLIFIÉ (56px, Contenu unique : Logo + Nom Kelio, lien vers Accueil) */}
          {/* ======================================================== */}
          <div id="sidebar-header" className="h-14 px-3 flex items-center shrink-0 border-b border-black/[0.08] min-w-0">
            <Link
              href={basePath}
              id="sidebar-logo-link"
              title={brandConfig.name}
              className={cn(
                "flex items-center gap-2 min-w-0 group",
                isSidebarCollapsed ? "justify-center w-full" : ""
              )}
            >
              <Logo
                variant={isSidebarCollapsed ? "icon" : "full"}
                tone="light"
                size={28}
                className="group-hover:scale-105 transition-transform"
              />
            </Link>
          </div>

          {/* ======================================================== */}
          {/* ZONE DE NAVIGATION (Recherche + Notifications au-dessus d'Accueil + Accordéon) */}
          {/* ======================================================== */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 min-w-0">
            <SidebarNav
              basePath={basePath}
              activeRole={activeRole}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => {
                setIsSidebarCollapsed((prev) => {
                  const next = !prev;
                  if (typeof window !== "undefined") {
                    localStorage.setItem("novika_sidebar_collapsed", String(next));
                  }
                  return next;
                });
              }}
              onOpenSearch={() => setIsCommandPaletteOpen(true)}
              onToggleNotifications={(rect) => {
                setNotificationsTriggerRect(rect || null);
                setIsNotificationsOpen((prev) => !prev);
              }}
              isNotificationsOpen={isNotificationsOpen}
              unreadNotificationsCount={0}
            />
          </div>

          {/* ======================================================== */}
          {/* ZONE 3 : BAS FIXE (SÉPARÉ PAR UN TRAIT, ORDRE STRICT) */}
          {/* ======================================================== */}
          <div className="border-t border-black/[0.08] bg-[#FAF8F5] shrink-0 min-w-0 p-2 space-y-1.5">
            {/* Disposition Standard (écran normal, hauteur > 700px et mode développé) */}
            {!isSidebarCollapsed && (
              <div className="sidebar-bottom-standard flex-col space-y-0.5">
                {/* « Gérer mes boutiques » (owner et admin seulement) */}
                {isOwnerOrAdmin && (
                  <Link
                    href={`${basePath}/reglages/boutiques`}
                    id="sidebar-link-manage-stores"
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors group",
                      pathname.includes("/reglages/boutiques")
                        ? "bg-[#1F3A26] text-[#FAF8F5]"
                        : "text-[#111111] hover:bg-black/[0.04]"
                    )}
                    title="Gérer mes boutiques (créer, dupliquer, archiver, supprimer)"
                  >
                    <Building2
                      className={cn(
                        "h-4 w-4 shrink-0",
                        pathname.includes("/reglages/boutiques")
                          ? "text-[#FAF8F5]"
                          : "text-[#666660] group-hover:text-[#111111]"
                      )}
                    />
                    <span className="truncate">Gérer mes boutiques</span>
                  </Link>
                )}

                {/* 3. « Réglages » (owner et admin seulement) */}
                {isOwnerOrAdmin && (
                  <Link
                    href={`${basePath}/reglages`}
                    id="sidebar-link-settings"
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors group",
                      pathname === `${basePath}/reglages` ||
                        (pathname.startsWith(`${basePath}/reglages`) && !pathname.includes("/boutiques"))
                        ? "bg-[#1F3A26] text-[#FAF8F5]"
                        : "text-[#111111] hover:bg-black/[0.04]"
                    )}
                    title="Paramètres de la boutique"
                  >
                    <Settings
                      className={cn(
                        "h-4 w-4 shrink-0",
                        pathname === `${basePath}/reglages` ||
                          (pathname.startsWith(`${basePath}/reglages`) && !pathname.includes("/boutiques"))
                          ? "text-[#FAF8F5]"
                          : "text-[#666660] group-hover:text-[#111111]"
                      )}
                    />
                    <span className="truncate">Réglages</span>
                  </Link>
                )}
              </div>
            )}

            {/* Disposition Condensée : Écran court (< 700px) : 2 boutons icônes avec info-bulles */}
            {!isSidebarCollapsed && (
              <div className="sidebar-bottom-compact items-center justify-around gap-1 p-0.5 rounded-xl bg-white/70 border border-black/[0.06]">
                {isOwnerOrAdmin && (
                  <Link
                    href={`${basePath}/reglages/boutiques`}
                    title="Gérer mes boutiques"
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      pathname.includes("/reglages/boutiques")
                        ? "bg-[#1F3A26] text-[#FAF8F5]"
                        : "text-[#666660] hover:text-[#111111] hover:bg-black/[0.04]"
                    )}
                  >
                    <Building2 className="h-4 w-4" />
                  </Link>
                )}
                {isOwnerOrAdmin && (
                  <Link
                    href={`${basePath}/reglages`}
                    title="Réglages"
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      pathname === `${basePath}/reglages` ||
                        (pathname.startsWith(`${basePath}/reglages`) && !pathname.includes("/boutiques"))
                        ? "bg-[#1F3A26] text-[#FAF8F5]"
                        : "text-[#666660] hover:text-[#111111] hover:bg-black/[0.04]"
                    )}
                  >
                    <Settings className="h-4 w-4" />
                  </Link>
                )}
              </div>
            )}

            {/* En mode 72px réduit (tablette ou bascule) : icônes empilées */}
            {isSidebarCollapsed && (
              <div className="flex flex-col items-center gap-1">
                {isOwnerOrAdmin && (
                  <Link
                    href={`${basePath}/reglages/boutiques`}
                    title="Gérer mes boutiques"
                    className="p-1.5 rounded-lg text-[#666660] hover:text-[#111111] hover:bg-black/[0.04] transition-colors"
                  >
                    <Building2 className="h-4 w-4" />
                  </Link>
                )}
                {isOwnerOrAdmin && (
                  <Link
                    href={`${basePath}/reglages`}
                    title="Réglages"
                    className="p-1.5 rounded-lg text-[#666660] hover:text-[#111111] hover:bg-black/[0.04] transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                  </Link>
                )}
              </div>
            )}

            {/* 4. Bloc utilisateur (avatar, nom, rôle) ouvrant menu vers le haut */}
            <div className="relative pt-1 border-t border-black/[0.08]" ref={userMenuRef}>
              {/* Popover vers le HAUT */}
              {isUserMenuOpen && (
                <div
                  id="user-menu-popover"
                  role="menu"
                  className={cn(
                    "absolute bottom-full mb-2 z-50 rounded-2xl border border-black/[0.1] bg-[#FAF8F5] p-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150",
                    isSidebarCollapsed ? "left-0 w-64" : "left-0 right-0 min-w-[240px]"
                  )}
                >
                  {/* En-tête du menu utilisateur */}
                  <div className="p-2 border-b border-black/[0.08] bg-white/70 rounded-xl mb-1.5">
                    <p className="text-xs font-black text-[#111111] truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-[#666660] truncate">{currentUser.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-[#111111]">
                      <span className="px-1.5 py-0.5 rounded bg-black/[0.06]">
                        {USER_ROLE_LABELS[activeRole]}
                      </span>
                      <span className="text-[#888880]">·</span>
                      <span className="text-[#666660] truncate">{activeStore?.name || "Aucune boutique"}</span>
                    </div>
                  </div>

                  {/* Liens du profil */}
                  <div className="space-y-0.5">
                    <Link
                      href={`${basePath}/reglages?tab=profil`}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#222220] hover:bg-black/[0.04] transition-colors"
                    >
                      <User className="h-3.5 w-3.5 text-[#666660]" />
                      <span>Mon profil</span>
                    </Link>

                    {/* Entrée « Bêta privée » masquée par réglage (SHOW_BETA_MENU) : l'application n'est plus en bêta privée */}
                    {SHOW_BETA_MENU && (
                    <button
                      type="button"
                      id="btn-user-menu-beta-info"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsBetaModalOpen(true);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#222220] hover:bg-black/[0.04] transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-[#C2410C]" />
                        <span>Bêta privée</span>
                      </div>
                      <span className="h-2 w-2 rounded-full bg-[#C2410C]" title="Nouvelle version v0.9.4 disponible" />
                    </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsFeedbackModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#222220] hover:bg-black/[0.04] transition-colors text-left cursor-pointer"
                    >
                      <MessageSquarePlus className="h-3.5 w-3.5 text-[#C2410C]" />
                      <span>Donner mon avis</span>
                    </button>

                    <Link
                      href={`${basePath}/reglages?tab=support`}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#222220] hover:bg-black/[0.04] transition-colors"
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-[#666660]" />
                      <span>Aide et support</span>
                    </Link>

                    {/* Installer l'application */}
                    {(canInstall || isIOS) && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          promptInstall();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#0F766E] hover:bg-emerald-50 transition-colors cursor-pointer text-left"
                      >
                        <Download className="h-3.5 w-3.5 text-[#0F766E]" />
                        <span>Installer l'application</span>
                      </button>
                    )}
                  </div>

                  {/* Switcher de rôle pour tests */}
                  <div className="my-1.5 pt-1.5 border-t border-black/[0.08]">
                    <div className="flex items-center gap-1 px-1 mb-1 text-[9px] font-bold text-[#888880] uppercase tracking-wider">
                      <ShieldCheck className="h-3 w-3 text-[#111111]" />
                      <span>Rôle d'équipe</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {(["owner", "closer", "rider", "agency"] as UserRole[]).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setActiveRole(role)}
                          className={cn(
                            "py-1 text-[9px] font-bold rounded-lg transition-colors text-center border truncate cursor-pointer",
                            activeRole === role
                              ? "bg-[#1F3A26] text-[#FAF8F5] font-extrabold border-[#111111] shadow-2xs"
                              : "bg-white text-[#555550] border-black/[0.08] hover:border-black/20"
                          )}
                        >
                          {role === "owner"
                            ? "Admin"
                            : role === "closer"
                              ? "Closeur"
                              : role === "rider"
                                ? "Livreur"
                                : "Agence"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Options de déconnexion (Prompt 06-L) */}
                  <div className="pt-1.5 border-t border-black/[0.08] space-y-0.5">
                    <button
                      type="button"
                      id="btn-logout-all-devices"
                      onClick={() => handleLogout(true)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-[#666660] hover:text-rose-600 hover:bg-rose-50/70 transition-colors cursor-pointer text-left"
                    >
                      <Laptop className="h-3.5 w-3.5 text-[#888880]" />
                      <span>Me déconnecter de tous les appareils</span>
                    </button>
                    <button
                      type="button"
                      id="btn-user-logout"
                      onClick={() => handleLogout(false)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="h-3.5 w-3.5 text-rose-600" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Bouton déclencheur du profil */}
              <button
                type="button"
                id="btn-user-menu-trigger"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={cn(
                  "w-full flex items-center justify-between p-1.5 rounded-xl border border-black/[0.08] bg-white/80 hover:bg-white hover:border-black/20 transition-all text-left shadow-2xs cursor-pointer min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/15",
                  isSidebarCollapsed ? "justify-center p-1" : ""
                )}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="h-7 w-7 rounded-full bg-[#1F3A26] text-[#FAF8F5] flex items-center justify-center font-bold text-[10px] shadow-2xs shrink-0">
                    {currentUser.initials}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="truncate min-w-0 flex-1 hidden lg:block">
                      <p className="text-xs font-bold text-[#111111] truncate leading-tight">
                        {currentUser.name}
                      </p>
                      <p className="text-[9px] text-[#666660] truncate font-medium">
                        {USER_ROLE_LABELS[activeRole]}
                      </p>
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <ChevronUp
                    className={cn(
                      "h-3.5 w-3.5 text-[#666660] shrink-0 transition-transform duration-200 hidden lg:block",
                      isUserMenuOpen ? "rotate-180" : ""
                    )}
                  />
                )}
              </button>
            </div>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* TIROIR MOBILE HAMBURGER (w-72 max 85vw) */}
        {/* ======================================================== */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <div id="mobile-sidebar-drawer" className="fixed inset-y-0 left-0 w-[275px] max-w-[85vw] bg-[#FAF8F5] border-r border-black/[0.1] shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
              {/* Haut du tiroir mobile (même en-tête épuré Logo + Kelio + bouton fermeture) */}
              <div className="h-14 px-3.5 border-b border-black/[0.08] flex items-center justify-between shrink-0">
                <Link
                  href={basePath}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2"
                  title={brandConfig.name}
                >
                  <Logo variant="full" tone="light" size={28} />
                </Link>
                <button
                  type="button"
                  id="btn-mobile-drawer-close"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl text-[#666660] hover:bg-black/[0.04] cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation mobile (avec Rechercher et Notifications en tête) */}
              <div className="flex-1 overflow-y-auto p-2">
                <SidebarNav
                  basePath={basePath}
                  activeRole={activeRole}
                  isCollapsed={false}
                  isMobileDrawer={true}
                  onNavigate={() => setIsMobileMenuOpen(false)}
                  onOpenSearch={() => {
                    setIsMobileMenuOpen(false);
                    setIsCommandPaletteOpen(true);
                  }}
                  onToggleNotifications={(rect) => {
                    setNotificationsTriggerRect(rect || null);
                    setIsNotificationsOpen((prev) => !prev);
                  }}
                  isNotificationsOpen={isNotificationsOpen}
                  unreadNotificationsCount={0}
                />
              </div>

              {/* Bas du tiroir mobile */}
              <div className="p-3 border-t border-black/[0.08] bg-white/60 space-y-2">
                {isOwnerOrAdmin && (
                  <Link
                    href={`${basePath}/reglages/boutiques`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center gap-2 p-2 rounded-xl bg-[#FAF8F5] border border-black/[0.08] text-xs font-bold text-[#111111]"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Gérer mes boutiques</span>
                  </Link>
                )}
                <div className="flex items-center justify-between text-xs font-bold text-[#111111] pt-1">
                  <span>{currentUser.name}</span>
                  <span className="text-[10px] text-[#666660]">{USER_ROLE_LABELS[activeRole]}</span>
                </div>
                <div className="pt-1 border-t border-black/[0.06] space-y-1">
                  <button
                    type="button"
                    id="btn-mobile-logout-all-devices"
                    onClick={() => handleLogout(true)}
                    className="w-full py-1.5 rounded-xl text-[11px] font-semibold text-[#666660] hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1.5"
                  >
                    <Laptop className="h-3.5 w-3.5 text-[#888880]" />
                    <span>Me déconnecter de tous les appareils</span>
                  </button>
                  <button
                    type="button"
                    id="btn-mobile-logout"
                    onClick={() => handleLogout(false)}
                    className="w-full py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CONTENU PRINCIPAL SANS HEADER GLOBAL */}
        {/* ======================================================== */}
        <div
          className={cn(
            "flex-1 flex flex-col min-h-screen transition-all duration-300 min-w-0 overflow-x-hidden",
            isSidebarCollapsed ? "md:pl-[72px]" : "md:pl-[72px] lg:pl-[256px]"
          )}
        >
          {/* Corps de la page (commence directement en haut de l'écran) */}
          <main className="flex-1 px-4 sm:px-5 py-4 sm:py-6 pb-24 md:pb-6 max-w-[1600px] w-full mx-auto min-w-0 overflow-x-hidden">
            {/* Bannière de compte non vérifié (Restriction E.5) */}
            {(!isUserVerified || isUnverifiedFromUrl) && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Compte en attente de vérification e-mail</p>
                    <p className="text-[11px] text-amber-900 mt-0.5">
                      Votre adresse e-mail n'a pas encore été validée. Par mesure de sécurité, la publication de la vitrine, l'invitation d'équipe, les intégrations et les exports de données sont restreints.
                    </p>
                  </div>
                </div>
                <Link
                  href="/auth/verifier-email"
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-800 text-white font-bold text-xs hover:bg-amber-900 transition-colors shadow-2xs"
                >
                  <span>Vérifier mon e-mail</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {storesList.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-5">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center shadow-xs">
                  <StoreIcon className="h-8 w-8" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <h2 className="text-xl font-black text-[#111111]">
                    Aucune boutique pour l&apos;instant
                  </h2>
                  <p className="text-xs text-[#666660] leading-relaxed">
                    Créez votre première boutique pour commencer à ajouter vos produits réels et vendre en Afrique de l&apos;Ouest avec paiement à la livraison.
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-create-first-store"
                  onClick={() => router.push("/nouvelle-boutique")}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#1F3A26] hover:bg-[#162B1C] text-[#FAF8F5] text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>Créer ma première boutique</span>
                </button>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BARRE DE NAVIGATION INFÉRIEURE MOBILE (Prompt 05-X) */}
      {/* 5 éléments : Commandes, Produits, Statistiques, Équipe, Plus */}
      {/* ======================================================== */}
      <nav
        id="mobile-bottom-nav"
        aria-label="Navigation mobile principale"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-t border-black/[0.08] px-2 py-1.5 flex items-center justify-around shadow-2xl pb-[calc(6px+env(safe-area-inset-bottom))]"
      >
        <Link
          href={`${basePath}/commandes`}
          className={cn(
            "flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-1.5 rounded-xl transition-colors",
            pathname.includes("/commandes")
              ? "text-[#111111] font-bold"
              : "text-[#666660] hover:text-[#111111]"
          )}
        >
          <Package className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Commandes</span>
        </Link>

        <Link
          href={`${basePath}/produits`}
          className={cn(
            "flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-1.5 rounded-xl transition-colors",
            pathname.includes("/produits")
              ? "text-[#111111] font-bold"
              : "text-[#666660] hover:text-[#111111]"
          )}
        >
          <Tag className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Produits</span>
        </Link>

        <Link
          href={`${basePath}/stats`}
          className={cn(
            "flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-1.5 rounded-xl transition-colors",
            pathname.includes("/stats")
              ? "text-[#111111] font-bold"
              : "text-[#666660] hover:text-[#111111]"
          )}
        >
          <TrendingUp className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Stats</span>
        </Link>

        <Link
          href={`${basePath}/reglages/equipe`}
          className={cn(
            "flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-1.5 rounded-xl transition-colors",
            pathname.includes("/reglages/equipe")
              ? "text-[#111111] font-bold"
              : "text-[#666660] hover:text-[#111111]"
          )}
        >
          <Users className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Équipe</span>
        </Link>

        <button
          type="button"
          id="btn-mobile-bottom-more"
          onClick={() => setIsMobileMenuOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-1.5 rounded-xl transition-colors cursor-pointer",
            isMobileMenuOpen
              ? "text-[#111111] font-bold"
              : "text-[#666660] hover:text-[#111111]"
          )}
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Plus</span>
        </button>
      </nav>

      {/* ======================================================== */}
      {/* MODALES GLOBALES */}
      {/* ======================================================== */}

      {/* Panneau déroulant de notifications ancré dans le portail */}
      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        basePath={basePath}
        triggerRect={notificationsTriggerRect}
      />

      {/* Command Palette (Recherche Ctrl+K / Loupe) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        basePath={basePath}
      />

      {/* Modal d'information Bêta v0.9.4 */}
      <BetaInfoModal
        isOpen={isBetaModalOpen}
        onClose={() => setIsBetaModalOpen(false)}
        onOpenFeedback={() => {
          setIsBetaModalOpen(false);
          setIsFeedbackModalOpen(true);
        }}
      />

      {/* Modal de création de boutique (5 étapes) */}
      <CreateStoreModal
        isOpen={isCreateStoreOpen}
        onClose={() => setIsCreateStoreOpen(false)}
        onCreateStore={handleCreateStoreSuccess}
      />

      {/* Modal de retour testeur bêta */}
      <BetaFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        currentPage={pathname}
        userRole={activeRole}
      />
    </AppContext.Provider>
  );
}
