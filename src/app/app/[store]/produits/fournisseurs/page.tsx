import { SuppliersClient } from "./suppliers-client";

interface SuppliersPageProps {
  params: Promise<{
    store: string;
  }>;
}

export default async function SuppliersPage({ params }: SuppliersPageProps) {
  const { store } = await params;
  return <SuppliersClient storeSlug={store} />;
}
