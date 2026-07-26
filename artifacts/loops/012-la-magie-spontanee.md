# Boucle 012 — La magie spontanée

**Statut :** `à valider par le joueur`

## Cap

- **Nouveauté centrale :** une fois par combat, le Sorcier façonne une carte de sa main en un autre sort connu compatible avec la phase.
- **Effet recherché :** choisir entre improviser une attaque maintenant et conserver cette souplesse pour produire la bonne Réaction sous la menace.
- **Dans la boucle :** utilisation unique, coûts normaux du sort choisi, défausse de la carte façonnée, sauvegarde, journal et rune visible.
- **Hors boucle :** nouvelle carte, points de sorcellerie, deckbuilding, récompense, ennemi ou refonte générale du plateau.

## À tester par le joueur

Contre Varek, façonner une carte en Éclat arcanique ou Orbe suspendu pendant la phase d’Action. Rejouer en gardant la rune jusqu’à une attaque, puis improviser Voile d’azur, Entrave de givre ou Élan arcanique. Terminer enfin le combat sans utiliser la capacité.

## Budget Codex

- **Contexte :** moteur, état, flux d’actions et présentation du combat seulement.
- **Automatique :** un contrôle ciblé du cycle, simulation des chemins et construction PWA.
- **Manuel :** parcours bureau et étroit dans la PWA.
- **Suite complète :** seulement si la migration de sauvegarde révèle une incompatibilité.

## État

- **Intégré :** moteur, migration de sauvegarde, flux d’action, journal, simulation et rune du plateau.
- **Vérifié :** Bâton de voyage façonné en Éclat arcanique dans la PWA ; coût, dégâts, défausse et verrouillage résolus puis persistés.
- **Vérifié visuellement :** illustrations propres aux sept cartes, grands portraits enchâssés, cadres allié/ennemi différenciés et liaison animée carte → sort façonné → cible.
- **Responsive :** parcours contrôlé en 1200 × 820 et 390 × 844, sans image cassée ni débordement horizontal.
- **Équilibre simulé :** les quatre combats gardent des victoires avec et sans la capacité ; le meilleur tour et les PV restants sont identiques dans les deux cas.
- **Reste incertain :** sensation du choix entre improviser dès l’Action et conserver la rune pour une Réaction.
- **Verdict :** `garder` si plusieurs transformations restent désirables et lisibles avant confirmation.
