# Boucle 002 — La nuit à Brumepont

**Statut :** `garder`

## Contrat

- **Nouveauté centrale :** faire de l'or une ressource diégétique qui ouvre des possibilités différentes dans un lieu vivant.
- **Décision ou sensation :** choisir entre payer une route sûre, acheter une sécurité consommable, assumer une dépense d'ambiance ou garder son or au prix d'un trajet dangereux.
- **Point de départ :** après La Route des Ronces, le Sorcier est niveau 2, possède 12 or et sait que les captifs ont été conduits aux vieilles carrières.
- **Dans la boucle :** nouveau chapitre au relais de Brumepont, guide à 6 or, potion à 8 or, repas à 2 or sans bonus caché, conservation de l'or, transactions atomiques, inventaire minimal, potion de 5 PV coûtant une Action, route alternative, Guetteur des Carrières, récompense unique de 4 or, persistance et interface responsive.
- **Hors boucle :** armure, casino, hasard, catalogue de boutique, revente, équipement, nouvelle statistique et nouvelle carte.

## Parcours joueur

Terminer La Route des Ronces → attribuer le point de niveau 2 → entrer au relais → habiter brièvement le lieu → choisir une dépense ou conserver l'or. Payer le guide mène directement au passage oublié. Les trois autres choix empruntent la route surveillée et rencontrent le Guetteur ; la potion peut y être consommée lorsqu'il manque des PV. Une victoire mène aux carrières et attribue 4 or une seule fois ; une défaite permet de reprendre l'acte.

## Budget de preuve

- **Automatique ciblée :** tests d'économie, de migration, de branchement, de potion et de persistance.
- **Acceptation :** `npm run check`, `npm run verify:story`, `npm run simulate:combat`, puis `npm test` une seule fois après convergence.
- **Application réelle :** jouer les routes guide et potion dans Electron en 1200 × 820, puis vérifier la taverne et le combat en 760 × 900.

## Résultat

- **Intégré :** chapitre relié automatiquement à la victoire de La Route des Ronces ; quatre usages de l'or ; transactions persistantes ; inventaire ; potion de soin en combat ; récompense unique ; interface desktop et étroite ; deux décors dédiés.
- **Équilibrage :** le Guetteur est passé de 22 à 20 PV après que la simulation a révélé qu'un Sorcier ayant placé son point en Agilité ne pouvait pas gagner sans potion. À 20 PV, des routes gagnantes et perdantes subsistent sans achat ; l'exploration avec potion contient des victoires où elle est bue et d'autres où elle est conservée.
- **Preuves :** arbre accepté sans avertissement ; tests ciblés d'économie, d'atomicité, de persistance, d'objet et de récompense ; suite complète ; parcours Electron de niveau 1 à Brumepont ; captures 1200 × 820 et 760 × 900.
- **Enseignement scénaristique :** les dépenses et la route choisie sont visibles dans ce chapitre, mais les parcours reconvergent trop vite vers les carrières. Les prochaines boucles qui offrent une occasion narrative doivent reprendre les états antérieurs, laisser vivre leurs conséquences dans des scènes distinctes et éviter de réduire la branche à une variation de texte.
- **Reste incertain :** la valeur exacte des prix pourra encore être rééquilibrée si elle limite les futures possibilités, sans remettre en cause la boucle.
- **Verdict :** `garder` — boucle validée par le joueur le 24 juillet 2026 ; conserver l'économie diégétique et traiter sa linéarité comme une contrainte explicite pour la suite.
