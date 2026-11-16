import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata = { robots: { index: false, follow: false } };

/** Outils de développement : jamais servis en production. */
export default function DevLayout({ children }: LayoutProps<"/dev">) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <NextIntlClientProvider>
      <TooltipProvider>
        {children}
        <Toaster theme="light" position="top-center" />
      </TooltipProvider>
    </NextIntlClientProvider>
  );
}
