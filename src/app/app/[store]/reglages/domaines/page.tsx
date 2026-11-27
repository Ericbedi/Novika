import React from "react";
import { EmailProGuide } from "@/components/settings/email-pro-guide";
import { DomainsManager } from "@/components/settings/domains-manager";

export default async function StoreDomainsPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
      <DomainsManager storeSlug={store} role="owner" />
      <EmailProGuide storeSlug={store} />
    </div>
  );
}
