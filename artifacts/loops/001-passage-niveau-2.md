# Boucle 001 — Passage au niveau 2

**Statut :** `garder`

## Contrat

- **Nouveauté centrale :** transformer la première victoire en progression durable vers le niveau 2.
- **Décision ou sensation :** célébrer la victoire puis choisir une statistique qui modifiera réellement les capacités du Sorcier.
- **Point de départ :** Sorcier niveau 1, 0 or, sans point disponible, avec FOR 1, CON 2, AGI 2, SAG 3 et INT 2.
- **Dans la boucle :** nouvelles scènes de La Route des Ronces, victoire, niveau 2, 1 point de statistique, 12 or, récompense unique, persistance et écran de progression responsive.
- **Hors boucle :** boutique, achat, équipement, nouvelle mécanique narrative, nouvel ennemi et nouveau système de cartes. L'or est seulement conservé pour une future boucle.

## Parcours joueur

Commencer La Route des Ronces → examiner le talus → gagner contre le Pillard des Ronces → voir les récompenses → comparer les cinq statistiques → choisir une statistique non maximale → confirmer → reprendre l'aventure. Rejouer la victoire ne doit pas attribuer une seconde récompense et relancer l'application ne doit pas perdre le choix.

## Budget de preuve

- **Automatique ciblée :** `node --test test/progression.test.js test/story-runtime.test.js`
- **Acceptation :** `npm run check`, puis `npm test` une seule fois après convergence.
- **Application réelle :** jouer le parcours dans Electron en 1200 × 820 puis vérifier l'écran étroit en 760 × 900.
- **Preuves visuelles présentes :** `artifacts/qa/story-level-up-1200x820.png`, `story-level-up-selected-1200x820.png`, `story-level-up-confirmed-1200x820.png` et `story-level-up-narrow-760x900.png`.

## Résultat

- **Intégré :** la première victoire attribue une seule fois le niveau 2, 1 point et 12 or ; un choix maximal est refusé ; le choix est sauvegardé et influence le combat suivant.
- **Reste incertain :** l'or reste volontairement sans usage immédiat ; sa valeur devra être éprouvée dans une boucle d'achat dédiée.
- **Verdict :** `garder` — parcours joué et validé par le joueur le 23 juillet 2026.
