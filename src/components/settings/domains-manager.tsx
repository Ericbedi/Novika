"use client";

import React, { useState, useEffect } from "react";
import {
  Globe2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Trash2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Plus,
  X,
  Server,
  HelpCircle,
  Check,
  Star,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import {
  CustomDomain,
  DnsRecordInstruction,
  VERCEL_APEX_IP,
  VERCEL_CNAME_TARGET,
  validateDomainFormat,
} from "@/lib/custom-domains";
import { cn } from "@/lib/utils";

interface DomainsManagerProps {
  storeSlug: string;
  storeName?: string;
  role?: string;
}

export function DomainsManager({ storeSlug, storeName = "Ma Boutique", role = "owner" }: DomainsManagerProps) {
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modale d'ajout
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [domainInput, setDomainInput] = useState("");
  const [isPrimaryChecked, setIsPrimaryChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalStep, setModalStep] = useState<"input" | "dns" | "verifying">("input");
  const [createdDomain, setCreatedDomain] = useState<CustomDomain | null>(null);

  // État de vérification
  const [verifyingDomainId, setVerifyingDomainId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomDomain | null>(null);

  const isAuthorized = role === "owner" || role === "admin";

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      showToast("Copié dans le presse-papiers !");
    }
  };

  // Chargement des domaines
  const loadDomains = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/domains?storeSlug=${encodeURIComponent(storeSlug)}`);
      const data = await res.json();
      if (data.domains) {
        setDomains(data.domains);
      }
    } catch {
      setErrorMsg("Impossible de charger les domaines.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDomains();
  }, [storeSlug]);

  // Ajouter un domaine
  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = validateDomainFormat(domainInput);
    if (!validation.isValid) {
      setErrorMsg(validation.error || "Format de domaine invalide.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug,
          domain: validation.normalized,
          isPrimary: isPrimaryChecked,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Échec lors de l'ajout du domaine.");
        return;
      }

      setCreatedDomain(data.domain);
      setModalStep("dns");
      loadDomains();
      showToast(`Domaine ${data.domain.domain} ajouté avec succès !`);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vérifier DNS
  const handleVerifyDns = async (domainObj: CustomDomain) => {
    setVerifyingDomainId(domainObj.id);
    try {
      const res = await fetch("/api/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug,
          domain: domainObj.domain,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.isVerified) {
          showToast(`Domaine ${domainObj.domain} validé ! HTTPS et DNS actifs.`);
        } else {
          showToast(`Vérification en cours : la propagation DNS peut prendre quelques minutes.`);
        }
        loadDomains();
      } else {
        showToast(data.error || "Erreur lors de la vérification.");
      }
    } catch {
      showToast("Erreur réseau lors de la vérification.");
    } finally {
      setVerifyingDomainId(null);
    }
  };

  // Supprimer un domaine
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(
        `/api/domains?storeSlug=${encodeURIComponent(storeSlug)}&id=${encodeURIComponent(deleteTarget.id)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Domaine ${deleteTarget.domain} retiré avec succès.`);
        setDeleteTarget(null);
        loadDomains();
      } else {
        showToast(data.error || "Erreur lors de la suppression.");
      }
    } catch {
      showToast("Erreur réseau.");
    }
  };

  const primaryDomain = domains.find((d) => d.isPrimary);
  const secondaryDomains = domains.filter((d) => !d.isPrimary);
  const fallbackUrl = `https://novika-delta.vercel.app/boutique/${storeSlug}`;

  if (!isAuthorized) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-rose-200 text-center space-y-3">
        <ShieldAlert className="h-8 w-8 text-rose-500 mx-auto" />
        <h2 className="text-lg font-black text-[#111111]">Accès réservé aux administrateurs</h2>
        <p className="text-xs text-[#666660]">
          La configuration des noms de domaine personnalisés et des certificats SSL est réservée au propriétaire de la boutique.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#111111] text-[#FAF8F5] px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
              Réglages boutique · Domaines
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#111111] tracking-tight">
            Noms de domaine personnalisés
          </h1>
          <p className="text-xs text-[#666660] mt-0.5">
            Connectez votre propre nom de domaine (ex: kelio.com). Le certificat HTTPS / SSL est généré et renouvelé automatiquement.
          </p>
        </div>

        <button
          type="button"
          id="btn-add-domain"
          onClick={() => {
            setModalStep("input");
            setDomainInput("");
            setIsPrimaryChecked(domains.length === 0);
            setErrorMsg(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all shadow-xs shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter un domaine</span>
        </button>
      </div>

      {/* Alerte Domaine Actif & Sécurité */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-[#111111]">
            Isolation étanche de l'administration (Sécurité Novika)
          </p>
          <p className="text-[#666660] leading-relaxed">
            Vos domaines personnalisés servent <strong>uniquement la vitrine</strong> de votre boutique. Aucune page d'administration ni interface de commande n'y est accessible. Tout appel non autorisé renvoie une erreur 404 neutre sans révéler la plateforme.
          </p>
        </div>
      </div>

      {/* Adresse de secours Novika */}
      <div className="p-4 rounded-2xl bg-white border border-[#E6E0D4] space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-[#666660]" />
            <span className="text-xs font-bold text-[#111111]">Adresse par défaut Novika (Secours)</span>
          </div>
          {primaryDomain && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/5 text-[#666660]">
              noindex actif
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E6E0D4]">
          <span className="text-xs font-mono text-[#111111] truncate">{fallbackUrl}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => copyToClipboard(fallbackUrl, "fallback")}
              className="p-1.5 rounded-lg hover:bg-black/5 text-[#666660] transition-colors"
              title="Copier le lien"
            >
              {copiedKey === "fallback" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-black/5 text-[#666660] transition-colors"
              title="Ouvrir dans un nouvel onglet"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        <p className="text-[11px] text-[#666660]">
          Cette adresse reste toujours opérationnelle en secours. Dès qu'un domaine principal est actif, la balise <code>noindex</code> est automatiquement appliquée sur cette adresse pour éviter tout contenu dupliqué sur Google.
        </p>
      </div>

      {/* Liste des domaines configurés */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-[#666660]">
          Domaines connectés ({domains.length})
        </h2>

        {loading ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#E6E0D4]">
            <RefreshCw className="h-6 w-6 animate-spin text-[#666660] mx-auto" />
            <p className="text-xs text-[#666660] mt-2 font-medium">Chargement des domaines...</p>
          </div>
        ) : domains.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#E6E0D4] space-y-3">
            <Globe2 className="h-10 w-10 text-[#CCCCCC] mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#111111]">Aucun domaine personnalisé</p>
              <p className="text-xs text-[#666660] max-w-md mx-auto">
                Votre boutique utilise actuellement l'adresse de secours Novika. Ajoutez votre propre domaine pour renforcer votre crédibilité et votre image de marque auprès de vos clients.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setModalStep("input");
                setDomainInput("");
                setIsPrimaryChecked(true);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Connecter un domaine</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {domains.map((dom) => {
              const isVerifying = verifyingDomainId === dom.id;
              const isApex = !dom.domain.startsWith("www.") && dom.domain.split(".").length === 2;

              return (
                <div
                  key={dom.id}
                  className={cn(
                    "p-4 rounded-2xl border bg-white transition-all space-y-4",
                    dom.isPrimary ? "border-[#111111] shadow-2xs" : "border-[#E6E0D4]"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E6E0D4] flex items-center justify-center shrink-0">
                        <Globe2 className="h-5 w-5 text-[#111111]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-black text-[#111111]">{dom.domain}</span>
                          {dom.isPrimary ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#111111] text-white">
                              <Star className="h-3 w-3 fill-current" />
                              Principal
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/5 text-[#666660]">
                              Redirige vers {primaryDomain?.domain || "le domaine principal"} (301)
                            </span>
                          )}

                          {/* Badge Statut */}
                          {dom.status === "active" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Actif · HTTPS
                            </span>
                          ) : dom.status === "verifying" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
                              Vérification en cours
                            </span>
                          ) : dom.status === "error" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <AlertTriangle className="h-3 w-3 text-rose-600" />
                              Erreur de configuration
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                              <Clock className="h-3 w-3 text-amber-600" />
                              En attente de DNS
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#666660] mt-0.5">
                          {dom.statusReason || (dom.status === "active" ? "Certificat SSL actif avec renouvellement automatique." : "Enregistrements DNS requis chez votre registrar.")}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleVerifyDns(dom)}
                        disabled={isVerifying}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] hover:bg-black/5 text-xs font-bold text-[#111111] transition-colors disabled:opacity-50"
                        title="Vérifier la détection DNS"
                      >
                        <RefreshCw className={cn("h-3.5 w-3.5", isVerifying && "animate-spin")} />
                        <span>{isVerifying ? "Vérification..." : "Vérifier maintenant"}</span>
                      </button>

                      <a
                        href={`https://${dom.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] hover:bg-black/5 text-[#666660] hover:text-[#111111] transition-colors"
                        title="Ouvrir la vitrine"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(dom)}
                        className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                        title="Retirer ce domaine"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Instructions DNS si en attente ou erreur */}
                  {dom.status !== "active" && dom.dnsRecords && dom.dnsRecords.length > 0 && (
                    <div className="pt-2 border-t border-[#E6E0D4] space-y-2">
                      <p className="text-[11px] font-bold text-[#111111]">
                        Enregistrements DNS à configurer chez votre registrar (Namecheap, OVH, GoDaddy, LWS...) :
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border border-[#E6E0D4] rounded-xl overflow-hidden bg-[#FAF8F5]">
                          <thead>
                            <tr className="bg-black/5 text-[#666660] font-bold text-[10px] uppercase tracking-wider">
                              <th className="p-2">Type</th>
                              <th className="p-2">Nom / Hôte</th>
                              <th className="p-2">Valeur cible</th>
                              <th className="p-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E6E0D4] font-mono">
                            {dom.dnsRecords.map((rec, idx) => (
                              <tr key={idx} className="hover:bg-black/[0.02]">
                                <td className="p-2 font-bold text-[#111111]">{rec.type}</td>
                                <td className="p-2 text-[#444440]">{rec.name}</td>
                                <td className="p-2 text-[#111111] select-all truncate max-w-xs">{rec.value}</td>
                                <td className="p-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(rec.value, `${dom.id}_${idx}`)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-[#E6E0D4] text-[10px] font-sans font-bold hover:bg-black/5 transition-colors"
                                  >
                                    {copiedKey === `${dom.id}_${idx}` ? (
                                      <>
                                        <Check className="h-3 w-3 text-emerald-600" />
                                        <span>Copié</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" />
                                        <span>Copier</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Guide Registrar pas à pas */}
      <div className="p-5 rounded-2xl bg-white border border-[#E6E0D4] space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-[#666660]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
            Guide pratique de configuration chez votre registrar
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E0D4] space-y-1.5">
            <p className="font-bold text-[#111111]">Namecheap</p>
            <p className="text-[#666660] text-[11px] leading-relaxed">
              Allez dans <em>Domain List → Manage → Advanced DNS</em>. Cliquez sur <em>Add New Record</em> :
              <br />• <strong>Type: A Record</strong>, Host: <code>@</code>, Value: <code>{VERCEL_APEX_IP}</code>
              <br />• <strong>Type: CNAME</strong>, Host: <code>www</code>, Value: <code>{VERCEL_CNAME_TARGET}</code>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E0D4] space-y-1.5">
            <p className="font-bold text-[#111111]">OVHcloud</p>
            <p className="text-[#666660] text-[11px] leading-relaxed">
              Dans l'espace client, cliquez sur votre domaine puis onglet <em>Zone DNS → Ajouter une entrée</em> :
              <br />• <strong>Champ A</strong> (laisser sous-domaine vide), Cible: <code>{VERCEL_APEX_IP}</code>
              <br />• <strong>Champ CNAME</strong>, Sous-domaine: <code>www</code>, Cible: <code>{VERCEL_CNAME_TARGET}.</code>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E0D4] space-y-1.5">
            <p className="font-bold text-[#111111]">GoDaddy</p>
            <p className="text-[#666660] text-[11px] leading-relaxed">
              Dans <em>Mes produits → Domaines → Gérer le DNS</em> :
              <br />• Modifiez l'enregistrement <strong>A</strong> existant pour <code>@</code> vers <code>{VERCEL_APEX_IP}</code>
              <br />• Modifiez le <strong>CNAME</strong> pour <code>www</code> vers <code>{VERCEL_CNAME_TARGET}</code>
            </p>
          </div>
        </div>
      </div>

      {/* MODAL : AJOUT D'UN DOMAINE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E6E0D4] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E6E0D4] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-[#111111]" />
                <h3 className="font-black text-sm text-[#111111]">
                  {modalStep === "input" ? "Connecter un nom de domaine" : "Instructions DNS Vercel"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-black/5 text-[#666660] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {modalStep === "input" && (
                <form onSubmit={handleAddDomain} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#111111]">
                      Nom de domaine à connecter
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="input-domain-name"
                        value={domainInput}
                        onChange={(e) => setDomainInput(e.target.value)}
                        placeholder="ex: kelio.com ou www.kelio.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-xs font-mono text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
                        required
                        autoFocus
                      />
                    </div>
                    <p className="text-[11px] text-[#666660]">
                      Entrez le domaine sans « http:// » ni « https:// ». Ex: <strong>kelio.com</strong>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E0D4] space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isPrimaryChecked}
                        onChange={(e) => setIsPrimaryChecked(e.target.checked)}
                        className="rounded border-[#CCCCCC] text-[#111111] focus:ring-[#111111]"
                      />
                      <span className="text-xs font-bold text-[#111111]">
                        Définir comme domaine principal de la boutique
                      </span>
                    </label>
                    <p className="text-[11px] text-[#666660] pl-5">
                      Si coché, les éventuels sous-domaines ou anciens domaines redirigeront automatiquement vers cette adresse en 301.
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-[#E6E0D4] text-xs font-bold text-[#666660] hover:bg-black/5 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !domainInput.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Connexion en cours...</span>
                        </>
                      ) : (
                        <>
                          <span>Continuer</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {modalStep === "dns" && createdDomain && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      Domaine <strong>{createdDomain.domain}</strong> associé à la boutique avec succès !
                    </span>
                  </div>

                  <p className="text-xs text-[#666660] leading-relaxed">
                    Pour finaliser l'activation et générer le certificat SSL gratuit, rendez-vous chez votre registrar et ajoutez les enregistrements ci-dessous :
                  </p>

                  <div className="space-y-2">
                    {createdDomain.dnsRecords.map((rec, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E0D4] space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-[#111111]">
                          <span>Enregistrement {rec.type}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(rec.value, `modal_${idx}`)}
                            className="inline-flex items-center gap-1 text-[11px] text-[#666660] hover:text-[#111111]"
                          >
                            {copiedKey === `modal_${idx}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            <span>Copier la valeur</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-[#666660] block font-sans">Hôte / Nom :</span>
                            <span className="p-1 rounded bg-white border border-[#E6E0D4] block">{rec.name}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#666660] block font-sans">Cible / Valeur :</span>
                            <span className="p-1 rounded bg-white border border-[#E6E0D4] block truncate">{rec.value}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all"
                    >
                      Terminer & Fermer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL : CONFIRMATION DE SUPPRESSION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E6E0D4] shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-base text-[#111111]">
                Supprimer le domaine {deleteTarget.domain} ?
              </h3>
              <p className="text-xs text-[#666660] leading-relaxed">
                Le domaine sera détaché de votre boutique. Les clients qui tenteront d'y accéder verront une page 404 neutre jusqu'à ce que vous modifiiez vos DNS chez votre registrar.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-[#E6E0D4] text-xs font-bold text-[#666660] hover:bg-black/5 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
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
