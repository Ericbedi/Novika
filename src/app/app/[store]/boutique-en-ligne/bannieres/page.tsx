import React from "react";
import { BannersClient } from "./banners-client";

export default async function BannersPage(props: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await props.params;
  return <BannersClient storeSlug={store} />;
}
