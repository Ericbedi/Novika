import React from "react";
import { InvitationClient } from "./invitation-client";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitationPage({ params }: PageProps) {
  const { token } = await params;
  return <InvitationClient token={token} />;
}
