# Boucle 004 — Prendre l’ascendant

**Statut :** `à jouer`

## Contrat

- **Nouveauté centrale :** adapter Avantage et Désavantage de D&D à l’économie d’Actions du jeu de cartes : la prochaine carte Action coûte respectivement 0 ou 2 Actions.
- **Décision ou sensation :** hésiter entre se défendre maintenant, ralentir Varek ou accepter des dégâts pour préparer un tour plus explosif.
- **Point de départ :** le combat existant contre Varek, avec deux Actions par round, deux charges, `Voile d’azur`, `Entrave de givre` et une interface encore organisée comme un panneau.
- **Conséquence visible :** Avantage et Désavantage s’appliquent, s’annulent ou se consomment devant le joueur ; le coût 0, 1 ou 2 de la prochaine Action est visible avant de jouer.
- **Dans la boucle :** `Élan arcanique`, `Coup de hampe`, un état de tempo non cumulable et persistant, le coût dynamique des Actions, le remplacement d’un doublon dans chaque deck et la transformation du combat en plateau de jeu.
- **Hors boucle :** nouvelle histoire, nouvel ennemi, niveau, d20, équipement, deckbuilding, nouvelle ressource, modification d’Entrave de givre et propagation de la paire à d’autres rencontres.

## Parcours joueur

Poursuivre Varek → voir `Coup de hampe` annoncé → comparer `Voile d’azur`, `Entrave de givre`, `Élan arcanique` et l’absence de réaction → observer l’annulation ou le Désavantage → jouer une Action à coût 0, 1 ou 2 → terminer le combat sur le nouveau plateau en bureau puis en fenêtre étroite.

## Routage des tours

**Mode :** `manuel`

- **Mécanique :** intégrer et équilibrer la paire sans modifier le récit.
- **Visuel :** représenter le tempo, les Actions, les intentions et les piles sur un plateau construit en code.
- **Preuve :** exécuter une seule passe des validations après convergence, puis jouer le parcours Electron.
- **Prochaine étape :** jouer le parcours Varek dans l’application et rendre le verdict.

## Budget de preuve

- **Automatique ciblée :** cycle application, annulation, coût dynamique, consommation, refus sans mutation et reprise sauvegardée.
- **Acceptation :** `npm run check`, `npm run verify:story`, `npm run simulate:combat` et `npm test` une seule fois après convergence.
- **Application réelle :** `npm run qa:visual`, puis parcours Varek en 1200 × 820 et 760 × 900.

## Résultat

- **Intégré :**
  - `Élan arcanique` applique Avantage et `Coup de hampe` applique Désavantage ;
  - les deux états persistent, ne se cumulent pas, s’annulent entre eux et sont consommés uniquement par la prochaine carte Action ;
  - le moteur calcule et refuse réellement les coûts de 0, 1 ou 2 Actions avant toute mutation ;
  - une sauvegarde v12 reçoit les nouveaux états sans perdre le combat actif ;
  - un exemplaire de chaque nouvelle carte remplace un doublon, sans agrandir les pioches ;
  - Varek passe de 20 à 15 PV : la simulation exhaustive trouve 72 victoires, dont 12 avec Élan et 60 sans Élan ;
  - le panneau de combat est remplacé par un plateau construit en code : piles, pions, pistes de PV, intention ennemie, piste d’Actions, médaillon Tempo et coûts sur les cartes ;
  - la modification locale préexistante `Orbe suspendu` / Concentration est préservée et affichée séparément du Tempo.
- **Preuves :**
  - `npm run check`, `npm run verify:story`, `npm run simulate:combat` et `npm test` réussissent ;
  - 63 tests passent, dont le cycle complet Avantage/Désavantage et la migration v12 ;
  - `npm run qa:visual` réussit dans Electron en 1200 × 820 et 760 × 900 ;
  - captures : `artifacts/qa/cage-poursuite-1200x820.png`, `artifacts/qa/cage-varek-avantage-1200x820.png` et `artifacts/qa/cage-varek-avantage-consomme-1200x820.png`.
- **Reste incertain :** la sensation réelle du sacrifice défensif d’`Élan arcanique` et la densité verticale du plateau sur petit écran.
- **Verdict :** à jouer.
