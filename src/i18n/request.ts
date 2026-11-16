import { getRequestConfig } from "next-intl/server";
import messages from "../../messages/fr.json";

/**
 * Une seule langue au lancement. On ne lit pas `requestLocale` :
 * aucune API d'exécution n'est touchée, les pages restent prérendues.
 * Pour ajouter une langue, renvoyer la locale de l'utilisateur ici.
 */
export default getRequestConfig(async () => ({
  locale: "fr",
  messages,
  timeZone: "Africa/Abidjan",
}));
