import { Metadata } from "next";
import { LoginClient } from "./login-client";

export const metadata: Metadata = {
  title: "Connexion | AfriBuilder",
  description: "Connectez-vous à votre espace vendeur AfriBuilder.",
};

export default function LoginPage() {
  return <LoginClient />;
}
