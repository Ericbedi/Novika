import React from "react";
import { SchedulesClient } from "./schedules-client";

interface PageProps {
  params: Promise<{ store: string }>;
}

export default async function SchedulesPage({ params }: PageProps) {
  const { store } = await params;
  return <SchedulesClient storeSlug={store} />;
}
