# Fantasy Story

## Direction permanente

- Partir du livre, du moteur, de l'état sauvegardé et de l'interface réellement présents avant de proposer une extension.
- Faire porter chaque boucle sur une seule nouveauté centrale ; intégrer les autres disciplines sans ajouter de systèmes adjacents.
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
- Charger uniquement les skills spécialisés nécessaires au contrat de la boucle.
- Ne pas utiliser de sous-agents par défaut ; les réserver à une demande explicite ou à un audit réellement indépendant.

## Démarrage d'une boucle

- Exécuter `npm run context:loop` avant l'audit.
- En contexte `CHAUD`, lire `artifacts/context/current-project-map.md`, la fiche active et contrôler l'application ou une capture récente.
- En contexte `CHAUD CIBLÉ`, inspecter uniquement les domaines et fichiers signalés, sauf incohérence ou portée ambiguë.
- En contexte `FROID`, effectuer l'audit complet du livre, du moteur, de la sauvegarde et de l'interface.
- Actualiser la référence avec `npm run context:loop:refresh` après une intégration validée ou un verdict.

## Validation proportionnelle au risque

- Pendant l'implémentation, lancer le test ciblé le plus petit qui couvre le contrat modifié.
- Pour un changement de skill ou de documentation, utiliser son validateur et `git diff --check` ; ne pas lancer l'application.
- Pour le livre ou son schéma, lancer `npm run verify:story` et les tests narratifs concernés.
- Pour le moteur, l'état ou la progression, lancer `npm run check` et les tests ciblés ; lancer `npm test` une seule fois avant livraison.
- Lancer `npm run simulate:combat` uniquement si les règles, cartes, adversaires ou statistiques de combat changent.
- Lancer `npm run qa:visual` uniquement si l'interface, les ressources ou un comportement affiché changent.
- Ne pas répéter une commande réussie si aucun fichier qu'elle couvre n'a changé depuis.
- Une boucle complète exige toujours un parcours réel dans Electron et un verdict utilisateur `garder`, `ajuster` ou `retirer`.
