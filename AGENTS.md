# Fantasy Story

## Direction permanente

- Partir du livre, du moteur, de l'état sauvegardé et de l'interface réellement présents avant de proposer une extension.
- Faire porter chaque boucle d'expérience sur une seule nouveauté centrale ; intégrer les autres disciplines sans ajouter de systèmes adjacents.
- Numéroter seulement les expériences soumises au verdict du joueur. Les corrections techniques restent des passes internes à la boucle active.
- Garder Dungeons & Dragons comme inspiration mécanique et Baldur's Gate comme inspiration pour les lieux, les rencontres, les objets et les possibilités offertes par le monde.
- Traiter l'or comme une ressource diégétique : potion, armure, jeu d'argent, information, service ou accès à une branche selon le lieu. Ne pas en faire par défaut une monnaie d'amélioration de cartes.
- Exécuter localement les mutations déterministes avant tout texte produit par le modèle.
- Préserver les changements locaux hors périmètre et ne jamais restaurer silencieusement l'ancien prototype.

## Visuels

- Utiliser des ressources open source de qualité pour icônes, boutons et éléments génériques, avec source et licence conservées.
- Utiliser `imagegen` seulement pour décors, portraits et illustrations raster propres à l'univers.
- Construire en code la disposition, les interactions, les effets, les animations et le responsive.

## Skills et portée

- Utiliser `conduire-boucle-fantasy-story` pour une tranche verticale multidisciplinaire.
- Utiliser `relier-aventure-fantasy-story` pour auditer ou corriger les coutures d’une aventure existante ; ne pas charger `conduire-boucle-fantasy-story` en parallèle par défaut.
- Charger uniquement les skills spécialisés nécessaires au contrat de la boucle.
- Ne pas utiliser de sous-agents par défaut ; les réserver à une demande explicite ou à un audit réellement indépendant.

## Démarrage d'une boucle

- Exécuter `npm run context:loop` avant l'audit.
- En contexte `CHAUD`, lire `artifacts/context/current-project-map.md`, la fiche active et contrôler la PWA ou une capture récente.
- En contexte `CHAUD CIBLÉ`, inspecter uniquement les domaines et fichiers signalés, sauf incohérence ou portée ambiguë.
- En contexte `FROID`, effectuer l'audit complet du livre, du moteur, de la sauvegarde et de l'interface.
- Actualiser la référence avec `npm run context:loop:refresh` après une intégration validée ou un verdict.

## Boucles automatiques

- Classer toute demande ordinaire sans demander au joueur de nommer le processus :
  - correction déterministe ou finition dans le cap actif : passe technique non numérotée ;
  - nouvelle sensation, décision ou possibilité à éprouver : boucle d'expérience ;
  - arbitrage entre plusieurs axes du jeu : revue de direction.
- Conserver une seule boucle d'expérience active. Si elle est `à jouer` ou `ajuster`, rattacher le retour du joueur à cette fiche au lieu d'en créer une autre.
- Utiliser les statuts `cadrée`, `en construction`, `à jouer`, `ajuster`, `garder`, `retirer` ou `suspendue`.
- Limiter une boucle à deux passes de construction avant essai. Après deux verdicts `ajuster`, reformuler l'hypothèse ou retirer la proposition.
- Après trois boucles clôturées depuis la dernière revue, effectuer automatiquement une revue de direction courte avant de cadrer la suivante. Une demande explicite du joueur peut fournir directement la direction retenue.
- Ne jamais demander au joueur de produire un rapport : lui présenter le parcours à essayer puis recueillir simplement `garder`, `ajuster` ou `retirer`, avec son commentaire libre.

## Validation proportionnelle au risque

- Le parcours manuel du joueur est la preuve d'expérience principale.
- Pendant l'implémentation, vérifier seulement les fichiers modifiés et ajouter au plus un test ciblé lorsqu'une régression déterministe pourrait rester invisible au joueur.
- Ne pas créer de test automatisé par défaut. Conserver la suite complète comme filet exceptionnel, sans la lancer à chaque boucle.
- Pour un changement de skill ou de documentation, utiliser son validateur et `git diff --check` ; ne pas lancer l'application.
- Pour le livre ou son schéma, lancer `npm run verify:story` seulement si sa structure change.
- Pour le moteur, l'état ou la progression, lancer le contrôle ciblé le plus court. Réserver `npm test` aux migrations risquées, aux publications importantes ou à une demande explicite.
- Lancer `npm run simulate:combat` uniquement si les règles, cartes, adversaires ou statistiques de combat changent.
- Quand l’interface change, ouvrir la PWA et laisser le joueur parcourir lui-même la boucle sur une fenêtre bureau et une fenêtre étroite.
- Ne pas répéter une commande réussie si aucun fichier qu'elle couvre n'a changé depuis.
- Avant une publication PWA, exécuter `npm run build:pwa`, `git diff --check` et un smoke test de l'URL publique.
- Une boucle complète exige un verdict utilisateur `garder`, `ajuster` ou `retirer`.

## Publication normale

- Après une intégration validée et prête à être essayée, committer puis pousser directement sur `main` afin que la version testée sur téléphone corresponde au dernier état du projet.
- Ne pas ouvrir de branche intermédiaire ni de pull request par défaut.
- Préserver les changements locaux hors périmètre et vérifier le snapshot exact avant chaque push.
