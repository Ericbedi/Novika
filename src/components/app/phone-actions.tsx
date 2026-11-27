"use client";

import React, { useState } from "react";
import { Check, Copy, MessageCircle, Phone } from "lucide-react";
import { formatNational, telLink, whatsappLink } from "@/lib/phone";
import { cn } from "@/lib/utils";

interface PhoneActionsProps {
  phoneE164: string;
  name?: string;
  orderNumber?: string;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  className?: string;
}

export function PhoneActions({
  phoneE164,
  name,
  orderNumber,
  size = "md",
  showNumber = false,
  className,
}: PhoneActionsProps) {
  const [copied, setCopied] = useState(false);

  const defaultMessage = name
    ? `Bonjour ${name}, je vous contacte depuis notre boutique concernant votre commande${
        orderNumber ? ` #${orderNumber}` : ""
      }. Êtes-vous disponible pour la livraison ?`
    : undefined;

  const waUrl = whatsappLink(phoneE164, defaultMessage);
  const callUrl = telLink(phoneE164);
  const formattedNumber = formatNational(phoneE164);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(phoneE164);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const buttonSizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-8 w-8 text-xs",
    lg: "h-11 min-h-[44px] px-3 gap-2 text-sm", // min 44px pour mobile
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-4.5 w-4.5",
  };

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      {showNumber && (
        <span className="font-mono text-xs font-bold text-[#111111]">
          {formattedNumber}
        </span>
      )}

      {/* Bouton WhatsApp */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Contacter sur WhatsApp"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-bold transition-all shadow-xs",
          "bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95",
          buttonSizeClasses[size]
        )}
      >
        <MessageCircle className={iconSizes[size]} />
        {size === "lg" && <span>WhatsApp</span>}
      </a>

      {/* Bouton Appel téléphonique */}
      <a
        href={callUrl}
        title="Appeler le client"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-bold transition-all border",
          "border-black/[0.08] bg-white text-[#111111] hover:bg-[#162B1C] hover:text-[#FAF8F5] active:scale-95",
          buttonSizeClasses[size]
        )}
      >
        <Phone className={iconSizes[size]} />
        {size === "lg" && <span>Appeler</span>}
      </a>

      {/* Bouton Copier */}
      <button
        type="button"
        title={copied ? "Copié !" : "Copier le numéro"}
        onClick={handleCopy}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all border",
          "border-black/[0.08] bg-white text-[#666660] hover:text-[#111111] hover:border-black/20 active:scale-95",
          buttonSizeClasses[size]
        )}
      >
        {copied ? (
          <Check className={cn(iconSizes[size], "text-emerald-600")} />
        ) : (
          <Copy className={iconSizes[size]} />
        )}
      </button>
    </div>
  );
}
