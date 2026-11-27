"use client";

import React, { useEffect, useState } from "react";
import { Check, Copy, Mail, RefreshCw } from "lucide-react";
import { SendFromDomain } from "./send-from-domain";
import { zohoRecords, type EmailCheckResult, type ZohoRegion } from "@/lib/email-pro";

interface DomainRow { id: string; domain: string; isPrimary: boolean }

export function EmailProGuide({ storeSlug }: { storeSlug: string }) {
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [domain, setDomain] = useState("");
  const [region, setRegion] = useState<ZohoRegion>("com");
  const [result, setResult] = useState<EmailCheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/domains?storeSlug=${encodeURIComponent(storeSlug)}`)
      .then((r) => r.json())
      .then((d) => {
        const list: DomainRow[] = (d?.domains || []).filter((x: DomainRow) => !x.domain.startsWith("www."));
        setDomains(list);
        setDomain(list.find((x) => x.isPrimary)?.domain || list[0]?.domain || "");
      })
      .catch(() => {});
  }, [storeSlug]);

  const copy = (key: string, text: string) => {
    try { navigator.clipboard?.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 1800); } catch { /* ignore */ }
  };

  async function check() {
    setChecking(true); setErr(null);
    try {
      const r = await fetch("/api/domains/email-check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storeSlug, domain, region }) });
      const d = await r.json();
      if (!d?.success) throw new Error(d?.error || "Vérification impossible.");
      setResult(d.result);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Vérification impossible.");
    } finally {
      setChecking(false);
    }
  }

  const rows = zohoRecords(region);
  const status = (ok: boolean | undefined) => (result ? (ok ? "✓ Détecté" : "En attente") : "");
  const cell = "px-3 py-2 text-xs font-mono align-top break-all";

  return (
    <section className="mt-10 rounded-3xl border border-black/[0.08] bg-white p-5 sm:p-7 space-y-6">
      <div className="flex items-start gap-3">
        <span className="h-10 w-10 rounded-xl bg-[#EEF5EE] grid place-items-center shrink-0"><Mail className="h-5 w-5 text-[#2B4A2C]" /></span>
        <div>
          <h2 className="text-lg font-black text-[#111111]">E-mail professionnel (Zoho Mail)</h2>
          <p className="text-xs text-[#666660]">Créez des adresses comme contact@votre-domaine.com, gratuitement pour 1 domaine.</p>
        </div>
      </div>

      {domains.length === 0 ? (
        <p className="text-xs text-[#666660] rounded-2xl bg-[#FAF8F5] p-4">Ajoutez d'abord un nom de domaine ci-dessus, puis revenez ici pour l'e-mail.</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#666660]">Domaine</span>
              <select value={domain} onChange={(e) => { setDomain(e.target.value); setResult(null); }} className="w-full min-h-[44px] px-3 rounded-xl border border-black/[0.12] bg-white text-base sm:text-sm">
                {domains.map((d) => <option key={d.id} value={d.domain}>{d.domain}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#666660]">Région de votre compte Zoho</span>
              <select value={region} onChange={(e) => { setRegion(e.target.value as ZohoRegion); setResult(null); }} className="w-full min-h-[44px] px-3 rounded-xl border border-black/[0.12] bg-white text-base sm:text-sm">
                <option value="com">Mondial (zoho.com)</option>
                <option value="eu">Europe (zoho.eu)</option>
              </select>
            </label>
          </div>

          <ol className="space-y-4 text-sm text-[#333330]">
            <li><strong>1. Créez le compte.</strong> Sur <a className="underline font-bold" href="https://www.zoho.com/mail/zohomail-pricing.html" target="_blank" rel="noopener noreferrer">zoho.com/mail</a>, choisissez le forfait gratuit « Forever Free » et ajoutez votre domaine <b>{domain}</b>.</li>
            <li><strong>2. Prouvez que le domaine est à vous.</strong> Zoho vous donne un enregistrement TXT de vérification (commence par <code className="text-xs">zoho-verification=</code>) : ajoutez-le chez votre registrar, puis cliquez « Vérifier » chez Zoho.</li>
            <li>
              <strong>3. Ajoutez ces enregistrements chez votre registrar</strong> (là où vous avez acheté le domaine) :
              <div className="mt-2 overflow-x-auto rounded-2xl border border-black/[0.08]">
                <table className="w-full min-w-[520px]">
                  <thead><tr className="text-left text-[10px] font-black uppercase tracking-wider text-[#888880] bg-[#FAF8F5]"><th className="px-3 py-2">Type</th><th className="px-3 py-2">Nom</th><th className="px-3 py-2">Valeur</th><th className="px-3 py-2">Priorité</th><th className="px-3 py-2" /></tr></thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.key} className="border-t border-black/[0.05]">
                        <td className={cell}>{r.type}</td><td className={cell}>{r.name}</td><td className={cell}>{r.value}</td><td className={cell}>{r.priority ?? "—"}</td>
                        <td className="px-2 py-1"><button type="button" aria-label="Copier" onClick={() => copy(r.key, r.value)} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-black/[0.05] cursor-pointer">{copied === r.key ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[11px] text-[#888880]">Si le domaine a déjà des enregistrements MX, supprimez les anciens. Un seul enregistrement SPF par domaine : s'il en existe un, fusionnez-le.</p>
            </li>
            <li><strong>4. Activez la signature DKIM (anti-spam).</strong> Chez Zoho : Panneau admin → Domaines → DKIM, créez le sélecteur <code className="text-xs">zmail</code> et ajoutez l'enregistrement TXT qu'il vous donne.</li>
            <li><strong>5. Créez vos adresses</strong> (contact@, commandes@…) dans Zoho, puis installez l'application Zoho Mail sur votre téléphone.</li>
          </ol>

          <div className="rounded-2xl bg-[#FAF8F5] p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm font-bold">Vérifier la configuration</p>
              <button type="button" onClick={check} disabled={checking} className="min-h-[44px] px-4 rounded-xl bg-[#2B4A2C] text-white text-xs font-bold inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer">
                <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} /> {checking ? "Vérification…" : "Vérifier maintenant"}
              </button>
            </div>
            {err && <p className="text-xs font-bold text-rose-600">{err}</p>}
            {result && (
              <ul className="text-sm space-y-1">
                <li>{result.mx ? "✅" : "⏳"} Réception (MX) — {status(result.mx)}</li>
                <li>{result.spf ? "✅" : "⏳"} SPF — {status(result.spf)}</li>
                <li>{result.dkim ? "✅" : "⏳"} DKIM — {status(result.dkim)}</li>
                {!(result.mx && result.spf && result.dkim) && <li className="text-[11px] text-[#888880] pt-1">La propagation DNS peut prendre de quelques minutes à 24 h. Réessayez plus tard.</li>}
              </ul>
            )}
          </div>
        </>
      )}
      {domains.length > 0 && <SendFromDomain storeSlug={storeSlug} domains={domains.map((d) => d.domain)} />}
    </section>
  );
}
