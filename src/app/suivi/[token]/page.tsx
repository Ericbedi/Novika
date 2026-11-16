import React from "react";
import { Metadata } from "next";
import { getTrackingOrderByToken } from "@/server/data/tracking-store";
import { TrackingClient } from "./tracking-client";

export const metadata: Metadata = {
  title: "Suivi de commande en direct",
  description: "Suivez en temps réel l'acheminement de votre colis étape par étape.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PublicTrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const initialOrder = getTrackingOrderByToken(token);

  return <TrackingClient token={token} initialOrder={initialOrder} />;
}
