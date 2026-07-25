---
name: conduire-boucle-fantasy-story
description: Cadrer, implémenter ou auditer une boucle verticale de Fantasy Story depuis l’existant jusqu’au verdict du joueur. Utiliser ce skill lorsqu’une demande parle de boucle, de passe ou combine plusieurs disciplines.
---

# Conduire une boucle Fantasy Story

Faire traverser une seule nouveauté centrale aux disciplines strictement nécessaires, puis laisser le joueur l’essayer avant de décider `garder`, `ajuster` ou `retirer`.

## Principes

- Partir du livre, du moteur, de la sauvegarde et de l’interface présents.
- Conserver D&D comme inspiration mécanique et Baldur’s Gate comme inspiration des lieux et possibilités.
- Traduire une mécanique D&D en décision propre au jeu de cartes, sans simplement renommer un effet existant.
- Montrer une conséquence pendant la boucle au lieu de promettre tout son intérêt pour plus tard.
- Exécuter les mutations déterministes avant tout texte produit par un modèle.
- Traiter l’or dans le monde : objet, service, information, jeu ou accès, pas amélioration abstraite de carte par défaut.
- Préserver tous les changements locaux hors périmètre.

## Reprendre le contexte sans le dilater

Exécuter `npm run context:loop`.

- `CHAUD` : lire uniquement `artifacts/context/current-project-map.md`, la fiche active et les fichiers utiles.
- `CHAUD CIBLÉ` : inspecter seulement les domaines signalés.
- `FROID` : auditer le livre, le moteur, l’état et l’interface.

Ne pas relire les anciennes boucles, les tests complets ou les fichiers inchangés sauf contradiction visible ou migration ambiguë.

## Cadrer

Lire [references/fiche-de-boucle.md](references/fiche-de-boucle.md), puis créer une fiche courte dans `artifacts/loops/`.

Le contrat fixe :

- la nouveauté centrale et l’effet recherché ;
- le strict nécessaire et le hors-périmètre ;
- le parcours que le joueur essaiera ;
- ce qui resterait invisible sans une preuve automatique ;
- le critère du verdict.

La fiche sert de reprise de contexte. Elle ne contient ni routage de modèles, ni liste de fichiers, ni journal de commandes.

## Mobiliser seulement les spécialistes utiles

- `concevoir-branches-fantasy-story` : structure et conséquences.
- `ecrire-dialogues-fantasy-story` : textes définitifs après stabilisation.
- `concevoir-equilibrer-cartes-fantasy-story` : cartes, états et combats.
- `concevoir-progression-fantasy-story` : niveaux, récompenses et économie.
- `concevoir-visuels-fantasy-story` : interface et ressources.
- `imagegen` : uniquement décors, portraits et illustrations propres à l’univers.

Ne pas charger un spécialiste pour une discipline hors contrat.

## Exécuter

1. Auditer seulement le domaine concerné.
2. Implémenter d’abord règle, état, refus et persistance.
3. Relier ensuite contenu et interface.
4. Produire les textes et visuels nécessaires, sans système adjacent.
5. Ouvrir l’application ou la PWA pour le joueur.
6. Recueillir son verdict.
7. Exécuter `npm run context:loop:refresh` après intégration validée ou verdict.

## Budget Codex et preuves

Le parcours manuel du joueur est la preuve d’expérience principale.

- Ne pas créer de test automatisé par défaut.
- Pendant le travail, utiliser au plus un test ciblé si une mutation déterministe risquée serait difficile à voir manuellement.
- Vérifier seulement les fichiers modifiés quand un contrôle syntaxique suffit.
- Réserver `npm test` aux migrations risquées, publications importantes ou demandes explicites.
- Lancer `npm run verify:story` seulement si le livre ou son schéma change.
- Lancer `npm run simulate:combat` seulement si règles, cartes, adversaires ou statistiques changent.
- Ne lancer `npm run qa:visual` ou `npm run qa:pwa` que sur demande ; sinon laisser le joueur tester le parcours réel.
- Ne jamais répéter une commande réussie sans changement dans son périmètre.
- Pour une publication PWA, limiter la preuve à `npm run build:pwa`, `git diff --check` et un smoke test de l’URL publique, sauf risque particulier.

## Visuels

- Utiliser des ressources open source avec source et licence pour les éléments génériques.
- Réserver `imagegen` aux illustrations raster propres à l’univers.
- Construire disposition, interactions, responsive et animations en code.

## Rendu

Répondre brièvement avec ce qui est jouable, ce que le joueur doit essayer, l’incertitude restante et le verdict attendu.
