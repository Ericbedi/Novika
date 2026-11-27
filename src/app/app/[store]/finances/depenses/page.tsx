import { redirect } from "next/navigation";

// Les dépenses (dont la publicité) sont gérées sur l'écran Finances, branché sur la base.
export default async function Page({ params }: { params: Promise<{ store: string }> }) {
  const { store } = await params;
  redirect(`/app/${store}/finances`);
}
