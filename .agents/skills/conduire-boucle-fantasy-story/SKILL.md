---
name: conduire-boucle-fantasy-story
description: Cadrer, coordonner, exécuter ou auditer une boucle itérative complète de Fantasy Story depuis l'existant jusqu'au verdict dans l'application réelle. Utiliser ce skill lorsqu'une demande parle de boucle, de passe, de tranche verticale ou combine plusieurs disciplines telles que narration, dialogues, mécaniques, progression, visuels, persistance et interface. Orchestrer les skills spécialisés sans remplacer leur expertise ni multiplier les systèmes hors périmètre.
---

# Conduire une boucle Fantasy Story

Faire traverser une seule nouveauté centrale à toutes les disciplines utiles, puis la jouer dans l'application avant de décider de la conserver.

## Distinguer couverture et expansion

- Couvrir tous les aspects pertinents ne signifie pas inventer un système dans chaque discipline.
- Choisir une hypothèse centrale et considérer les autres travaux comme son intégration narrative, mécanique, visuelle ou technique.
- Traiter une carte, une scène, un écran ou un test comme une sous-tâche lorsqu'ils servent cette hypothèse.
- Refuser les fonctionnalités adjacentes qui ne sont pas nécessaires pour éprouver l'expérience demandée.
- Garder Dungeons & Dragons comme inspiration mécanique et Baldur's Gate comme inspiration pour les lieux, les rencontres et les possibilités diégétiques.
- Faire dépenser l'or dans le monde avant d'envisager une amélioration abstraite de carte : objets, services, jeux, informations ou accès selon le lieu.

## Adapter D&D au jeu de cartes

Pour toute proposition de boucle mécanique :

1. Nommer la mécanique D&D source.
2. La traduire dans les décisions, ressources et temporalités du jeu de cartes réellement présent.
3. La comparer aux cartes existantes et refuser une adaptation qui ne fait qu'inverser ou renommer leur effet.
4. Formuler la nouvelle hésitation du joueur avant de produire une fiche, un artefact ou une orchestration.

Garder une seule adaptation centrale par boucle. Utiliser ensuite les cartes, l'interface et l'équilibrage pour la rendre lisible et plaisante, sans ajouter de système adjacent.

Exemple approuvé : traduire Avantage et Désavantage dans l'économie d'Actions. Avantage rend gratuite la prochaine carte Action ; Désavantage lui fait consommer deux Actions ; les deux états s'annulent. Cette adaptation occupe un axe distinct du ralentissement de pioche d'Entrave de givre.

## Partir de l'existant

Commencer par exécuter `npm run context:loop`, puis choisir la profondeur d'audit :

- `CHAUD` : lire `artifacts/context/current-project-map.md`, la fiche active et contrôler l'application ou une capture récente. Ne pas relire les fichiers inchangés.
- `CHAUD CIBLÉ` : inspecter les domaines et fichiers signalés, puis contrôler l'application ou une capture récente.
- `FROID` : inspecter complètement le livre canonique, le moteur concerné, le schéma persistant, l'interface, les ressources et les tests.

Passer en audit froid malgré une référence existante si une migration est ambiguë, si le classement ne couvre pas une nouveauté structurelle ou si l'état visible contredit la carte.

Pendant l'audit nécessaire :

1. Ouvrir l'application ou une capture récente de l'état réellement joué.
2. Identifier les règles, composants et contenus à prolonger.
3. Relever les changements locaux hors périmètre et les préserver.
4. Formuler ce qui existe déjà, ce qui manque et pourquoi la nouvelle passe est nécessaire.

Ne pas substituer une architecture générique à une fondation locale qui fonctionne.

## Écrire le contrat de boucle

Fixer avant l'implémentation :

- la nouveauté centrale ;
- la décision ou la sensation recherchée ;
- le point de départ observable ;
- le fil narratif, le lieu ou le personnage que la boucle permet d'étoffer ;
- la conséquence que le joueur verra pendant cette boucle, sans reporter toute sa portée à un chapitre futur ;
- les branches antérieures reprises, les branches nouvelles laissées ouvertes et leur éventuel point de convergence ;
- les disciplines réellement nécessaires ;
- les éléments explicitement hors périmètre ;
- le chemin complet que le joueur devra essayer ;
- le critère `garder`, `ajuster` ou `retirer`.

Si une idée implique un futur système, enregistrer seulement l'état minimal nécessaire sans construire ce futur système pendant la passe.

## Tenir une fiche de boucle

- Lire [references/fiche-de-boucle.md](references/fiche-de-boucle.md) au cadrage.
- Créer une fiche dans `artifacts/loops/` avant l'implémentation.
- La mettre à jour seulement après l'intégration puis après le verdict, sans en faire un journal quotidien.
- Utiliser cette fiche comme contrat court lors des reprises de contexte.

## Router les tours sans sous-agent

Exécuter la boucle séquentiellement, sans sous-agent. Traiter chaque changement de modèle ou d'effort comme une frontière entre deux fils Codex indépendants ; un modèle actif ne peut pas modifier son propre réglage au milieu d'un tour.

Au cadrage sous Sol `xhigh` :

1. Découper la boucle en tours cohérents à partir des étapes réellement nécessaires.
2. Inscrire dans la fiche le modèle, l'effort et la condition d'escalade de chaque tour.
3. Choisir le niveau le plus bas qui conserve la qualité attendue.
4. Ne réviser le routage que lorsqu'une preuve nouvelle rend l'étape plus ambiguë, risquée ou mécanique que prévu.

L'orchestrateur extérieur doit :

1. exécuter `npm run context:loop` une seule fois et constituer un paquet de contexte court ;
2. ouvrir un nouveau fil à chaque changement de modèle ou d'effort, sans reprendre l'historique complet ;
3. transmettre seulement la fiche, le paquet de contexte et les messages de passage utiles ;
4. afficher pour chaque étape sa progression, sa durée, son nombre d'essais et son plafond de temps.

Utiliser cette base, puis l'adapter au contrat :

| Travail | Modèle et effort par défaut | Escalade |
| --- | --- | --- |
| Cadrer la nouveauté, les exclusions et le routage | Sol `xhigh` | Aucune baisse avant que le contrat soit écrit |
| Auditer l'existant | Terra `medium` | Terra `high` si l'état visible contredit les fichiers ou si une migration est ambiguë |
| Structurer les branches et arbitrer les mécaniques | Sol `high` | Sol `xhigh` pour un compromis irréversible ou plusieurs conséquences liées |
| Implémenter la règle et intégrer moteur, état, interface et sauvegarde | Terra `high` | Sol `xhigh` seulement si le contrat doit être réarbitré |
| Écrire les textes définitifs | Sol `high` | Sol `xhigh` seulement si la voix ou le sous-texte reste structurellement incertain |
| Traiter l'intégration visuelle courante | Terra `medium` | Terra `high` pour un comportement affiché complexe |
| Exécuter des commandes de preuve déjà déterminées et résumer leurs résultats | Luna `low` | Terra `high` dès qu'un échec doit être diagnostiqué ou corrigé |
| Jouer le parcours Electron et préparer le verdict | Terra `medium` | Terra `high` si le comportement réel diverge du contrat |

N'utiliser Luna `low` que pour une étape déterministe sans décision de conception ni correction de code.

À la fin de chaque tour :

- produire un message de passage compact contenant les décisions, fichiers touchés, preuves ciblées et incertitudes ;
- annoncer le prochain couple `modèle / effort` et la prochaine étape ;
- si aucun orchestrateur ne peut appliquer ce réglage au tour suivant, s'arrêter pour laisser l'utilisateur le sélectionner ;
- si un orchestrateur le permet, ouvrir un fil neuf avec le réglage prévu et le passage compact ;
- ne jamais créer de sous-agent pour simuler ce changement de modèle.

Ne pas poursuivre toute la boucle sous Sol `xhigh` uniquement parce que le cadrage a été lancé avec ce réglage.

## Mobiliser les spécialistes

- Sélectionner les spécialistes à partir du contrat ; ne pas charger toute la liste par défaut.
- Utiliser `concevoir-branches-fantasy-story` pour la structure, les conséquences et les scènes.
- Utiliser `ecrire-dialogues-fantasy-story` seulement après stabilisation de la structure.
- Utiliser `concevoir-equilibrer-cartes-fantasy-story` pour les cartes, états, ressources et combats.
- Utiliser `concevoir-progression-fantasy-story` pour les niveaux, statistiques, récompenses et économie.
- Utiliser `concevoir-visuels-fantasy-story` pour la direction visuelle et l'intégration dans le produit.
- Utiliser `imagegen` uniquement pour les décors, portraits et illustrations raster qui le justifient.

Lire chaque skill réellement mobilisé et respecter ses frontières. Ne pas demander à un spécialiste de décider silencieusement pour une autre discipline.

## Exécuter la boucle

1. **Cadrer** : verrouiller la nouveauté centrale et les exclusions.
2. **Auditer** : établir une référence mécanique, narrative et visuelle vérifiable.
3. **Structurer** : concevoir uniquement les scènes et conséquences nécessaires.
4. **Implémenter la règle** : modifier le moteur, les contrats, la persistance et les refus d'actions avant la présentation.
5. **Écrire** : produire les textes définitifs à partir de la structure validée.
6. **Traiter le visuel** : appliquer la politique open source, `imagegen` ou code selon le type de ressource.
7. **Intégrer** : relier contenu, moteur, état, interface et sauvegarde en un seul parcours.
8. **Vérifier** : faire exécuter une seule fois les preuves d'acceptation et la QA Electron par l'orchestrateur extérieur.
9. **Décider ensemble** : présenter les preuves et demander le verdict du joueur.

Ne pas considérer la boucle terminée tant que l'utilisateur ne peut pas l'essayer dans l'application.
Après une intégration validée ou le verdict, exécuter `npm run context:loop:refresh` afin que la reprise suivante compare les contenus au bon état de référence.

## Dépenser un budget de preuve

- Pendant le travail, chaque modèle ne lance que les preuves ciblées rapides autorisées pour son contrat.
- Réserver à l'orchestrateur extérieur `npm run check`, `npm run verify:story`, `npm run simulate:combat`, `npm test` et `npm run qa:visual`, chacun au plus une fois après convergence et seulement s'il couvre la boucle.
- Ne jamais lancer Electron depuis un Codex imbriqué ; l'orchestrateur extérieur possède la QA Electron.
- Confier le résumé final à Luna `low` ou Terra `low` dans un fil neuf en lecture seule, après les preuves. Ce tour ne corrige rien et transmet la fiche au statut `à jouer`.
- En cas d'échec, arrêter la chaîne, conserver les journaux et indiquer l'étape à reprendre. Ne jamais corriger silencieusement depuis le tour de vérification.
- Attendre une tranche cohérente avant d'exécuter une suite plus large.
- Lancer `npm test` une seule fois avant livraison lorsque le moteur, l'état, la persistance ou plusieurs couches ont changé.
- Lancer `npm run verify:story` seulement lorsque le livre ou son schéma a changé.
- Lancer `npm run simulate:combat` seulement lorsque les règles, cartes, adversaires ou statistiques de combat ont changé.
- Lancer `npm run qa:visual` seulement lorsque le rendu, une ressource ou une interaction visible a changé.
- Ne pas relancer une commande réussie si aucun fichier de son périmètre n'a changé.
- Conserver pour toute boucle complète une preuve automatique ciblée, une preuve du parcours réel et le verdict du joueur.

## Appliquer la politique visuelle

- Réserver les packs open source de qualité aux icônes, boutons, cadres et éléments génériques de jeu.
- Vérifier et consigner les licences des ressources importées.
- Réserver `imagegen` aux décors de scène, portraits et illustrations propres à l'univers.
- Construire en code la disposition, les interactions, les animations, les effets et le responsive.
- Valider sur une fenêtre bureau et une fenêtre étroite.

## Utiliser l'exemple de niveau 2

Pour une passe centrée sur le passage du niveau 1 au niveau 2 :

- inclure un point de statistique, une récompense en or, quelques scènes existantes adaptées, la persistance et un écran de niveau ;
- ne pas ajouter simultanément boutique, équipement, nouvelle mécanique narrative, nouvel ennemi ou nouveau système de cartes ;
- conserver l'or pour une future boucle d'achat sans construire cette boucle maintenant.

Cet exemple illustre la taille d'une boucle ; ne pas le réutiliser comme contenu obligatoire pour une autre passe.

## Rendre le résultat

Présenter :

- le contrat et les exclusions ;
- ce qui a été prolongé dans l'existant ;
- les contributions de chaque skill ;
- les fichiers et ressources intégrés ;
- les tests, captures et chemin joué ;
- les incertitudes restantes ;
- le verdict `garder`, `ajuster` ou `retirer`.
