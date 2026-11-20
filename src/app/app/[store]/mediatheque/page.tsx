import React from "react";
import { MediathequeClient } from "./mediatheque-client";

interface MediathequePageProps {
  params: Promise<{
    store: string;
  }>;
}

export default async function MediathequePage({ params }: MediathequePageProps) {
  const { store } = await params;
  return <MediathequeClient storeSlug={store} />;
}
