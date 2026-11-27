"use client";

import React, { useEffect, useState } from "react";
import { Check, Copy, RefreshCw, Send } from "lucide-react";

interface Rec { record: string; type: string; name: string; value: string; priority?: number; status?: string }
interface Sender { domain: string; address: string; status: "pending" | "verified" | "failed"; records: Rec[] }

export function SendFromDomain({ storeSlug, domains }: { storeSlug: string; domains: string[] }) {
  const [sender, setSender] = useState<Sender | null>(null);
  const [configured, setConfigured] = useState(true);
  const [domain, setDomain] = useState(domains[0] || "");
  const [local, setLocal] = useState("contact");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/domains/email-sender?storeSlug=${encodeURIComponent(storeSlug)}`)
      .then((r) => r.json())
      .then((d) => { if (d?.success) { setSender(d.sender); setConfigured(!!d.configured); } })
      .catch(() => {});
  }, [storeSlug]);

  async function call(action: "setup" | "verify" | "remove") {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/domains/email-sender", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storeSlug, action, domain, localPart: local }) });
      const d = await r.json();
      if (!d?.success) throw new Error(d?.error || "Action impossible.");
      setSender(d.sender);
      if (action === "verify") setMsg(d.sender?.status === "verified" ? "Domaine vérifié ✓ Vos e-mails partent maintenant de votre adresse." : "Pas encore détecté : la propagation DNS peut prendre jusqu'à 24 h.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Action impossible.");
    } finally {
      setBusy(false);
    }
  }

  const copy = (k: string, t: string) => { try { navigator.clipboard?.writeText(t); setCopied(k); setTimeout(() => setCopied(null), 1800); } catch { /* ignore */ } };
  const cell = "px-3 py-2 text-xs font-mono align-top break-all";
  const input = "w-full min-h-[44px] px-3 rounded-xl border border-black/[0.12] bg-white text-base sm:text-sm";

  return (
    <div className="border-t border-black/[0.08] pt-6 space-y-4">
      <div className="flex items-start gap-3">
        <span className="h-10 w-10 rounded-xl bg-[#EEF5EE] grid place-items-center shrink-0"><Send className="h-5 w-5 text-[#2B4A2C]" /></span>
        <div>
          <h3 className="text-base font-black text-[#111111]">Envoyer les e-mails de la boutique depuis votre domaine</h3>
          <p className="text-xs text-[#666660]">Les confirmations de commande envoyées à vos clients partent de contact@votre-domaine.com. Les clients peuvent répondre à cette adresse (Zoho).</p>
        </div>
      </div>

      {!configured && <p className="text-xs rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 p-3">L'envoi d'e-mails n'est pas encore activé sur la plateforme. Kelio doit d'abord configurer son service d'envoi (clé Resend).</p>}

      {!sender ? (
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <label className="space-y-1"><span className="text-[10px] font-black uppercase tracking-wider text-[#666660]">Domaine</span>
            <select className={input} value={domain} onChange={(e) => setDomain(e.target.value)}>{domains.filter((d) => !d.startsWith("www.")).map((d) => <option key={d}>{d}</option>)}</select></label>
          <label className="space-y-1"><span className="text-[10px] font-black uppercase tracking-wider text-[#666660]">Adresse d'envoi</span>
            <div className="flex items-center gap-1"><input className={input} value={local} onChange={(e) => setLocal(e.target.value)} /><span className="text-xs text-[#666660] whitespace-nowrap">@{domain}</span></div></label>
          <button type="button" disabled={busy || !configured} onClick={() => call("setup")} className="min-h-[44px] px-4 rounded-xl bg-[#2B4A2C] text-white text-xs font-bold disabled:opacity-50 cursor-pointer">{busy ? "…" : "Activer l'envoi"}</button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm"><b>{sender.address}</b> — {sender.status === "verified" ? <span className="text-emerald-700 font-bold">✅ Vérifié, actif</span> : sender.status === "failed" ? <span className="text-rose-600 font-bold">Échec de vérification</span> : <span className="text-amber-700 font-bold">⏳ En attente des enregistrements DNS</span>}</p>
          {sender.status !== "verified" && sender.records.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-black/[0.08]">
              <p className="px-3 py-2 text-[11px] text-[#666660] bg-[#FAF8F5]">Ajoutez ces enregistrements chez votre registrar, puis cliquez « Vérifier ».</p>
              <table className="w-full min-w-[520px]">
                <thead><tr className="text-left text-[10px] font-black uppercase tracking-wider text-[#888880]"><th className="px-3 py-2">Type</th><th className="px-3 py-2">Nom</th><th className="px-3 py-2">Valeur</th><th className="px-3 py-2">Priorité</th><th /></tr></thead>
                <tbody>{sender.records.map((r, i) => (
                  <tr key={i} className="border-t border-black/[0.05]"><td className={cell}>{r.type}</td><td className={cell}>{r.name}</td><td className={cell}>{r.value}</td><td className={cell}>{r.priority ?? "—"}</td>
                    <td className="px-2"><button type="button" aria-label="Copier" onClick={() => copy(`r${i}`, r.value)} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-black/[0.05] cursor-pointer">{copied === `r${i}` ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}</button></td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {sender.status !== "verified" && <button type="button" disabled={busy} onClick={() => call("verify")} className="min-h-[44px] px-4 rounded-xl bg-[#2B4A2C] text-white text-xs font-bold inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer"><RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Vérifier</button>}
            <button type="button" disabled={busy} onClick={() => call("remove")} className="min-h-[44px] px-4 rounded-xl border border-black/[0.12] text-xs font-bold cursor-pointer">Retirer</button>
          </div>
        </div>
      )}
      {msg && <p className="text-xs font-bold text-[#333330]">{msg}</p>}
    </div>
  );
}
