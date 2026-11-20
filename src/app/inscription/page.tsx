import { redirect } from "next/navigation";

export default function SignupPage() {
  redirect("/connexion?message=signup_closed");
}
