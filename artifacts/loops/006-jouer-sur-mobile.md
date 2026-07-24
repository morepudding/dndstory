# Boucle 006 — Jouer sur mobile

**Statut :** `à jouer`

## Contrat

- **Nouveauté centrale :** rendre le livre-jeu installable et jouable comme PWA sur téléphone en réutilisant le livre, les moteurs et l’interface d’Electron.
- **Décision ou sensation :** retrouver sur mobile la même aventure et les mêmes décisions, avec des actions tactiles lisibles et une reprise locale fiable.
- **Point de départ :** l’application Electron partage déjà une interface HTML/CSS et possède une vue étroite à 760 px, mais son runtime dépend du pont IPC et sa sauvegarde du système de fichiers.
- **Conséquence visible :** à 390 × 844, le joueur démarre une route, choisit une branche, joue un tour de combat, ferme la PWA puis retrouve le même état.
- **Branches héritées ou ouvertes :** toutes les branches, combats, coûts, récompenses et conséquences existants restent identiques ; aucune branche n’est ajoutée.
- **Dans la boucle :** catalogue de récits partagé, runtime navigateur, sauvegarde IndexedDB, build et manifeste PWA, cache hors ligne, ergonomie tactile, hauteurs dynamiques, safe areas et QA 390 × 844.
- **Hors boucle :** synchronisation entre PC et téléphone, compte distant, serveur public, chat Codex sur mobile, atelier narratif mobile, notifications, nouvelle mécanique, nouveau contenu et publication sur les stores.

## Parcours joueur

Installer ou ouvrir la PWA → démarrer La Route des Ronces → choisir l’ancrage puis la route de combat → jouer une carte → recharger complètement la page → constater que le nœud, le round, la main et les PV sont conservés → terminer une interaction tactile sans débordement horizontal.

## Routage des tours

**Mode :** `manuel — un seul assistant, un seul fil, aucun sous-agent`

- **Audit et cadrage :** vérifier la séparation actuelle entre moteurs, stockage, IPC et renderer.
- **Intégration :** partager le catalogue et les services de jeu, ajouter uniquement les adaptateurs PWA et le build.
- **Visuel :** compacter la hiérarchie existante pour 390 × 844 sans modifier les règles.
- **Preuve :** exécuter une preuve PWA ciblée, les validations larges nécessaires, la QA Electron et un parcours navigateur réel.
- **Prochaine étape :** intégrer le runtime PWA et sa sauvegarde, puis adapter le téléphone.

## Budget de preuve

- **Automatique ciblée :** build PWA, manifeste et service worker présents ; démarrage, choix, combat et reprise IndexedDB à état identique.
- **Acceptation :** `npm run check` et `npm test` une seule fois après convergence.
- **Application réelle :** `npm run qa:visual`, puis parcours navigateur en 390 × 844 et Electron en 1200 × 820.

## Résultat

- **Intégré :**
  - Electron et la PWA utilisent `StoryGameService`, `StoryCatalog`, les mêmes chapitres, les mêmes moteurs et la même interface ;
  - l’adaptateur PWA hydrate et persiste l’état canonique dans IndexedDB après chaque mutation ;
  - le manifeste, les icônes 180/192/512, le service worker et le build autonome rendent le jeu installable et jouable hors ligne ;
  - à 390 × 844, la hiérarchie reste stable, les cibles tactiles mesurent au moins 44 px et la main de combat se parcourt horizontalement ;
  - un choix, l’entrée en combat et une carte jouée survivent à un rechargement complet puis à un redémarrage sans serveur.
- **Preuves :** `npm run check`, 64 tests, `npm run qa:visual` et `npm run qa:pwa` réussissent ; captures `pwa-route-390x844.png` et `pwa-combat-390x844.png`.
- **Reste incertain :** confort tactile sur le téléphone physique du joueur et choix d’un hébergement HTTPS privé.
- **Verdict :** à jouer.
