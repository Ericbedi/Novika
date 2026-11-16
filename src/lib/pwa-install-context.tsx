"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Share, PlusSquare, CheckSquare, X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PWAInstallContextType {
  canInstall: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  showIOSModal: boolean;
  setShowIOSModal: (show: boolean) => void;
  promptInstall: () => Promise<void>;
  dismissInstall: () => void;
}

const PWAInstallContext = createContext<PWAInstallContextType>({
  canInstall: false,
  isInstalled: false,
  isIOS: false,
  showIOSModal: false,
  setShowIOSModal: () => {},
  promptInstall: async () => {},
  dismissInstall: () => {},
});

export function usePWAInstall() {
  return useContext(PWAInstallContext);
}

export function PWAInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Détecter si déjà installé en mode standalone
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
    }

    // Détecter iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIosDevice);

    // Capturer l'événement natif sans AUCUN affichage automatique
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Règle stricte : empêche le pop-up automatique natif
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (isInstalled) return;

    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback si pas de prompt natif disponible sur ce navigateur
      setShowIOSModal(true);
    }
  };

  const dismissInstall = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("afribuilder_pwa_dismissed", "true");
    }
    setShowIOSModal(false);
  };

  const canInstall = !isInstalled && (Boolean(deferredPrompt) || isIOS);

  return (
    <PWAInstallContext.Provider
      value={{
        canInstall,
        isInstalled,
        isIOS,
        showIOSModal,
        setShowIOSModal,
        promptInstall,
        dismissInstall,
      }}
    >
      {children}
      {/* Feuille modale d'installation iOS 3 étapes */}
      {showIOSModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#FAF8F5] border border-black/10 p-6 shadow-2xl text-[#111111] animate-in slide-in-from-bottom duration-300">
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              aria-label="Fermer"
              className="absolute top-4 right-4 p-2 rounded-xl text-[#888880] hover:text-[#111111] hover:bg-black/[0.04]"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-[#111111] text-[#FAF8F5] flex items-center justify-center font-black text-sm shrink-0">
                A
              </div>
              <div>
                <h3 id="pwa-install-title" className="text-base font-black tracking-tight">
                  Installer l'application AfriBuilder
                </h3>
                <p className="text-xs text-[#666660]">
                  Accédez plus rapidement à vos commandes et stocks
                </p>
              </div>
            </div>

            <div className="space-y-3 my-5 bg-white p-4 rounded-2xl border border-black/[0.08] text-xs">
              <div className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-black/[0.06] font-black text-[#111111] flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <div className="flex-1">
                  <p className="font-bold text-[#111111] flex items-center gap-1.5">
                    Appuyez sur le bouton Partager
                    <Share className="h-4 w-4 text-[#C2410C] inline" />
                  </p>
                  <p className="text-[11px] text-[#666660] mt-0.5">
                    Dans la barre de navigation Safari en bas de votre écran.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-black/[0.06] font-black text-[#111111] flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <div className="flex-1">
                  <p className="font-bold text-[#111111] flex items-center gap-1.5">
                    Sélectionnez « Sur l'écran d'accueil »
                    <PlusSquare className="h-4 w-4 text-[#C2410C] inline" />
                  </p>
                  <p className="text-[11px] text-[#666660] mt-0.5">
                    Faites défiler le menu d'options vers le bas si besoin.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-black/[0.06] font-black text-[#111111] flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <div className="flex-1">
                  <p className="font-bold text-[#111111] flex items-center gap-1.5">
                    Touchez « Ajouter »
                    <CheckSquare className="h-4 w-4 text-emerald-600 inline" />
                  </p>
                  <p className="text-[11px] text-[#666660] mt-0.5">
                    En haut à droite de l'écran pour finaliser l'installation.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={dismissInstall}
                className="px-4 py-2 text-xs font-bold text-[#666660] hover:text-[#111111]"
              >
                Ne plus afficher
              </button>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all"
              >
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </PWAInstallContext.Provider>
  );
}
