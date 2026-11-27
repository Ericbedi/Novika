/** Trame de fiche produit COD en 13 blocs. Les crochets sont à remplacer : rien n'est inventé (ni preuves, ni avis, ni prix barrés). */
export const PRODUCT_SHEET_BLOCKS = [
  ["Titre", "[Nom du produit] – [bénéfice principal en une phrase]"],
  ["4 points clés", "<ul><li>[Point 1]</li><li>[Point 2]</li><li>[Point 3]</li><li>[Point 4]</li></ul>"],
  ["Headline émotionnelle", "[Une phrase qui parle au désir ou à la gêne du client]"],
  ["Problème → solution", "[Le problème vécu au quotidien]. [Comment le produit le règle.]"],
  ["Scène de vie", "[Une petite scène concrète : lieu, moment, avant/après.]"],
  ["4 bénéfices", "<ul><li><strong>[Bénéfice 1]</strong> – [explication]</li><li><strong>[Bénéfice 2]</strong> – [explication]</li><li><strong>[Bénéfice 3]</strong> – [explication]</li><li><strong>[Bénéfice 4]</strong> – [explication]</li></ul>"],
  ["Comparatif", "<table><tbody><tr><th></th><th>Ce produit</th><th>Les autres</th></tr><tr><td>[Critère 1]</td><td>[✓]</td><td>[✗]</td></tr><tr><td>[Critère 2]</td><td>[✓]</td><td>[✗]</td></tr><tr><td>[Critère 3]</td><td>[✓]</td><td>[✗]</td></tr></tbody></table>"],
  ["Transition", "[Phrase qui amène vers la preuve et l'offre.]"],
  ["Preuve", "[Résultats, chiffres ou avis RÉELS uniquement. Supprimez ce bloc si vous n'en avez pas.]"],
  ["Cas d'usage", "<ul><li>[Pour qui / quand 1]</li><li>[Pour qui / quand 2]</li><li>[Pour qui / quand 3]</li></ul>"],
  ["Closing", "[Appel à commander maintenant.]"],
  ["Réassurance", "<ul><li>Paiement à la livraison</li><li>[Délai de livraison]</li><li>[Garantie / retour, si vrai]</li></ul>"],
  ["FAQ", "<p><strong>[Question 1] ?</strong><br>[Réponse]</p><p><strong>[Question 2] ?</strong><br>[Réponse]</p><p><strong>[Question 3] ?</strong><br>[Réponse]</p>"],
] as const;

export function productSheetTemplateHtml(): string {
  return PRODUCT_SHEET_BLOCKS.map(([title, body]) => {
    const inner = body.startsWith("<") ? body : `<p>${body}</p>`;
    return `<h3>${title}</h3>${inner}`;
  }).join("");
}
