"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  Truck,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  type: "order" | "delivery" | "stock" | "system";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  link?: string;
}

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  basePath: string;
  triggerRect?: DOMRect | null;
}

export function NotificationsPanel({
  isOpen,
  onClose,
  basePath,
  triggerRect,
}: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fermeture par touche Échap
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Clic extérieur
  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="h-3.5 w-3.5 text-[#C2410C]" />;
      case "delivery":
        return <Truck className="h-3.5 w-3.5 text-blue-600" />;
      case "stock":
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />;
      case "system":
        return <Sparkles className="h-3.5 w-3.5 text-emerald-600" />;
    }
  };

  // Groupes
  const categories = [
    { type: "order" as const, label: "Commandes" },
    { type: "delivery" as const, label: "Livraisons" },
    { type: "stock" as const, label: "Stocks" },
    { type: "system" as const, label: "Système" },
  ];

  // Calcul positionnement relatif à l'entrée
  let panelStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 9999,
  };

  if (triggerRect) {
    const spaceRight = window.innerWidth - triggerRect.right;
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      panelStyle = {
        position: "fixed",
        top: Math.max(16, triggerRect.top - 10),
        left: 16,
        right: 16,
        zIndex: 9999,
      };
    } else {
      // Ouvre à droite de la barre latérale, aligné sur l'entrée
      const leftPos = spaceRight >= 360 ? triggerRect.right + 8 : triggerRect.left;
      const topPos = Math.min(triggerRect.top, window.innerHeight - 440);
      panelStyle = {
        position: "fixed",
        top: Math.max(16, topPos),
        left: leftPos,
        width: 340,
        zIndex: 9999,
      };
    }
  } else {
    panelStyle = {
      position: "fixed",
      top: 64,
      left: 264,
      width: 340,
      zIndex: 9999,
    };
  }

  return createPortal(
    <div
      ref={panelRef}
      id="notifications-portal-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Panneau de notifications"
      style={panelStyle}
      className="rounded-2xl border border-black/[0.1] bg-[#FAF8F5] p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.18)] animate-in fade-in zoom-in-95 duration-150 text-[#111111] max-h-[calc(100vh-80px)] flex flex-col"
    >
      {/* En-tête */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/[0.08] shrink-0">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[#111111]" />
          <h4 className="text-xs font-black uppercase tracking-wider">
            Notifications {unreadCount > 0 && `(${unreadCount})`}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-[10px] font-bold text-[#C2410C] hover:underline cursor-pointer flex items-center gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              <span>Tout marquer comme lu</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-1 rounded-lg text-[#888880] hover:text-[#111111] hover:bg-black/[0.04]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Liste groupée par type */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-[#888880] space-y-1">
            <Bell className="h-6 w-6 mx-auto opacity-30" />
            <p className="text-xs font-medium">Aucune notification pour le moment</p>
          </div>
        ) : (
          categories.map((cat) => {
          const items = notifications.filter((n) => n.type === cat.type);
          if (items.length === 0) return null;

          return (
            <div key={cat.type} className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#888880] block px-1">
                {cat.label}
              </span>
              <div className="space-y-1">
                {items.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "p-2.5 rounded-xl border transition-all text-xs",
                      notif.isRead
                        ? "bg-white/50 border-black/[0.04] text-[#666660]"
                        : "bg-white border-black/[0.08] text-[#111111] shadow-2xs font-medium"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className="p-1 rounded-lg bg-black/[0.04] shrink-0 mt-0.5">
                        {getIcon(notif.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-bold text-[11px] truncate">{notif.title}</p>
                          <span className="text-[9px] text-[#888880] shrink-0">{notif.time}</span>
                        </div>
                        <p className="text-[11px] mt-0.5 leading-snug text-[#555550]">
                          {notif.message}
                        </p>
                        {notif.link && (
                          <Link
                            href={`${basePath}${notif.link}`}
                            onClick={onClose}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#C2410C] hover:underline mt-1"
                          >
                            <span>Voir le détail</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pied fixe */}
      <div className="pt-2 mt-2 border-t border-black/[0.08] flex items-center justify-between text-[11px] shrink-0">
        <span className="text-[#888880]">Centre d'alertes COD</span>
        <Link
          href={`${basePath}/reglages?tab=notifications`}
          onClick={onClose}
          className="font-bold text-[#111111] hover:underline"
        >
          Paramètres ›
        </Link>
      </div>
    </div>,
    document.body
  );
}
