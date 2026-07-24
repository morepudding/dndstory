---
name: concevoir-visuels-fantasy-story
description: Concevoir, produire, intégrer ou auditer les visuels de Fantasy Story, notamment l'interface en jeu, les cartes, les personnages, les icônes, les états et les illustrations. Utiliser ce skill pour transformer une intention narrative ou mécanique déjà fixée en présentation lisible, cohérente et vérifiée dans l'application réelle. Ne pas modifier silencieusement les règles, l'équilibrage, les branches ou les dialogues.
---

# Concevoir les visuels de Fantasy Story

Transformer une intention de jeu déjà définie en un traitement visuel clair, cohérent avec l'univers et réellement jouable.

## Respecter les contrats

- Considérer la mécanique, le texte fonctionnel et la conséquence narrative comme des entrées, pas comme des éléments à réinventer.
- Signaler toute ambiguïté qui empêcherait de représenter correctement l'effet.
- Transmettre une modification de règle au skill `concevoir-equilibrer-cartes-fantasy-story`.
- Transmettre une modification de branche ou de dialogue aux skills narratifs correspondants.
- Préserver les références canoniques de personnages, les ressources existantes et les changements locaux hors périmètre.

## Choisir la source de chaque visuel

- Chercher les icônes, boutons, cadres, badges, curseurs et éléments similaires dans des ressources open source reconnues du développement de jeux web.
- Vérifier la licence avant intégration, préférer les ressources CC0 lorsqu'elles conviennent et enregistrer dans le dépôt la source, l'auteur et la licence des fichiers retenus.
- Importer uniquement les fichiers réellement utilisés au lieu de déposer un pack entier dans le projet.
- Utiliser le skill `imagegen` pour les décors de scène, les portraits de personnages et les autres illustrations raster propres à l'univers.
- Produire en HTML, CSS, SVG, canvas ou JavaScript la disposition, les composants, les formes simples, les animations, les effets, les transitions et le comportement responsive.
- Ne pas utiliser `imagegen` pour fabriquer des boutons, des icônes génériques, du texte d'interface ou une imitation approximative d'un pack UI existant.

## Travailler par boucle

1. Définir ce que le joueur doit comprendre, ressentir ou décider grâce au visuel.
2. Inspecter l'état actuel dans l'application, les ressources existantes, les données sources et les dimensions cibles.
3. Capturer ou décrire une référence de départ vérifiable.
4. Proposer une seule direction ciblée, avec un critère de réussite observable.
5. Intégrer la plus petite tranche verticale utile dans le produit réel.
6. Vérifier l'interaction, la lisibilité et la cohérence sur une fenêtre bureau et une fenêtre étroite.
7. Comparer avant et après, puis garder, ajuster ou retirer la proposition.

Ne pas multiplier les variantes avant d'avoir appris quelque chose de la première intégration.

## Faire converger le combat vers la direction premium

- Pour chaque passe concernant le combat, ouvrir d'abord `artifacts/concepts/combat-premium-imagegen-v2.png` avec `view_image`, puis la dernière capture Electron du combat.
- Lire `references/direction-combat-premium.md` avant de choisir l'élément visuel à intégrer.
- Traiter la référence comme une direction artistique, jamais comme une spécification de règle ni comme une image à poser derrière l'interface.
- Intégrer une seule famille d'éléments par passe et conserver le reste fonctionnel : composition, cadres de combattants, intention et Tempo, cartes, piles et ressources, puis effets.
- Construire la structure et les interactions en code ; réserver `imagegen` aux portraits, illustrations de cartes, matières ou décors propres à l'univers.
- Ne passer à la famille suivante qu'après comparaison dans Electron et verdict `garder` ou `ajuster`.

## Concevoir selon le type de visuel

### Interface en jeu

- Faire ressortir l'action disponible, la phase courante, la cible, le coût et les états actifs.
- Traiter l'écran comme un jeu et non comme un tableau de bord.
- Conserver une hiérarchie stable quand l'écran se compacte.
- Rendre visibles l'application, la durée et la consommation d'un état sans dépendre uniquement de la couleur.
- Supprimer de l'interface finale tous les sous-textes, descriptions explicatives, aides permanentes et phrases qui répètent une information déjà portée par un nom, une valeur, un coût, un état, une icône ou une action. Ne conserver à l'écran que le texte directement nécessaire pour choisir ou agir.

### Cartes

- Hiérarchiser le nom, le type, le coût, la cible et l'effet dans cet ordre de lecture utile.
- Faire correspondre le traitement visuel au rôle mécanique sans changer ce rôle.
- Vérifier les textes longs, les états désactivés, la sélection, le survol et le coût impossible.
- Distinguer clairement attaque, réaction, défense, contrôle et carte indisponible.

### Personnages et illustrations

- Partir de la référence canonique lorsqu'elle existe.
- Préserver l'identité, les proportions, les signes distinctifs et le langage visuel déjà validé.
- Décliner poses, expressions ou cadrages à partir de cette identité plutôt que de recréer un visage aléatoire.
- Utiliser le skill `imagegen` lorsqu'une nouvelle image raster ou une retouche générative est réellement requise.

## Intégrer dans le dépôt

- Réutiliser les composants, styles, variables et ressources déjà présents avant d'en ajouter.
- Garder les données de jeu comme source de vérité du texte fonctionnel et des états.
- Préférer une modification localisée et réversible.
- Ne pas remplacer une ressource canonique sans comparaison explicite et preuve visuelle.

## Valider dans le produit

Exécuter au minimum :

```powershell
npm run check
npm test
npm run qa:visual
```

Parcourir aussi l'interaction concernée dans l'application Electron réelle. Ne pas conclure à partir du code source ou d'une maquette seule.

Pour chaque résultat, conserver :

- une vue du comportement avant ou une description précise de la référence ;
- une capture après intégration aux dimensions pertinentes ;
- le chemin d'interaction testé ;
- les défauts encore visibles.

## Rendre la décision

Terminer par un verdict `garder`, `ajuster` ou `retirer`, accompagné de la compréhension obtenue, des fichiers touchés, des preuves visuelles et des validations exécutées.
