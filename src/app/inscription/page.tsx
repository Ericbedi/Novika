import { Metadata } from "next";
import { SignupClient } from "./signup-client";

export const metadata: Metadata = {
  title: "Créer mon compte vendeur | AfriBuilder",
  description: "Rejoignez la plateforme e-commerce tout-en-un pour vendre en paiement à la livraison en Afrique.",
};

export default function SignupPage() {
  return <SignupClient />;
}
