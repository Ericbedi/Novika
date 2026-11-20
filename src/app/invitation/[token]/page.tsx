import { redirect } from "next/navigation";

export default async function InvitationTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/rejoindre?token=${encodeURIComponent(token)}`);
}
