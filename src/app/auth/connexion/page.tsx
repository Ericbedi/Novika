import { permanentRedirect } from "next/navigation";
import { ROUTES } from "@/config/routes";

export default function AuthConnexionRedirect() {
  permanentRedirect(ROUTES.login);
}
