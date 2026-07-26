---
name: conduire-boucle-fantasy-story
description: Cadrer, implémenter ou auditer une boucle verticale de création Fantasy Story depuis l’existant jusqu’au verdict du joueur. Utiliser ce skill pour porter une seule nouveauté centrale à travers plusieurs disciplines. Pour harmoniser les transitions et conséquences d’une aventure déjà construite sans ajouter de contenu, utiliser relier-aventure-fantasy-story.
---

# Conduire les boucles Fantasy Story

Transformer une demande ordinaire du joueur en la boucle la plus légère utile, sans lui demander de nommer le processus. Faire traverser une seule nouveauté centrale aux disciplines strictement nécessaires, puis laisser le joueur l’essayer avant de décider `garder`, `ajuster` ou `retirer`.

## Principes

- Partir du livre, du moteur, de la sauvegarde et de l’interface présents.
- Conserver D&D comme inspiration mécanique et Baldur’s Gate comme inspiration des lieux et possibilités.
- Traduire une mécanique D&D en décision propre au jeu de cartes, sans simplement renommer un effet existant.
- Montrer une conséquence pendant la boucle au lieu de promettre tout son intérêt pour plus tard.
- Exécuter les mutations déterministes avant tout texte produit par un modèle.
- Traiter l’or dans le monde : objet, service, information, jeu ou accès, pas amélioration abstraite de carte par défaut.
- Préserver tous les changements locaux hors périmètre.

## Distinguer les trois niveaux

- **Boucle technique :** inspecter, modifier, contrôler et corriger. Elle reste interne à Codex, ne reçoit aucun numéro et ne produit aucun rapport permanent.
- **Boucle d’expérience :** éprouver une sensation, une décision ou une possibilité dans la PWA. Elle seule reçoit un numéro et le verdict du joueur.
- **Boucle de direction :** toutes les trois boucles clôturées, ou quand plusieurs axes se disputent la priorité, rejouer mentalement ou réellement l’ensemble et choisir le manque principal.

Classer automatiquement la demande. Une correction compatible avec l’hypothèse active reste une nouvelle passe de cette boucle. Une proposition qui change l’expérience recherchée devient une nouvelle boucle seulement si l’active est clôturée ou explicitement suspendue.

## Reprendre le contexte sans le dilater

Exécuter `npm run context:loop`.

- `CHAUD` : lire uniquement `artifacts/context/current-project-map.md`, la fiche active et les fichiers utiles.
- `CHAUD CIBLÉ` : inspecter seulement les domaines signalés.
- `FROID` : auditer le livre, le moteur, l’état et l’interface.

Ne pas relire les anciennes boucles, les tests complets ou les fichiers inchangés sauf contradiction visible ou migration ambiguë.

## Cadrer

Lire [references/fiche-de-boucle.md](references/fiche-de-boucle.md), puis créer une fiche courte dans `artifacts/loops/`.

Le contrat fixe :

- l’hypothèse d’expérience ;
- le parcours très court que le joueur essaiera ;
- le signal observable qui permet de décider sans explication technique ;
- les limites refusées ;
- la passe courante, sur deux au maximum.

La fiche sert de reprise de contexte et de mémoire produit. Elle ne contient ni budget Codex, ni routage de modèles, ni liste de fichiers, ni journal de commandes. Les preuves techniques sont choisies depuis ce skill et les règles du projet, pas consignées pour le joueur.

## Mobiliser seulement les spécialistes utiles

- `concevoir-branches-fantasy-story` : structure et conséquences.
- `ecrire-dialogues-fantasy-story` : textes définitifs après stabilisation.
- `concevoir-equilibrer-cartes-fantasy-story` : cartes, états et combats.
- `concevoir-progression-fantasy-story` : niveaux, récompenses et économie.
- `concevoir-visuels-fantasy-story` : interface et ressources.
- `imagegen` : uniquement décors, portraits et illustrations propres à l’univers.

Ne pas charger un spécialiste pour une discipline hors contrat.

## Exécuter

1. Passer la fiche de `cadrée` à `en construction`.
2. Auditer seulement le domaine concerné.
3. Implémenter d’abord règle, état, refus et persistance.
4. Relier ensuite contenu et interface.
5. Produire les textes et visuels nécessaires, sans système adjacent.
6. Après au plus deux passes techniques, passer la fiche à `à jouer` et ouvrir la PWA.
7. Présenter seulement l’expérience et le signal à observer au joueur.
8. Recueillir `garder`, `ajuster` ou `retirer` et son commentaire libre.
9. En cas d’`ajuster`, inscrire le constat, passer à la passe 2 et corriger la même hypothèse. Après un second `ajuster`, reformuler ou retirer au lieu d’empiler une troisième passe.
10. Inscrire l’apprentissage et la décision suivante, puis exécuter `npm run context:loop:refresh`.

Ne jamais créer une nouvelle fiche pour une correction qui poursuit le même signal recherché.

## Revoir la direction

Après trois verdicts depuis la dernière revue, lire [references/revue-de-direction.md](references/revue-de-direction.md) et créer une revue courte dans `artifacts/direction/` avant la boucle suivante.

La revue sépare :

- ce qui s’est réellement amélioré ;
- le manque désormais le plus visible ;
- deux ou trois axes possibles ;
- la direction retenue et ce que l’on cesse provisoirement de polir.

Une demande explicite du joueur peut trancher directement la direction. La revue l’enregistre sans lui imposer un atelier supplémentaire.

Faire remonter uniquement les apprentissages durables dans `AGENTS.md` ou le skill pertinent. Les constats propres à une seule expérience restent dans sa fiche.

## Budget Codex et preuves

Le parcours manuel du joueur est la preuve d’expérience principale.

- Ne pas créer de test automatisé par défaut.
- Pendant le travail, utiliser au plus un test ciblé si une mutation déterministe risquée serait difficile à voir manuellement.
- Vérifier seulement les fichiers modifiés quand un contrôle syntaxique suffit.
- Réserver `npm test` aux migrations risquées, publications importantes ou demandes explicites.
- Lancer `npm run verify:story` seulement si le livre ou son schéma change.
- Lancer `npm run simulate:combat` seulement si règles, cartes, adversaires ou statistiques changent.
- Quand l’interface change, construire la PWA puis laisser le joueur tester le parcours réel sur une fenêtre bureau et une fenêtre étroite.
- Ne jamais répéter une commande réussie sans changement dans son périmètre.
- Pour une publication PWA, limiter la preuve à `npm run build:pwa`, `git diff --check` et un smoke test de l’URL publique, sauf risque particulier.

## Visuels

- Utiliser des ressources open source avec source et licence pour les éléments génériques.
- Réserver `imagegen` aux illustrations raster propres à l’univers.
- Construire disposition, interactions, responsive et animations en code.

## Rendu

Répondre brièvement avec ce qui est jouable, le parcours à essayer et le verdict attendu. Ne pas demander au joueur de préciser le type de boucle ni de rédiger le rapport.
