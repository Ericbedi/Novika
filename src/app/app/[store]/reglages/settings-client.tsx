"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  User,
  Store,
  MessageCircle,
  Activity,
  Bell,
  Users,
  Save,
  CheckCircle2,
  UploadCloud,
  Plus,
  Trash2,
  Shield,
  Smartphone,
  Sparkles,
  Copy,
  Check,
  Building2,
  Bike,
  Search,
  Link as LinkIcon,
  RotateCcw,
  CreditCard,
  Clock,
  Volume2,
  VolumeX,
  Play,
  Globe2,
  ChevronDown,
  ArrowRight,
  AlertTriangle,
  Download,
  KeyRound,
  ShieldAlert,
  LogOut,
  X,
  Lock,
  ExternalLink,
  Edit2,
  AlertCircle,
  HelpCircle,
  Boxes,
} from "lucide-react";
import { canDeleteAccount, canManagePixels, canViewPixels } from "@/config/permissions";
import { getOwnerEmail, isOwnerEmail } from "@/config/owner";
import { MOCK_PRODUCTS } from "@/mock-data/products";
import {
  ShopPixel,
  StorePixelSettings,
  validatePixelId,
  canAddPixel,
  metaPixelsStore,
} from "@/lib/meta-pixels";
import { MOCK_TEAM } from "@/mock-data/team";
import { TeamMember, UserRole, USER_ROLE_LABELS } from "@/server/data/types";
import { CountryChip } from "@/components/app/bits";
import { cn } from "@/lib/utils";
import { testOrderSound, notificationSound } from "@/lib/notification-sound";

interface SettingsClientProps {
  storeSlug: string;
  initialSection?: string;
}

export function SettingsClient({ storeSlug, initialSection = "general" }: SettingsClientProps) {
  const normalizeSection = (
    sec?: string
  ): "profile" | "general" | "whatsapp" | "pixels" | "notifications" | "team" => {
    if (!sec) return "general";
    if (sec === "equipe" || sec === "team") return "team";
    if (sec === "profil" || sec === "profile") return "profile";
    if (sec === "whatsapp") return "whatsapp";
    if (sec === "notifications") return "notifications";
    if (sec === "pixels") return "pixels";
    return "general";
  };

  const [activeTab, setActiveTab] = useState<
    "profile" | "general" | "whatsapp" | "pixels" | "notifications" | "team"
  >(normalizeSection(initialSection));
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  React.useEffect(() => {
    if (initialSection) {
      setActiveTab(normalizeSection(initialSection));
    }
  }, [initialSection]);

  // Profil
  const [profileName, setProfileName] = useState("Promises Bedi");
  const [profileEmail, setProfileEmail] = useState(getOwnerEmail());
  const [profilePhone, setProfilePhone] = useState("+22890001122");

  // Général
  const [storeName, setStoreName] = useState(
    storeSlug === "abidjan-bio" ? "BioSanté Abidjan" : "Lomé Luxe & Vitalité"
  );
  const [storeDescription, setStoreDescription] = useState(
    "Boutique e-commerce COD spécialisée en santé naturelle et cosmétique premium en Afrique de l'Ouest."
  );
  const [mainCountry, setMainCountry] = useState(storeSlug === "abidjan-bio" ? "CI" : "TG");

  // WhatsApp
  const [waNumber, setWaNumber] = useState("+22890123456");
  const [waConfirmTemplate, setWaConfirmTemplate] = useState(
    "Bonjour {nom}, votre commande #{commande} pour {produit} d'un montant de {montant} a bien été reçue. Êtes-vous disponible aujourd'hui pour être livré à {ville} ?"
  );
  const [waDeliveryTemplate, setWaDeliveryTemplate] = useState(
    "Bonjour {nom}, le livreur {livreur} est en route avec votre colis #{commande}. Préparez le montant exact de {montant}. Merci de le joindre au {tel_livreur}."
  );
  const [waFollowupTemplate, setWaFollowupTemplate] = useState(
    "Bonjour {nom}, nous avons tenté de vous joindre sans succès pour votre commande #{commande}. Quand pouvons-nous vous livrer à {ville} ?"
  );

  // Pixels & Analytics
  // Prompt 05-Px : Jusqu'à 3 pixels Facebook (Meta) par boutique
  const [shopPixels, setShopPixels] = useState<ShopPixel[]>(() =>
    metaPixelsStore.getPixels(storeSlug, true)
  );
  const [pixelSettings, setPixelSettings] = useState<StorePixelSettings>(() =>
    metaPixelsStore.getSettings(storeSlug)
  );
  const [isPixelModalOpen, setIsPixelModalOpen] = useState(false);
  const [editingPixelInternalId, setEditingPixelInternalId] = useState<string | null>(null);
  const [pixelFormName, setPixelFormName] = useState("");
  const [pixelFormId, setPixelFormId] = useState("");
  const [pixelFormApplyAll, setPixelFormApplyAll] = useState(true);
  const [pixelFormProductIds, setPixelFormProductIds] = useState<string[]>([]);
  const [pixelFormCapiEnabled, setPixelFormCapiEnabled] = useState(false);
  const [pixelFormCapiToken, setPixelFormCapiToken] = useState("");
  const [pixelFormCapiTrigger, setPixelFormCapiTrigger] = useState<"on_order" | "on_delivery">("on_order");
  const [pixelFormTestCode, setPixelFormTestCode] = useState("");
  const [pixelFormError, setPixelFormError] = useState<string | null>(null);
  const [pixelDeletingId, setPixelDeletingId] = useState<string | null>(null);
  const [pixelTestFeedbacks, setPixelTestFeedbacks] = useState<
    Record<string, { success: boolean; message: string; fbTraceId?: string; testUrl?: string }>
  >({});
  const [isTestingPixelId, setIsTestingPixelId] = useState<string | null>(null);

  const [tiktokPixelId, setTiktokPixelId] = useState("TT-9876543210-COD");
  const [gaMeasurementId, setGaMeasurementId] = useState("G-9X8Y7Z6W");
  const [liveViewTrackingEnabled, setLiveViewTrackingEnabled] = useState(true);
  const [clarityProjectId, setClarityProjectId] = useState("clarity_cod_9823");
  const [clarityMaskingStrict, setClarityMaskingStrict] = useState(true);

  // 2FA & Sessions (Prompt 05-A)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [activeSessions, setActiveSessions] = useState([
    { id: "sess_1", device: "Chrome 122 · Windows 11", location: "Lomé, Togo", current: true, date: "Aujourd'hui à 07:15" },
    { id: "sess_2", device: "Safari Mobile · iPhone 13", location: "Lomé, Togo", current: false, date: "Hier à 21:40" },
  ]);

  // Suppression de compte (Prompt 05-D)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("owner");
  const [deleteBlockedReason, setDeleteBlockedReason] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteAgreementChecked, setDeleteAgreementChecked] = useState(false);
  const [isAccountInGracePeriod, setIsAccountInGracePeriod] = useState(false);
  const [gracePeriodEndDate, setGracePeriodEndDate] = useState<string | null>(null);

  // Notifications
  const [soundOnNewOrder, setSoundOnNewOrder] = useState(true);
  const [notifySellerWa, setNotifySellerWa] = useState(true);
  const [dailyDigestEmail, setDailyDigestEmail] = useState(true);
  const [smsDeliveryAlert, setSmsDeliveryAlert] = useState(true);

  // Équipe & Rôles
  const [team, setTeam] = useState<TeamMember[]>(MOCK_TEAM);
  const [teamFilterRole, setTeamFilterRole] = useState<"all" | UserRole>("all");
  const [teamSearch, setTeamSearch] = useState("");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<UserRole>("closer");
  const [newMemberCountry, setNewMemberCountry] = useState<"BJ" | "CI" | "SN" | "TG">("TG");
  const [newMemberAgency, setNewMemberAgency] = useState("");

  // Synchronisation stricte de l'équipe du marchand connecté (AUCUNE donnée du fondateur démo)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userEmail = localStorage.getItem("novika_user_email");
      const userFullName = localStorage.getItem("novika_user_fullname") || (userEmail ? userEmail.split("@")[0] : null);

      if (userEmail && userEmail !== "demo@novika.com") {
        const teamStorageKey = `novika_custom_team_${userEmail}`;
        const savedCustomTeam = localStorage.getItem(teamStorageKey);

        const myOwnerMember: TeamMember = {
          id: `tm_owner_${userEmail.replace(/[^a-zA-Z0-9]/g, "_")}`,
          name: userFullName || "Mon Compte Marchand",
          email: userEmail,
          phone: "+22890000000",
          role: "owner",
          country: "TG",
          active: true,
          joinedAt: new Date().toLocaleDateString("fr-FR"),
        };

        if (savedCustomTeam) {
          try {
            const parsed = JSON.parse(savedCustomTeam);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Filtrer tout résidu de membre démo
              const sanitized = parsed.filter(
                (m: any) =>
                  !m.id?.startsWith("tm_0") &&
                  !m.email?.includes("afribuilder.com") &&
                  !m.name?.includes("Promises")
              );
              const hasOwner = sanitized.some((m: any) => m.email === userEmail);
              const finalTeam = hasOwner ? sanitized : [myOwnerMember, ...sanitized];
              setTeam(finalTeam);
              return;
            }
          } catch {}
        }

        // Première visite du marchand : équipe propre contenant UNIQUEMENT lui-même
        setTeam([myOwnerMember]);
        localStorage.setItem(teamStorageKey, JSON.stringify([myOwnerMember]));
      }
    }
  }, []);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Paramètres généraux enregistrés !");
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Profil mis à jour !");
  };

  const handleLogoutAllSessions = async () => {
    setActiveSessions((prev) => prev.filter((s) => s.current));
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allDevices: true, reason: "settings_profile" }),
      });
    } catch {}
    showToast("Toutes les autres sessions ont été révoquées avec succès !");
  };

  const handleExportMyData = () => {
    showToast("Export de vos données (JSON/CSV) téléchargé avec succès.");
  };

  const handleInitiateDeletion = () => {
    const deleteCheck = canDeleteAccount(currentUserRole, team.length);
    if (!deleteCheck.allowed) {
      setDeleteBlockedReason(deleteCheck.reason || null);
      return;
    }
    setDeleteBlockedReason(null);
    setDeleteStep(1);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeletion = () => {
    if (deleteConfirmText.trim().toUpperCase() !== "SUPPRIMER" && deleteConfirmText.trim() !== profileEmail) {
      showToast("Veuillez taper le mot 'SUPPRIMER' pour confirmer.");
      return;
    }
    if (!deleteAgreementChecked) {
      showToast("Veuillez cocher la case attestant de votre compréhension.");
      return;
    }

    const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    setIsAccountInGracePeriod(true);
    setGracePeriodEndDate(endDate);
    setIsDeleteModalOpen(false);
    showToast("Demande enregistrée. E-mail de confirmation envoyé. Délai de grâce de 14 jours activé.");
  };

  const handleCancelDeletion = () => {
    setIsAccountInGracePeriod(false);
    setGracePeriodEndDate(null);
    showToast("Suppression annulée. Votre compte et vos boutiques restent actifs sans interruption !");
  };

  const handleSaveWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Modèles WhatsApp enregistrés !");
  };

  // Gestion des Pixels Meta (Prompt 05-Px)
  const handleOpenAddPixel = () => {
    if (!canManagePixels(currentUserRole)) {
      showToast("Action refusée : Seuls les administrateurs peuvent ajouter un pixel.");
      return;
    }
    if (shopPixels.length >= 3) {
      showToast("Maximum 3 pixels par boutique atteint.");
      return;
    }
    setEditingPixelInternalId(null);
    setPixelFormName("");
    setPixelFormId("");
    setPixelFormApplyAll(true);
    setPixelFormProductIds([]);
    setPixelFormCapiEnabled(false);
    setPixelFormCapiToken("");
    setPixelFormCapiTrigger("on_order");
    setPixelFormTestCode("");
    setPixelFormError(null);
    setIsPixelModalOpen(true);
  };

  const handleOpenEditPixel = (pixel: ShopPixel) => {
    if (!canManagePixels(currentUserRole)) {
      showToast("Action refusée : Seuls les administrateurs peuvent modifier un pixel.");
      return;
    }
    setEditingPixelInternalId(pixel.id);
    setPixelFormName(pixel.name);
    setPixelFormId(pixel.pixelId);
    setPixelFormApplyAll(pixel.applyToAllProducts);
    setPixelFormProductIds(pixel.productIds || []);
    setPixelFormCapiEnabled(pixel.capiEnabled);
    setPixelFormCapiToken("");
    setPixelFormCapiTrigger(pixel.capiTrigger || "on_order");
    setPixelFormTestCode(pixel.testEventCode || "");
    setPixelFormError(null);
    setIsPixelModalOpen(true);
  };

  const handleSavePixelModal = (e: React.FormEvent) => {
    e.preventDefault();
    setPixelFormError(null);

    if (!pixelFormName.trim()) {
      setPixelFormError("Veuillez donner un nom interne au pixel (ex: Pixel Togo – Montres).");
      return;
    }

    const val = validatePixelId(pixelFormId);
    if (!val.isValid) {
      setPixelFormError(val.error || "ID invalide.");
      return;
    }

    const check = canAddPixel(shopPixels, pixelFormId, editingPixelInternalId || undefined);
    if (!check.allowed) {
      setPixelFormError(check.error || "Action impossible.");
      return;
    }

    if (editingPixelInternalId) {
      const res = metaPixelsStore.updatePixel(
        storeSlug,
        editingPixelInternalId,
        {
          name: pixelFormName.trim(),
          pixelId: pixelFormId.trim(),
          applyToAllProducts: pixelFormApplyAll,
          productIds: pixelFormApplyAll ? [] : pixelFormProductIds,
          capiEnabled: pixelFormCapiEnabled,
          capiToken: pixelFormCapiToken.trim() || undefined,
          capiTrigger: pixelFormCapiTrigger,
          testEventCode: pixelFormTestCode.trim() || undefined,
        },
        `${currentUserRole} (Interface)`
      );
      if (!res.success) {
        setPixelFormError(res.error || "Erreur de mise à jour.");
        return;
      }
      showToast(`Pixel « ${pixelFormName} » mis à jour avec succès.`);
    } else {
      const res = metaPixelsStore.addPixel(
        storeSlug,
        {
          name: pixelFormName.trim(),
          pixelId: pixelFormId.trim(),
          isActive: true,
          applyToAllProducts: pixelFormApplyAll,
          productIds: pixelFormApplyAll ? [] : pixelFormProductIds,
          capiEnabled: pixelFormCapiEnabled,
          capiToken: pixelFormCapiToken.trim() || undefined,
          capiTrigger: pixelFormCapiTrigger,
          testEventCode: pixelFormTestCode.trim() || undefined,
        },
        `${currentUserRole} (Interface)`
      );
      if (!res.success) {
        setPixelFormError(res.error || "Erreur d'ajout.");
        return;
      }
      showToast(`Pixel « ${pixelFormName} » ajouté avec succès.`);
    }

    setShopPixels(metaPixelsStore.getPixels(storeSlug, true));
    setIsPixelModalOpen(false);
  };

  const handleTogglePixelActive = (pixel: ShopPixel) => {
    if (!canManagePixels(currentUserRole)) {
      showToast("Action refusée : Seuls les administrateurs peuvent modifier le statut d'un pixel.");
      return;
    }
    const res = metaPixelsStore.updatePixel(
      storeSlug,
      pixel.id,
      { isActive: !pixel.isActive },
      `${currentUserRole} (Interface)`
    );
    if (res.success) {
      setShopPixels(metaPixelsStore.getPixels(storeSlug, true));
      showToast(`Pixel « ${pixel.name} » ${!pixel.isActive ? "activé" : "désactivé"}.`);
    }
  };

  const handleDeletePixel = (pixelId: string) => {
    if (!canManagePixels(currentUserRole)) {
      showToast("Action refusée : Seuls les administrateurs peuvent supprimer un pixel.");
      return;
    }
    const res = metaPixelsStore.deletePixel(storeSlug, pixelId, `${currentUserRole} (Interface)`);
    if (res.success) {
      setShopPixels(metaPixelsStore.getPixels(storeSlug, true));
      setPixelDeletingId(null);
      showToast("Pixel supprimé définitivement.");
    }
  };

  const handleTestPixel = async (pixel: ShopPixel) => {
    setIsTestingPixelId(pixel.id);
    try {
      const res = await fetch("/api/pixels/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug,
          pixelId: pixel.pixelId,
          testEventCode: pixel.testEventCode,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPixelTestFeedbacks((prev) => ({
          ...prev,
          [pixel.id]: {
            success: true,
            message: data.message,
            fbTraceId: data.fbTraceId,
            testUrl: data.metaTestUrl,
          },
        }));
        showToast("Signal de test reçu par Meta avec succès (Code 200).");
      } else {
        setPixelTestFeedbacks((prev) => ({
          ...prev,
          [pixel.id]: {
            success: false,
            message: data.error || "Échec de connexion aux serveurs Meta.",
          },
        }));
      }
    } catch {
      setPixelTestFeedbacks((prev) => ({
        ...prev,
        [pixel.id]: {
          success: false,
          message: "Erreur réseau lors de l'envoi du test.",
        },
      }));
    } finally {
      setIsTestingPixelId(null);
    }
  };

  const handleChangeOrderEventToSend = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as "Purchase" | "Lead";
    metaPixelsStore.updateSettings(storeSlug, val);
    setPixelSettings({ storeSlug, orderEventToSend: val });
    showToast(`Événement à la commande configuré sur : ${val}`);
  };

  const handleSavePixels = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Pixels de tracking et Conversions API activés !");
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Préférences de notifications enregistrées !");
  };

  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      showToast("Veuillez renseigner le nom du collaborateur.");
      return;
    }

    const token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://novika.africa";
    const newMember: TeamMember = {
      id: `tm_${Date.now()}`,
      name: newMemberName,
      email: newMemberEmail || `${newMemberName.toLowerCase().replace(/\s+/g, ".")}@${storeSlug}.com`,
      phone: newMemberPhone || "+22890000000",
      role: newMemberRole,
      country: newMemberCountry,
      agencyName: newMemberAgency || (newMemberRole === "agency" ? newMemberName : undefined),
      active: true,
      joinedAt: new Date().toLocaleDateString("fr-FR"),
      inviteLink: `${origin}/rejoindre?token=${token}`,
    };

    setTeam((prev) => {
      const updated = [...prev, newMember];
      if (typeof window !== "undefined") {
        const userEmail = localStorage.getItem("novika_user_email");
        if (userEmail && userEmail !== "demo@novika.com") {
          localStorage.setItem(`novika_custom_team_${userEmail}`, JSON.stringify(updated));
        }
      }
      return updated;
    });

    setShowAddMemberModal(false);
    setNewMemberName("");
    setNewMemberEmail("");
    setNewMemberPhone("");
    setNewMemberAgency("");
    showToast(`Invitation créée pour ${newMember.name} (valable 7 jours) !`);
  };

  const handleToggleMemberActive = (id: string) => {
    const target = team.find((m) => m.id === id);
    if (target?.role === "owner" || isOwnerEmail(target?.email)) {
      showToast("Action refusée : Le propriétaire ne peut pas être suspendu.");
      return;
    }

    setTeam((prev) => {
      const updated = prev.map((m) => {
        if (m.id === id) {
          const newStatus = !m.active;
          showToast(
            newStatus
              ? `Compte de ${m.name} réactivé avec succès !`
              : `Membre ${m.name} suspendu (toutes les sessions ont été révoquées).`
          );
          return { ...m, active: newStatus };
        }
        return m;
      });
      if (typeof window !== "undefined") {
        const userEmail = localStorage.getItem("novika_user_email");
        if (userEmail && userEmail !== "demo@novika.com") {
          localStorage.setItem(`novika_custom_team_${userEmail}`, JSON.stringify(updated));
        }
      }
      return updated;
    });
  };

  const handleChangeMemberRole = (id: string, newRole: UserRole) => {
    const target = team.find((m) => m.id === id);
    if (target?.role === "owner" || isOwnerEmail(target?.email)) {
      showToast("Action refusée : Le rôle du propriétaire est inaltérable.");
      return;
    }

    setTeam((prev) => {
      const updated = prev.map((m) => {
        if (m.id === id) {
          showToast(`Rôle de ${m.name} modifié : ${USER_ROLE_LABELS[newRole]}`);
          return { ...m, role: newRole };
        }
        return m;
      });
      if (typeof window !== "undefined") {
        const userEmail = localStorage.getItem("novika_user_email");
        if (userEmail && userEmail !== "demo@novika.com") {
          localStorage.setItem(`novika_custom_team_${userEmail}`, JSON.stringify(updated));
        }
      }
      return updated;
    });
  };

  const handleCopyInviteLink = (member: TeamMember) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://novika.africa";
    const link = member.inviteLink || `${origin}/rejoindre?token=inv_${member.id}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    showToast(`Lien d'invitation copié (valable 7 jours) ! Prêt pour WhatsApp ou e-mail.`);
  };

  const handleDeleteMember = (id: string) => {
    const target = team.find((m) => m.id === id);
    if (target?.role === "owner" || isOwnerEmail(target?.email)) {
      showToast("Action refusée : Le propriétaire ne peut pas être retiré de l'équipe.");
      return;
    }

    if (confirm("Voulez-vous retirer ce membre de l'équipe ? Note : l'historique de ses commandes est intégralement conservé.")) {
      setTeam((prev) => prev.filter((m) => m.id !== id));
      showToast("Membre retiré de l'équipe (historique des commandes conservé).");
    }
  };

  const roleBadge = (role: UserRole) => {
    switch (role) {
      case "owner":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#111111] text-white">Propriétaire</span>;
      case "admin":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">Administrateur</span>;
      case "closer":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">Closeur(se)</span>;
      case "rider":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">Livreur</span>;
      case "agency":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">Agence de livraison</span>;
    }
  };

  const filteredTeam = team.filter((member) => {
    if (teamFilterRole !== "all" && member.role !== teamFilterRole) return false;
    if (teamSearch.trim()) {
      const q = teamSearch.toLowerCase();
      return (
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        member.phone.includes(q) ||
        (member.agencyName && member.agencyName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleSelectTab = (
    tabId: "profile" | "general" | "whatsapp" | "pixels" | "notifications" | "team"
  ) => {
    setActiveTab(tabId);
    setIsDropdownOpen(false);
    if (typeof window !== "undefined") {
      const slugSegment = tabId === "team" ? "equipe" : tabId;
      window.history.pushState(null, "", `/app/${storeSlug}/reglages/${slugSegment}`);
    }
  };

  const SECTIONS = [
    {
      id: "general" as const,
      label: "Général",
      description: "Options globales et boutique",
      icon: Store,
    },
    {
      id: "profile" as const,
      label: "Profil",
      description: "Identité et identifiants",
      icon: User,
    },
    {
      id: "team" as const,
      label: "Équipe",
      description: "Membres, rôles et horaires",
      icon: Users,
      badge: team.length,
    },
    {
      id: "whatsapp" as const,
      label: "WhatsApp",
      description: "Modèles et numéros relance",
      icon: MessageCircle,
    },
    {
      id: "notifications" as const,
      label: "Notifications",
      description: "Alertes sonores et push",
      icon: Bell,
    },
    {
      id: "pixels" as const,
      label: "Pixels & Analytics",
      description: "Meta CAPI, TikTok et GA4",
      icon: Activity,
    },
    {
      id: "domaines" as const,
      label: "Domaines",
      description: "Noms de domaine et DNS Vercel",
      icon: Globe2,
      href: `/app/${storeSlug}/reglages/domaines`,
      isExternalRoute: true,
    },
    {
      id: "boutiques" as const,
      label: "Toutes les boutiques",
      description: "Multi-boutiques & métriques",
      icon: Building2,
      href: `/app/${storeSlug}/reglages/boutiques`,
      isExternalRoute: true,
    },
    {
      id: "facturation" as const,
      label: "Facturation & Quotas",
      description: "Abonnement et limites",
      icon: CreditCard,
      href: `/app/${storeSlug}/reglages/facturation`,
      isExternalRoute: true,
    },
    {
      id: "mobile" as const,
      label: "Mobile & PWA",
      description: "Installation et hors-ligne",
      icon: Smartphone,
      href: `/app/${storeSlug}/reglages/mobile`,
      isExternalRoute: true,
    },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#111111] text-[#FAF8F5] px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* En-tête */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
            Configuration de la Plateforme
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
          Réglages & Équipe
        </h1>
        <p className="text-xs text-[#666660] mt-0.5">
          Gérez votre profil, vos intégrations WhatsApp & Meta Pixel, et vos rôles d'accès.
        </p>
      </div>

      {/* ======================================================== */}
      {/* NAVIGATION DES RÉGLAGES (Prompt 05-R) */}
      {/* Desktop/tablette : grille 4 col / 3 col */}
      {/* Mobile : cadre déroulant pleine largeur */}
      {/* ======================================================== */}

      {/* 1. Cadre déroulant mobile (< 640px) */}
      <div className="sm:hidden relative">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#666660] mb-1.5">
          Section des réglages
        </label>
        <button
          type="button"
          id="btn-settings-dropdown-trigger"
          onClick={() => setIsDropdownOpen((v) => !v)}
          aria-expanded={isDropdownOpen}
          aria-haspopup="listbox"
          className="w-full flex items-center justify-between p-3.5 rounded-2xl border-2 border-[#111111] bg-[#FAF8F5] text-left shadow-2xs cursor-pointer min-h-[56px]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#111111] text-white flex items-center justify-center shrink-0">
              {React.createElement(
                SECTIONS.find((s) => s.id === activeTab)?.icon || Store,
                { className: "h-5 w-5" }
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#111111] truncate">
                  {SECTIONS.find((s) => s.id === activeTab)?.label}
                </span>
                {SECTIONS.find((s) => s.id === activeTab)?.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-black/[0.08] text-[#111111]">
                    {SECTIONS.find((s) => s.id === activeTab)?.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#666660] truncate">
                {SECTIONS.find((s) => s.id === activeTab)?.description}
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-[#666660] shrink-0 transition-transform",
              isDropdownOpen && "rotate-180"
            )}
          />
        </button>

        {isDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setIsDropdownOpen(false)}
            />
            <div
              role="listbox"
              id="settings-dropdown-menu"
              className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#FAF8F5] rounded-2xl border-2 border-black/[0.15] shadow-2xl p-2 space-y-1 max-h-[380px] overflow-y-auto"
            >
              {SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeTab === sec.id;
                if (sec.isExternalRoute) {
                  return (
                    <Link
                      key={sec.id}
                      href={sec.href!}
                      onClick={() => setIsDropdownOpen(false)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-black/[0.05] transition-colors text-left min-h-[44px]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="h-4 w-4 text-[#666660] shrink-0" />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[#111111] block truncate">
                            {sec.label}
                          </span>
                          <span className="text-[10px] text-[#666660] block truncate">
                            {sec.description}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-[#888880] shrink-0" />
                    </Link>
                  );
                }

                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => handleSelectTab(sec.id as any)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-colors text-left min-h-[44px] cursor-pointer",
                      isActive
                        ? "bg-[#111111] text-white"
                        : "hover:bg-black/[0.05] text-[#111111]"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-white" : "text-[#666660]"
                        )}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "text-xs font-bold truncate",
                              isActive ? "text-white" : "text-[#111111]"
                            )}
                          >
                            {sec.label}
                          </span>
                          {sec.badge !== undefined && (
                            <span
                              className={cn(
                                "px-1.5 py-0.2 rounded-full text-[9px] font-black",
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-black/[0.08] text-[#111111]"
                              )}
                            >
                              {sec.badge}
                            </span>
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-[10px] block truncate",
                            isActive ? "text-white/70" : "text-[#666660]"
                          )}
                        >
                          {sec.description}
                        </span>
                      </div>
                    </div>
                    {isActive && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 2. Grille de cases sur Tablette & Ordinateur (>= 640px) */}
      <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-2.5 w-full">
        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeTab === sec.id;
          if (sec.isExternalRoute) {
            return (
              <Link
                key={sec.id}
                id={`settings-tab-${sec.id}`}
                href={sec.href!}
                className="group p-3 rounded-2xl border border-black/[0.08] bg-[#FAF8F5] hover:border-black/20 hover:bg-black/[0.02] transition-all flex flex-col justify-between min-h-[64px] shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="h-4 w-4 text-[#666660] group-hover:text-[#111111] shrink-0" />
                    <span className="text-xs font-bold text-[#111111] truncate">{sec.label}</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-[#888880] group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
                <p className="text-[10px] text-[#666660] truncate mt-1">{sec.description}</p>
              </Link>
            );
          }

          return (
            <button
              key={sec.id}
              type="button"
              id={`settings-tab-${sec.id}`}
              onClick={() => handleSelectTab(sec.id as any)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "p-3 rounded-2xl text-left transition-all flex flex-col justify-between min-h-[64px] cursor-pointer shadow-2xs",
                isActive
                  ? "bg-[#111111] text-[#FAF8F5] border-2 border-[#111111] shadow-xs"
                  : "bg-[#FAF8F5] text-[#111111] border border-black/[0.08] hover:border-black/20 hover:bg-black/[0.02]"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-[#FAF8F5]" : "text-[#666660]"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-bold truncate",
                      isActive ? "text-white" : "text-[#111111]"
                    )}
                  >
                    {sec.label}
                  </span>
                </div>
                {sec.badge !== undefined && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[9px] font-black shrink-0",
                      isActive ? "bg-white/20 text-white" : "bg-black/[0.08] text-[#111111]"
                    )}
                  >
                    {sec.badge}
                  </span>
                )}
              </div>
              <p
                className={cn(
                  "text-[10px] truncate mt-1",
                  isActive ? "text-white/70" : "text-[#666660]"
                )}
              >
                {sec.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* 1. ONGLET GÉNÉRAL */}
      {activeTab === "general" && (
        <div className="max-w-3xl space-y-6">
          {/* Règle Prompt 05-N : Carte de redirection vers l'éditeur de vitrine */}
          <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-[#C2410C]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                    Informations de la boutique
                  </h2>
                </div>
                <p className="text-xs text-[#666660] max-w-xl">
                  Le nom commercial, le logo, la description et le pays principal de la vitrine se gèrent désormais directement dans l&apos;<strong>Éditeur de boutique</strong> avec aperçu en direct de votre vitrine.
                </p>
              </div>
              <Link
                id="link-goto-storefront-info"
                href={`/app/${storeSlug}/boutique-en-ligne?tab=info`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <span>Modifier les informations</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Préférences opérationnelles générales */}
          <form onSubmit={handleSaveGeneral} className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xs space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Préférences opérationnelles de la boutique
            </h2>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#111111] mb-1">
                    Fuseau horaire de référence
                  </label>
                  <select
                    className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] text-xs font-medium focus:outline-none"
                    defaultValue="Africa/Lome"
                  >
                    <option value="Africa/Lome">Afrique de l'Ouest (GMT+0, Lomé / Abidjan / Dakar)</option>
                    <option value="Africa/Porto-Novo">Afrique Centrale (GMT+1, Cotonou / Douala / Libreville)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#111111] mb-1">
                    Délai de grâce avant émission des reçus
                  </label>
                  <select
                    className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] text-xs font-medium focus:outline-none"
                    defaultValue="15"
                  >
                    <option value="0">Immédiat au statut « Livrée »</option>
                    <option value="15">15 minutes après livraison (recommandé)</option>
                    <option value="30">30 minutes après livraison</option>
                    <option value="60">1 heure après livraison</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-black/[0.06] space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded text-[#111111] accent-[#111111] cursor-pointer"
                  />
                  <span className="font-semibold text-[#111111]">
                    Filtre anti-doublon intelligent (24 heures sur le même numéro de téléphone)
                  </span>
                </label>
                <p className="text-[11px] text-[#666660] pl-6">
                  Avertit automatiquement si un client tente de passer 2 fois la même commande dans la même journée pour éviter les colis refusés.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Enregistrer les préférences</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. ONGLET PROFIL */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="max-w-2xl space-y-6">
          <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Votre Profil Vendeur
            </h2>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  Téléphone WhatsApp principal
                </label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  Rôle sur le compte
                </label>
                <div className="p-2.5 rounded-xl bg-black/[0.04] text-[#111111] font-bold flex items-center justify-between">
                  <span>Propriétaire Fondateur</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-purple-100 text-purple-900 border border-purple-200">
                    Accès Total
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SÉCURITÉ & 2FA (Prompt 05-A) */}
          <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[#C2410C]" />
              <span>Sécurité du Compte & Sessions</span>
            </h2>

            <div className="space-y-4 text-xs">
              {/* Authentification à deux facteurs (2FA) */}
              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-sm text-[#111111] block">
                    Authentification à deux facteurs (2FA)
                  </span>
                  <p className="text-[11px] text-[#666660] mt-0.5">
                    Protégez votre compte avec une application d'authentification (Google Authenticator, Authy). Fortement recommandée pour les administrateurs et co-admins.
                  </p>
                </div>
                <button
                  type="button"
                  id="toggle-2fa"
                  onClick={() => {
                    setTwoFactorEnabled(!twoFactorEnabled);
                    showToast(
                      twoFactorEnabled
                        ? "2FA désactivé sur votre compte."
                        : "2FA activé avec succès ! Votre compte est sécurisé."
                    );
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0",
                    twoFactorEnabled
                      ? "bg-emerald-600 text-white"
                      : "bg-black/[0.06] text-[#666660] hover:bg-black/[0.1]"
                  )}
                >
                  {twoFactorEnabled ? "Activé" : "Activer"}
                </button>
              </div>

              {/* Sessions actives */}
              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-[#111111] block">
                      Appareils & Sessions Connectées
                    </span>
                    <p className="text-[11px] text-[#666660]">
                      Liste des navigateurs actuellement connectés à votre compte.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="btn-logout-all-sessions"
                    onClick={handleLogoutAllSessions}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Déconnecter partout</span>
                  </button>
                </div>

                <div className="space-y-2 pt-1" id="active-sessions-list">
                  {activeSessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-2.5 rounded-xl bg-[#FAF8F5] border border-black/[0.04] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#111111]">{sess.device}</span>
                          {sess.current && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                              Cet appareil
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#888880]">
                          {sess.location} · {sess.date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ZONE DANGEREUSE : SUPPRESSION DE COMPTE (Prompt 05-D) */}
          <div
            id="danger-zone-account-deletion"
            className="rounded-[24px] border border-rose-200 bg-rose-50/40 p-6 shadow-2xs space-y-4"
          >
            <div className="flex items-center gap-2 text-rose-950 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>Zone dangereuse</span>
            </div>

            {deleteBlockedReason && (
              <div id="delete-account-blocked-notice" className="p-3.5 rounded-2xl bg-rose-100 border border-rose-300 text-rose-950 text-xs font-semibold space-y-2 animate-in fade-in duration-150">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Suppression impossible : Transfert de propriété requis</p>
                    <p className="text-[11px] text-rose-900 mt-0.5 leading-relaxed">{deleteBlockedReason}</p>
                  </div>
                </div>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-simulate-solo-member-delete"
                    onClick={() => {
                      setCurrentUserRole("admin");
                      setDeleteBlockedReason(null);
                      setDeleteStep(1);
                      setIsDeleteModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-800 text-white font-bold text-[10px] hover:bg-rose-900 cursor-pointer shadow-2xs"
                  >
                    Simuler en tant que Co-admin ou Membre sans équipe
                  </button>
                </div>
              </div>
            )}

            {isAccountInGracePeriod ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-3">
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sm">Compte en cours de suppression (Délai de grâce actif)</h3>
                    <p className="text-xs text-amber-900 mt-0.5">
                      Votre demande a bien été enregistrée. Votre compte sera définitivement purgé le{" "}
                      <strong>{gracePeriodEndDate}</strong> (14 jours). Durant cette période, vos boutiques sont suspendues mais entièrement récupérables en un clic.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-cancel-account-deletion"
                  onClick={handleCancelDeletion}
                  className="px-4 py-2 rounded-xl bg-amber-800 text-white font-bold text-xs hover:bg-amber-900 transition-colors shadow-2xs cursor-pointer"
                >
                  Annuler la suppression et réactiver mon compte
                </button>
              </div>
            ) : currentUserRole === "owner" ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-xs text-rose-950">
                    Supprimer définitivement mon compte
                  </h3>
                  <p className="text-[11px] text-rose-800 mt-0.5 max-w-xl">
                    Supprime votre accès, vos identifiants et vos données personnelles. Délai de grâce de 14 jours réversible. Les administrateurs avec équipe doivent transférer la propriété au préalable.
                  </p>
                </div>

                <button
                  type="button"
                  id="btn-delete-account-trigger"
                  onClick={handleInitiateDeletion}
                  className="shrink-0 px-4 py-2.5 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all shadow-2xs cursor-pointer min-h-[40px]"
                >
                  Supprimer mon compte
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-xs text-[#111111]">
                    Demander le retrait de l'équipe
                  </h3>
                  <p className="text-[11px] text-[#777770] mt-0.5 max-w-xl">
                    En tant que collaborateur, vous ne pouvez pas supprimer le compte de la boutique. Pour vous retirer de l'équipe, adressez une demande au propriétaire.
                  </p>
                </div>

                <button
                  type="button"
                  id="btn-request-team-removal"
                  onClick={() => showToast("Demande de retrait transmise à l'administrateur propriétaire.")}
                  className="shrink-0 px-4 py-2.5 rounded-xl border border-black/10 bg-white hover:bg-black/5 text-[#111111] text-xs font-bold transition-all shadow-2xs cursor-pointer min-h-[40px]"
                >
                  Demander le retrait
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Enregistrer le profil</span>
            </button>
          </div>
        </form>
      )}

      {/* MODALE MULTI-ÉTAPES DE SUPPRESSION DE COMPTE (Prompt 05-D) */}
      {isDeleteModalOpen && (
        <div
          id="modal-account-deletion"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white border border-black/10 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-black/[0.08] pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="h-5 w-5" />
                <span>Suppression de Compte · Étape {deleteStep}/4</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1 rounded-lg text-[#666660] hover:bg-black/[0.04]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Étape 1 : Explications claires */}
            {deleteStep === 1 && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2">
                  <p className="font-bold">Ce qui sera supprimé après le délai de 14 jours :</p>
                  <ul className="list-disc pl-5 space-y-1 text-rose-900">
                    <li>Votre profil, identifiants de connexion, téléphone et avatar.</li>
                    <li>Vos sessions actives, codes 2FA et jetons de notifications push.</li>
                    <li>Les fichiers, médias et bannières associés à votre compte.</li>
                  </ul>
                  <p className="font-bold pt-1">Ce qui sera conservé :</p>
                  <p className="text-[11px] text-rose-800">
                    Les factures légales et justificatifs fiscaux sont archivés de manière restreinte et dissociés de votre profil pour la durée légale obligatoire.
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-[#666660] hover:text-[#111111]"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteStep(2)}
                    className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black"
                  >
                    Suivant : Exporter mes données
                  </button>
                </div>
              </div>
            )}

            {/* Étape 2 : Export des données */}
            {deleteStep === 2 && (
              <div className="space-y-4 text-xs">
                <p className="text-[#666660] leading-relaxed">
                  Avant de procéder à la suppression, nous vous recommandons fortement de télécharger une copie complète de vos commandes, produits et clients.
                </p>

                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-black/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-[#C2410C]" />
                    <span className="font-bold text-[#111111]">Archive de vos données (JSON / CSV)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportMyData}
                    className="px-3 py-1.5 rounded-xl border border-black/10 bg-white text-xs font-bold text-[#111111] hover:bg-black/[0.02] shadow-2xs"
                  >
                    Télécharger
                  </button>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteStep(1)}
                    className="px-4 py-2 text-xs font-bold text-[#666660]"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteStep(3)}
                    className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black"
                  >
                    Suivant : Réauthentification
                  </button>
                </div>
              </div>
            )}

            {/* Étape 3 : Réauthentification mot de passe & 2FA */}
            {deleteStep === 3 && (
              <div className="space-y-4 text-xs">
                <p className="text-[#666660]">
                  Pour des raisons strictes de sécurité, veuillez ressaisir votre mot de passe pour confirmer votre identité.
                </p>

                <div>
                  <label className="block font-bold text-[#111111] mb-1">Mot de passe actuel</label>
                  <input
                    type="password"
                    id="input-delete-reauth-password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 bg-white text-[#111111] font-mono"
                  />
                </div>

                {twoFactorEnabled && (
                  <div>
                    <label className="block font-bold text-[#111111] mb-1">Code 2FA (6 chiffres)</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={deleteOtp}
                      onChange={(e) => setDeleteOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3 py-2 rounded-xl border border-black/10 bg-white text-[#111111] font-mono tracking-widest"
                    />
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteStep(2)}
                    className="px-4 py-2 text-xs font-bold text-[#666660]"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteStep(4)}
                    className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black"
                  >
                    Suivant : Confirmation
                  </button>
                </div>
              </div>
            )}

            {/* Étape 4 : Confirmation textuelle & case à cocher */}
            {deleteStep === 4 && (
              <div className="space-y-4 text-xs">
                <p className="text-[#666660]">
                  Pour valider définitivement la demande, veuillez taper le mot <strong>SUPPRIMER</strong> ci-dessous.
                </p>

                <div>
                  <input
                    type="text"
                    id="input-delete-confirm-word"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Tapez SUPPRIMER"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 bg-white font-mono font-bold text-rose-700"
                  />
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    id="checkbox-delete-agreement"
                    checked={deleteAgreementChecked}
                    onChange={(e) => setDeleteAgreementChecked(e.target.checked)}
                    className="h-4 w-4 rounded accent-rose-600 mt-0.5"
                  />
                  <span className="text-[11px] text-[#444440]">
                    Je comprends que mon compte sera désactivé immédiatement et entrera dans un délai de grâce de 14 jours avant purge définitive.
                  </span>
                </label>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteStep(3)}
                    className="px-4 py-2 text-xs font-bold text-[#666660]"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    id="btn-confirm-account-deletion"
                    onClick={handleConfirmDeletion}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    Confirmer la suppression
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. ONGLET WHATSAPP */}
      {activeTab === "whatsapp" && (
        <form onSubmit={handleSaveWhatsApp} className="max-w-3xl space-y-6">
          <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Paramètres WhatsApp & Modèles de Closing
            </h2>
            <p className="text-xs text-[#666660]">
              Ces modèles s'insèrent automatiquement lorsque vos closeuses cliquent sur le bouton WhatsApp d'une commande.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  Numéro WhatsApp de Support / Vente
                </label>
                <input
                  type="text"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  Modèle 1 : Confirmation immédiate de commande
                </label>
                <textarea
                  rows={3}
                  value={waConfirmTemplate}
                  onChange={(e) => setWaConfirmTemplate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  Modèle 2 : Avis de passage du livreur
                </label>
                <textarea
                  rows={3}
                  value={waDeliveryTemplate}
                  onChange={(e) => setWaDeliveryTemplate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  Modèle 3 : Relance client injoignable
                </label>
                <textarea
                  rows={3}
                  value={waFollowupTemplate}
                  onChange={(e) => setWaFollowupTemplate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Enregistrer les modèles WhatsApp</span>
            </button>
          </div>
        </form>
      )}

      {/* 4. ONGLET PIXELS & ANALYTICS */}
      {activeTab === "pixels" && (
        <form onSubmit={handleSavePixels} className="max-w-3xl space-y-6">
          <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Tracking Pixels & Conversions API
            </h2>
            <p className="text-xs text-[#666660]">
              Suivez chaque formulaire validé et optimisez vos campagnes Meta Ads et TikTok Ads pour le paiement à la livraison (COD).
            </p>

            <div className="space-y-4 text-xs">
              {/* Télémétrie Vue en direct (sans cookie ni IP stockée) */}
              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#111111]">Télémétrie & Vue en direct</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Sans cookie ni IP
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    id="toggle-live-tracking"
                    checked={liveViewTrackingEnabled}
                    onChange={(e) => setLiveViewTrackingEnabled(e.target.checked)}
                    className="h-4 w-4 accent-[#111111] cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-[#666660]">
                  Permet d'afficher les visiteurs simultanés sur le globe 3D et dans la section Stats › En direct. Un signal anonyme est transmis toutes les 30 secondes depuis la vitrine.
                </p>
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-black/[0.06] text-[11px] text-[#666660] space-y-1">
                  <p className="font-semibold text-[#111111]">Avertissement juridique &amp; Respect de la vie privée :</p>
                  <p>
                    Cette collecte s'exécute avec un identifiant aléatoire stocké uniquement en mémoire volatile (aucun cookie persistant, aucun stockage local). L'adresse IP du client est immédiatement jetée après déduction du pays via les en-têtes d'infrastructure et n'est jamais journalisée ni enregistrée dans une base de données.
                  </p>
                </div>
              </div>

              {/* Section Pixels Facebook (Meta) - Prompt 05-Px */}
              <div id="section-meta-pixels" className="p-5 rounded-2xl bg-white border border-black/[0.08] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#111111]">Pixels Facebook (Meta)</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        Jusqu'à 3 pixels
                      </span>
                      <span className="text-[11px] font-semibold text-[#888880]">
                        ({shopPixels.length}/3 configurés)
                      </span>
                    </div>
                    <p className="text-[11px] text-[#666660]">
                      Associez jusqu'à 3 pixels Meta à cette boutique. Chaque pixel peut être actif sur toute la vitrine ou restreint à des produits spécifiques pour isoler vos campagnes publicitaires.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {shopPixels.length >= 3 ? (
                      <div className="text-right">
                        <button
                          type="button"
                          id="btn-add-meta-pixel"
                          disabled
                          className="px-3.5 py-2 rounded-xl bg-black/[0.06] text-[#888880] text-xs font-bold cursor-not-allowed flex items-center gap-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Ajouter un pixel</span>
                        </button>
                        <span id="max-pixels-warning-text" className="block text-[10px] text-amber-700 font-semibold mt-1">
                          Maximum 3 pixels par boutique
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        id="btn-add-meta-pixel"
                        onClick={handleOpenAddPixel}
                        disabled={!canManagePixels(currentUserRole)}
                        className="px-3.5 py-2 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Ajouter un pixel</span>
                      </button>
                    )}
                  </div>
                </div>

                {!canManagePixels(currentUserRole) && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Mode consultation (Manager) : Seuls les administrateurs propriétaires et co-administrateurs peuvent ajouter, modifier ou supprimer des pixels.</span>
                  </div>
                )}

                {/* Configuration de l'événement envoyé à la commande */}
                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label htmlFor="select-pixel-order-event" className="block font-bold text-xs text-[#111111]">
                      Événement envoyé à la validation de la commande
                    </label>
                    <p className="text-[11px] text-[#666660]">
                      Le même identifiant d'événement (<code>event_id</code>) est transmis à tous les pixels actifs pour déduplication.
                    </p>
                  </div>
                  <select
                    id="select-pixel-order-event"
                    value={pixelSettings.orderEventToSend}
                    onChange={handleChangeOrderEventToSend}
                    disabled={!canManagePixels(currentUserRole)}
                    className="px-3 py-1.5 rounded-xl border border-black/[0.1] bg-white text-xs font-bold text-[#111111] focus:outline-none cursor-pointer"
                  >
                    <option value="Purchase">Purchase (Achat direct - Défaut)</option>
                    <option value="Lead">Lead (Prospect qualifié)</option>
                  </select>
                </div>

                {/* Liste des pixels configurés */}
                <div className="space-y-3">
                  {shopPixels.length === 0 ? (
                    <div className="p-6 rounded-xl border border-dashed border-black/[0.1] text-center text-[#888880] text-xs">
                      Aucun pixel configuré pour cette boutique. Cliquez sur « Ajouter un pixel » ci-dessus.
                    </div>
                  ) : (
                    shopPixels.map((pix) => {
                      const feedback = pixelTestFeedbacks[pix.id];
                      return (
                        <div
                          key={pix.id}
                          id={`meta-pixel-card-${pix.id}`}
                          className="p-4 rounded-xl border border-black/[0.08] bg-[#FAF8F5]/60 hover:bg-[#FAF8F5] transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-[#111111]">{pix.name}</span>
                                {pix.isActive ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                    Actif
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/[0.08] text-[#666660]">
                                    Inactif
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                                  En attente de consentement
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-[#666660]">
                                <span>ID : <strong className="font-mono text-[#111111]">{pix.pixelId}</strong></span>
                                <span>•</span>
                                <span>
                                  {pix.applyToAllProducts
                                    ? "Toute la boutique"
                                    : `Limité à ${pix.productIds.length} produit(s)`}
                                </span>
                                <span>•</span>
                                <span>
                                  {pix.capiEnabled
                                    ? `CAPI active (${pix.capiTrigger === "on_delivery" ? "Livraison réelle" : "Validation commande"})`
                                    : "Navigateur seul"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Toggle Actif / Inactif */}
                              <button
                                type="button"
                                id={`toggle-pixel-active-${pix.id}`}
                                onClick={() => handleTogglePixelActive(pix)}
                                disabled={!canManagePixels(currentUserRole)}
                                className={cn(
                                  "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                                  pix.isActive
                                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                    : "bg-black/[0.08] text-[#666660] hover:bg-black/[0.12]"
                                )}
                              >
                                {pix.isActive ? "Activé" : "Désactivé"}
                              </button>

                              {/* Modifier */}
                              <button
                                type="button"
                                id={`btn-edit-pixel-${pix.id}`}
                                onClick={() => handleOpenEditPixel(pix)}
                                disabled={!canManagePixels(currentUserRole)}
                                className="p-1.5 rounded-lg border border-black/[0.08] bg-white text-[#666660] hover:text-[#111111] transition-all cursor-pointer"
                                title="Modifier ce pixel"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>

                              {/* Tester mon pixel */}
                              <button
                                type="button"
                                id={`btn-test-pixel-${pix.id}`}
                                onClick={() => handleTestPixel(pix)}
                                disabled={isTestingPixelId === pix.id}
                                className="px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-[11px] font-bold hover:bg-blue-100 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                {isTestingPixelId === pix.id ? "Test en cours..." : "Tester mon pixel"}
                              </button>

                              {/* Supprimer */}
                              <button
                                type="button"
                                id={`btn-delete-pixel-${pix.id}`}
                                onClick={() => setPixelDeletingId(pix.id)}
                                disabled={!canManagePixels(currentUserRole)}
                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
                                title="Supprimer ce pixel"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Résultat du test direct */}
                          {feedback && (
                            <div
                              id={`pixel-test-result-${pix.id}`}
                              className={cn(
                                "p-3 rounded-xl border text-xs space-y-1",
                                feedback.success
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                                  : "bg-rose-50 border-rose-200 text-rose-900"
                              )}
                            >
                              <div className="flex items-center gap-1.5 font-bold">
                                {feedback.success ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-rose-600" />
                                )}
                                <span>{feedback.message}</span>
                              </div>
                              {feedback.fbTraceId && (
                                <p className="text-[11px] font-mono text-[#666660]">
                                  Trace ID : {feedback.fbTraceId}
                                </p>
                              )}
                              {feedback.testUrl && (
                                <a
                                  href={feedback.testUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:underline pt-0.5"
                                >
                                  <span>Voir les événements dans Meta Events Manager</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Lien d'aide */}
                <div className="pt-2 border-t border-black/[0.04] flex items-center justify-between text-[11px] text-[#666660]">
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-[#888880]" />
                    <span id="link-meta-pixel-help">
                      <strong>Où trouver mon ID de pixel ?</strong> Rendez-vous dans votre Gestionnaire d'événements Meta › Paramètres › ID du jeu de données (15 ou 16 chiffres).
                    </span>
                  </div>
                  <a
                    href="https://business.facebook.com/events_manager2"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 font-bold hover:underline inline-flex items-center gap-1 shrink-0 ml-2"
                  >
                    <span>Ouvrir Meta Events Manager</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#111111]">TikTok Pixel</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/[0.05] text-[#111111]">
                    TikTok Ads
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#888880] mb-1">
                    TikTok Pixel ID
                  </label>
                  <input
                    type="text"
                    value={tiktokPixelId}
                    onChange={(e) => setTiktokPixelId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white font-mono text-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#111111]">Google Analytics 4</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                    GA4
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#888880] mb-1">
                    ID de mesure (G-XXXXXXXXXX)
                  </label>
                  <input
                    type="text"
                    value={gaMeasurementId}
                    onChange={(e) => setGaMeasurementId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white font-mono text-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              {/* Microsoft Clarity (Prompt 05-E) */}
              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#111111]">Microsoft Clarity (Enregistrements d'écran & Heatmaps)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900">
                      Gratuit
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                    Mode strict activé
                  </span>
                </div>
                <p className="text-[11px] text-[#666660]">
                  Cartes de chaleur et enregistrements anonymes des sessions pour identifier les hésitations sur la fiche produit et le formulaire.
                </p>
                <div>
                  <label className="block text-[11px] font-semibold text-[#888880] mb-1">
                    Identifiant de projet Clarity (Project ID)
                  </label>
                  <input
                    type="text"
                    id="input-clarity-project-id"
                    value={clarityProjectId}
                    onChange={(e) => setClarityProjectId(e.target.value)}
                    placeholder="Ex: clarity_cod_9823"
                    className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white font-mono text-[#111111] focus:outline-none"
                  />
                </div>
                <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200 text-[11px] text-purple-950 space-y-1">
                  <p className="font-bold">Masquage strict des données (Conformité absolue) :</p>
                  <p>
                    Tous les champs de saisie (nom, téléphone, ville, adresse) sont systématiquement masqués avec des étoiles (•••••) dans les enregistrements vidéo. Aucun pixel n'est chargé avant acceptation explicite du bandeau de consentement.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Enregistrer les Pixels</span>
            </button>
          </div>
        </form>
      )}

      {/* 5. ONGLET NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <form onSubmit={handleSaveNotifications} className="max-w-2xl space-y-6">
          <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Alertes & Notifications en Temps Réel
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-white border border-black/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#111111] block">Son de nouvelle commande (Prompt 05-S)</span>
                    <span className="text-[10px] text-[#888880]">
                      Son unique pour toute l'équipe (Admin, Closeuse, Livreur, Agence). Anti-rafale 3s actif.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    id="sound-new-order-toggle"
                    checked={soundOnNewOrder}
                    onChange={(e) => {
                      setSoundOnNewOrder(e.target.checked);
                      notificationSound.setEnabled(e.target.checked);
                    }}
                    className="h-4 w-4 accent-[#111111] cursor-pointer"
                  />
                </div>

                {soundOnNewOrder && (
                  <div className="pt-2 border-t border-black/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F5] p-2.5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-[#888880]" />
                      <span className="text-[11px] font-bold text-[#111111]">Fichier :</span>
                      <code className="text-[10px] bg-white px-2 py-0.5 rounded border border-black/[0.08]">
                        public/sounds/novika-order.mp3
                      </code>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id="test-order-sound-btn"
                        onClick={async () => {
                          const played = await testOrderSound();
                          if (played) {
                            showToast("Son joué avec succès !");
                          } else {
                            showToast("Cliquez pour autoriser la lecture audio.");
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#111111] text-[#FAF8F5] text-[11px] font-bold hover:bg-black cursor-pointer shadow-2xs"
                      >
                        <Play className="h-3 w-3" />
                        <span>Tester le son</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-black/[0.06] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#111111] block">Alerte WhatsApp vendeur instantanée</span>
                  <span className="text-[10px] text-[#888880]">Recevoir un récapitulatif WhatsApp à chaque commande reçue</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifySellerWa}
                  onChange={(e) => setNotifySellerWa(e.target.checked)}
                  className="h-4 w-4 accent-[#111111] cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-black/[0.06] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#111111] block">Rapport financier quotidien par email</span>
                  <span className="text-[10px] text-[#888880]">Chaque soir à 21h00 : total encaissé, colis livrés et bénéfice net</span>
                </div>
                <input
                  type="checkbox"
                  checked={dailyDigestEmail}
                  onChange={(e) => setDailyDigestEmail(e.target.checked)}
                  className="h-4 w-4 accent-[#111111] cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-black/[0.06] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#111111] block">SMS automatique au client (Départ livreur)</span>
                  <span className="text-[10px] text-[#888880]">Prévient le client par SMS avec le numéro direct du coursier</span>
                </div>
                <input
                  type="checkbox"
                  checked={smsDeliveryAlert}
                  onChange={(e) => setSmsDeliveryAlert(e.target.checked)}
                  className="h-4 w-4 accent-[#111111] cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Enregistrer les préférences</span>
            </button>
          </div>
        </form>
      )}

      {/* 6. ONGLET ÉQUIPE (5 RÔLES : PROPRIÉTAIRE, ADMINISTRATEUR, CLOSEUSE, LIVREUR, AGENCE) */}
      {activeTab === "team" && (
        <div className="space-y-6">
          <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-[#111111] uppercase tracking-wide">
                  Membres & Rôles de l'Équipe (Permissions RLS)
                </h2>
                <p className="text-xs text-[#666660]">
                  Gérez les permissions strictes : Propriétaire, Administrateur, Closeuse WhatsApp, Livreur ou Agence de livraison.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/app/${storeSlug}/reglages/equipe/closeuses`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-black/[0.1] text-[#111111] text-xs font-bold hover:bg-black/[0.04] transition-all shadow-2xs"
                >
                  <span>Closeuses & commissions</span>
                </Link>
                <Link
                  href={`/app/${storeSlug}/reglages/equipe/horaires`}
                  id="link-to-team-schedules"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-black/[0.1] text-[#111111] text-xs font-bold hover:bg-black/[0.04] transition-all shadow-2xs"
                >
                  <Clock className="h-4 w-4 text-[#C2410C]" />
                  <span>Horaires de travail</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Inviter un collaborateur</span>
                </button>
              </div>
            </div>

            {/* Notice RLS Sécurité & Isolement des coûts */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-xs text-amber-950 space-y-1 leading-relaxed">
              <div className="flex items-center gap-2 font-black text-[#111111]">
                <Shield className="h-4 w-4 text-amber-700" />
                <span>Politiques de Sécurité RLS actives :</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-[#555550]">
                <li><strong>Closeuse :</strong> voit uniquement ses commandes assignées ou de son pays. Interdiction de marquer Livrée. Données financières masquées.</li>
                <li><strong>Livreur :</strong> voit uniquement ses livraisons assignées, son adresse et les espèces à encaisser. Total espèces à reverser en direct.</li>
                <li><strong>Agence de livraison :</strong> répartit les courses à ses propres livreurs, suit son taux de livraison % et ses reversements d'espèces.</li>
                <li><strong>Propriétaire / Admin :</strong> accès complet, assignation closeuses/livreurs, validation des reversements et gestion des tarifs.</li>
              </ul>
            </div>

            {/* Filtres par Rôle & Recherche */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setTeamFilterRole("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                    teamFilterRole === "all"
                      ? "bg-[#111111] text-[#FAF8F5]"
                      : "bg-white text-[#666660] border border-black/[0.08]"
                  )}
                >
                  Tous ({team.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTeamFilterRole("owner")}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                    teamFilterRole === "owner"
                      ? "bg-[#111111] text-[#FAF8F5]"
                      : "bg-white text-[#666660] border border-black/[0.08]"
                  )}
                >
                  Admin ({team.filter((m) => m.role === "owner" || m.role === "admin").length})
                </button>
                <button
                  type="button"
                  onClick={() => setTeamFilterRole("closer")}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                    teamFilterRole === "closer"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-[#666660] border border-black/[0.08]"
                  )}
                >
                  Closeurs ({team.filter((m) => m.role === "closer").length})
                </button>
                <button
                  type="button"
                  onClick={() => setTeamFilterRole("rider")}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                    teamFilterRole === "rider"
                      ? "bg-amber-600 text-white"
                      : "bg-white text-[#666660] border border-black/[0.08]"
                  )}
                >
                  Livreurs ({team.filter((m) => m.role === "rider").length})
                </button>
                <button
                  type="button"
                  onClick={() => setTeamFilterRole("agency")}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                    teamFilterRole === "agency"
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-[#666660] border border-black/[0.08]"
                  )}
                >
                  Agences ({team.filter((m) => m.role === "agency").length})
                </button>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#888880]" />
                <input
                  type="text"
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  placeholder="Rechercher collaborateur, tél..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                />
              </div>
            </div>

            {/* Modal Ajout Membre */}
            {showAddMemberModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                <div className="bg-[#FAF8F5] border border-black/[0.12] rounded-[24px] p-6 max-w-md w-full shadow-2xl space-y-4">
                  <h3 className="text-sm font-black text-[#111111]">
                    Inviter un nouveau collaborateur par lien
                  </h3>

                  <form onSubmit={handleAddTeamMember} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-[#111111] mb-1">
                        Nom complet ou Raison sociale <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="Ex: Nom du membre ou Agence"
                        className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-[#111111] mb-1">
                          Pays d'affectation
                        </label>
                        <select
                          value={newMemberCountry}
                          onChange={(e: any) => setNewMemberCountry(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                        >
                          <option value="TG">🇹🇬 Togo</option>
                          <option value="CI">🇨🇮 Côte d'Ivoire</option>
                          <option value="SN">🇸🇳 Sénégal</option>
                          <option value="BJ">🇧🇯 Bénin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-[#111111] mb-1">
                          Rôle attribué <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={newMemberRole}
                          onChange={(e: any) => setNewMemberRole(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                        >
                          <option value="owner">Admin</option>
                          <option value="closer">Closeur WhatsApp</option>
                          <option value="rider">Livreur de tournées</option>
                          <option value="agency">Agence de livraison partenaire</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#111111] mb-1">
                        Téléphone WhatsApp pour invitation directe <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={newMemberPhone}
                        onChange={(e) => setNewMemberPhone(e.target.value)}
                        placeholder="+22507000000 ou +22890000000"
                        className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] font-mono focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#111111] mb-1">
                        Email professionnel
                      </label>
                      <input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="collaborateur@gmail.com"
                        className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                      />
                    </div>

                    {newMemberRole === "rider" && (
                      <div>
                        <label className="block font-semibold text-[#111111] mb-1">
                          Rattaché à une agence de livraison (optionnel)
                        </label>
                        <input
                          type="text"
                          value={newMemberAgency}
                          onChange={(e) => setNewMemberAgency(e.target.value)}
                          placeholder="Ex: Flash Colis Express ou Indépendant"
                          className="w-full p-2.5 rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="pt-3 border-t border-black/[0.08] flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddMemberModal(false)}
                        className="px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-[#FAF8F5]"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black"
                      >
                        Générer l'invitation
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Liste des membres avec gestion des rôles et désactivation */}
            <div className="border border-black/[0.08] rounded-2xl bg-white overflow-hidden divide-y divide-black/[0.06] text-xs">
              {filteredTeam.map((member) => (
                <div
                  key={member.id}
                  className={cn(
                    "p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors",
                    member.active ? "hover:bg-black/[0.01]" : "bg-black/[0.02] opacity-75"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-[#111111] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {member.role === "agency" ? (
                        <Building2 className="h-5 w-5 text-emerald-300" />
                      ) : member.role === "rider" ? (
                        <Bike className="h-5 w-5 text-amber-300" />
                      ) : (
                        member.name.charAt(0)
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[#111111] text-sm">{member.name}</span>
                        {member.country && <CountryChip code={member.country} showName={false} />}
                        {roleBadge(member.role)}
                        {member.active ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#666660] font-bold bg-neutral-200 px-2 py-0.5 rounded-full">
                            Désactivé (Historique préservé)
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-[#888880] flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                        <span>{member.email}</span>
                        <span>•</span>
                        <a
                          href={`https://wa.me/${member.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-emerald-700 font-bold hover:underline flex items-center gap-1"
                        >
                          <MessageCircle className="h-3 w-3" />
                          <span>{member.phone}</span>
                        </a>
                        {member.agencyName && (
                          <>
                            <span>•</span>
                            <span className="text-[#111111] font-semibold">Agence : {member.agencyName}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>Rejoint le {member.joinedAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Membre : Copier invitation, Changer de rôle, Activer/Désactiver */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-black/[0.06]">
                    {/* Bouton Copier le lien d'invitation */}
                    <button
                      type="button"
                      onClick={() => handleCopyInviteLink(member)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/[0.08] bg-[#FAF8F5] text-[11px] font-bold text-[#111111] hover:bg-black/5 cursor-pointer shadow-2xs"
                      title="Copier le lien d'invitation unique"
                    >
                      <Copy className="h-3.5 w-3.5 text-[#666660]" />
                      <span>Lien d'invitation</span>
                    </button>

                    {/* Sélecteur Changement de Rôle */}
                    {member.role !== "owner" && (
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeMemberRole(member.id, e.target.value as UserRole)}
                        className="px-2.5 py-1.5 text-[11px] font-bold rounded-xl border border-black/[0.08] bg-white text-[#111111] focus:outline-none cursor-pointer"
                        title="Changer le rôle du collaborateur"
                      >
                        <option value="closer">Closeuse</option>
                        <option value="rider">Livreur</option>
                        <option value="agency">Agence</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}

                    {/* Désactivation sans perte d'historique */}
                    {member.role !== "owner" && (
                      <button
                        type="button"
                        onClick={() => handleToggleMemberActive(member.id)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border",
                          member.active
                            ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                            : "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                        )}
                        title={member.active ? "Désactiver l'accès sans perdre l'historique" : "Réactiver l'accès"}
                      >
                        {member.active ? "Désactiver" : "Réactiver"}
                      </button>
                    )}

                    {member.role !== "owner" && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-1.5 rounded-xl border border-black/[0.08] text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE AJOUT / MODIFICATION DE PIXEL META (Prompt 05-Px) */}
      {/* ======================================================== */}
      {isPixelModalOpen && (
        <div
          id="modal-meta-pixel"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-lg rounded-3xl border border-black/[0.1] bg-white p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#111111]">
                  {editingPixelInternalId ? "Modifier le pixel Meta" : "Ajouter un pixel Facebook (Meta)"}
                </h3>
                <p className="text-[11px] text-[#666660]">
                  Configurez l'identifiant et les options de diffusion pour cette boutique.
                </p>
              </div>
              <button
                type="button"
                id="btn-cancel-pixel-modal"
                onClick={() => setIsPixelModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-black/[0.05] text-[#888880] hover:text-[#111111] transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePixelModal} noValidate className="space-y-4 text-xs">
              {/* Nom interne */}
              <div>
                <label className="block font-bold text-[#111111] mb-1">
                  Nom interne du pixel *
                </label>
                <input
                  type="text"
                  id="input-pixel-modal-name"
                  required
                  value={pixelFormName}
                  onChange={(e) => setPixelFormName(e.target.value)}
                  placeholder="Ex : Pixel Togo – Montres & Santé"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-black/[0.12]"
                />
              </div>

              {/* ID du pixel */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-[#111111]">
                    Identifiant de pixel (Pixel ID) *
                  </label>
                  <span className="text-[10px] text-[#888880]">15 ou 16 chiffres uniquement</span>
                </div>
                <input
                  type="text"
                  id="input-pixel-modal-id"
                  required
                  value={pixelFormId}
                  onChange={(e) => setPixelFormId(e.target.value)}
                  placeholder="Ex : 109283746501928"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.1] bg-white font-mono text-[#111111] focus:outline-none focus:ring-2 focus:ring-black/[0.12]"
                />
                {pixelFormId.length > 0 && !validatePixelId(pixelFormId).isValid && (
                  <p id="pixel-modal-id-error" className="text-[11px] text-rose-600 font-semibold mt-1">
                    {validatePixelId(pixelFormId).error}
                  </p>
                )}
              </div>

              {/* Limiter à certains produits */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#111111] block">Périmètre de diffusion</span>
                    <span className="text-[11px] text-[#666660]">
                      {pixelFormApplyAll ? "Actif sur toute la boutique" : "Limité à des produits spécifiques"}
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      id="checkbox-pixel-limit-products"
                      checked={!pixelFormApplyAll}
                      onChange={(e) => setPixelFormApplyAll(!e.target.checked)}
                      className="h-4 w-4 accent-[#111111] cursor-pointer"
                    />
                    <span>Limiter à certains produits</span>
                  </label>
                </div>

                {!pixelFormApplyAll && (
                  <div className="pt-2 border-t border-black/[0.06] space-y-1.5">
                    <span className="text-[11px] font-bold text-[#111111] block">
                      Sélectionnez les produits concernés :
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {MOCK_PRODUCTS.slice(0, 8).map((p) => {
                        const isChecked = pixelFormProductIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer transition-all"
                          >
                            <input
                              type="checkbox"
                              id={`checkbox-product-${p.id}`}
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPixelFormProductIds((prev) => [...prev, p.id]);
                                } else {
                                  setPixelFormProductIds((prev) => prev.filter((id) => id !== p.id));
                                }
                              }}
                              className="h-3.5 w-3.5 accent-[#111111]"
                            />
                            <span className="text-[11px] text-[#111111] truncate">{p.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* API de Conversions (CAPI) */}
              <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#111111] block">API de conversions (côté serveur - CAPI)</span>
                    <span className="text-[11px] text-[#666660]">
                      Améliore la précision face aux bloqueurs et pertes réseau
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    id="toggle-pixel-capi"
                    checked={pixelFormCapiEnabled}
                    onChange={(e) => setPixelFormCapiEnabled(e.target.checked)}
                    className="h-4 w-4 accent-blue-600 cursor-pointer"
                  />
                </div>

                {pixelFormCapiEnabled && (
                  <div className="space-y-3 pt-2 border-t border-blue-200/60">
                    <div>
                      <label className="block font-bold text-[#111111] mb-1">
                        Jeton d'accès Meta (CAPI Token)
                      </label>
                      <input
                        type="password"
                        id="input-pixel-capi-token"
                        value={pixelFormCapiToken}
                        onChange={(e) => setPixelFormCapiToken(e.target.value)}
                        placeholder={editingPixelInternalId ? "•••••••• enregistré (laisser vide pour conserver)" : "EAAG... (Généré dans Meta Events Manager)"}
                        className="w-full px-3 py-2 rounded-xl border border-black/[0.1] bg-white font-mono text-[11px] text-[#111111] focus:outline-none"
                      />
                      <p className="text-[10px] text-[#666660] mt-0.5">
                        Chiffré en base. N'est jamais exposé au navigateur ni dans les journaux clients.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="select-pixel-capi-trigger" className="block font-bold text-[#111111] mb-1">
                        Moment d'envoi de l'événement « Purchase »
                      </label>
                      <select
                        id="select-pixel-capi-trigger"
                        value={pixelFormCapiTrigger}
                        onChange={(e) => setPixelFormCapiTrigger(e.target.value as "on_order" | "on_delivery")}
                        className="w-full px-3 py-2 rounded-xl border border-black/[0.1] bg-white text-xs font-semibold text-[#111111] focus:outline-none cursor-pointer"
                      >
                        <option value="on_order">À la validation de commande par le client (Standard)</option>
                        <option value="on_delivery">À la livraison réelle (Statut « Livrée » - Recommandé COD)</option>
                      </select>
                      <p className="text-[10px] text-[#666660] mt-1 leading-relaxed">
                        Le mode « Livraison réelle » permet d'optimiser l'algorithme Meta uniquement sur les commandes réellement payées et encaissées sur le terrain.
                      </p>
                    </div>

                    <div>
                      <label className="block font-bold text-[#111111] mb-1">
                        Code d'événement de test Meta (Test Event Code - Facultatif)
                      </label>
                      <input
                        type="text"
                        id="input-pixel-test-code"
                        value={pixelFormTestCode}
                        onChange={(e) => setPixelFormTestCode(e.target.value)}
                        placeholder="Ex : TEST98231"
                        className="w-full px-3 py-2 rounded-xl border border-black/[0.1] bg-white font-mono text-[11px] text-[#111111] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {pixelFormError && (
                <div
                  id="pixel-modal-error-message"
                  className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{pixelFormError}</span>
                </div>
              )}

              <div className="pt-3 border-t border-black/[0.06] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPixelModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-black/[0.08] text-xs font-bold text-[#666660] hover:text-[#111111] cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  id="btn-submit-pixel-modal"
                  className="px-5 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all shadow-sm cursor-pointer"
                >
                  {editingPixelInternalId ? "Enregistrer les modifications" : "Ajouter le pixel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE CONFIRMATION DE SUPPRESSION DE PIXEL              */}
      {/* ======================================================== */}
      {pixelDeletingId && (
        <div
          id="modal-delete-pixel-confirm"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-sm rounded-3xl border border-black/[0.1] bg-white p-6 shadow-2xl space-y-4 text-center">
            <div className="h-12 w-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111111]">
                Supprimer ce pixel Meta ?
              </h3>
              <p className="text-xs text-[#666660] mt-1">
                Cette action supprimera définitivement le pixel et arrêtera la transmission des événements de conversion vers ce compte publicitaire.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                id="btn-cancel-delete-pixel"
                onClick={() => setPixelDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-black/[0.08] text-xs font-bold text-[#666660] hover:text-[#111111] cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                id="btn-confirm-delete-pixel"
                onClick={() => handleDeletePixel(pixelDeletingId)}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all shadow-sm cursor-pointer"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
