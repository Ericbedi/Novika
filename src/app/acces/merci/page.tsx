import React from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function MerciPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111111] flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-[480px] w-full mx-auto my-auto text-center">
        <div className="flex justify-center mb-6">
          <Logo variant="full" tone="light" size={32} />
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.08] shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <h1 className="text-2xl font-black text-[#0B1521] tracking-tight mb-2">
            Demande bien reçue !
          </h1>
          <p className="text-sm text-[#666660] mb-6 leading-relaxed">
            Merci pour votre intérêt. Nous examinons votre profil et nous vous contacterons sur WhatsApp dès qu'une place se libère dans la prochaine cohorte.
          </p>

          <Link
            href="/"
            className="w-full h-11 rounded-xl font-bold bg-[#111111] text-white hover:bg-black transition-colors flex items-center justify-center gap-2"
          >
            <span>Retour à l'accueil</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
