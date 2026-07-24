---
name: concevoir-equilibrer-cartes-fantasy-story
description: Concevoir, implémenter, simuler, équilibrer ou auditer les cartes, les états, les decks, les ressources de combat, les actions et les adversaires de Fantasy Story. Utiliser ce skill pour inventer une carte, vérifier si elle provoque une décision amusante, intégrer sa mécanique au moteur, explorer les chemins de combat et décider de la garder, de l'ajuster ou de la retirer. Ne pas définir la progression permanente, l'illustration finale ou les conséquences narratives sans transmission explicite.
---

# Concevoir et équilibrer les cartes de Fantasy Story

Traiter chaque nouvelle carte ou mécanique comme une hypothèse jouable à éprouver, et non comme une idée à défendre.

## Charger les références

Lire avant de proposer ou modifier une mécanique :

- [principes-de-fun.md](references/principes-de-fun.md) pour formuler la décision recherchée ;
- [protocole-de-test.md](references/protocole-de-test.md) pour définir les preuves minimales.

## Respecter les sources de vérité

- Lire `src/server/combat-engine.js` avant de toucher à une règle de combat.
- Lire la rencontre concernée dans `content/chapters/`.
- Vérifier les contrats dans `src/server/narrative-tree.js`.
- Vérifier la persistance et la migration dans `src/server/state-schema.js`.
- Inspecter l'interface seulement après avoir compris le comportement du moteur.
- Préserver les changements locaux hors périmètre.

## Travailler par boucle

1. Définir la décision que la carte doit provoquer : quand la jouer, contre quoi et au prix de quelle autre option.
2. Établir la référence actuelle : main, ressources, ennemis, dégâts, états, chemin de victoire et cartes concurrentes.
3. Formuler une petite hypothèse testable avec un critère de réussite et un risque d'échec.
4. Implémenter l'effet dans le moteur avant son affichage.
5. Ajouter les contrats de données, la validation, la persistance, les journaux et les tests nécessaires.
6. Explorer exhaustivement les états accessibles avec `npm run simulate:combat`.
7. Jouer le chemin réel dans l'application avec `npm run qa:visual`, puis manuellement si la sensation ou le rythme restent ambigus.
8. Comparer la nouvelle option aux options existantes et décider `garder`, `ajuster` ou `retirer`.

Ne modifier qu'une hypothèse principale par boucle afin de savoir ce qui a produit le résultat.

## Implémenter une mécanique complète

Pour tout nouvel effet, définir explicitement :

- la cible ;
- le coût et le moment de paiement ;
- le déclencheur ;
- l'amplitude ;
- la durée ;
- la règle de cumul ;
- la règle de consommation ou de dissipation ;
- le texte de journal ;
- la représentation dans l'état sauvegardé ;
- le traitement des actions illégales.

Exécuter d'abord les mutations déterministes localement. Une action refusée ne doit ni consommer de ressource ni modifier l'état.

## Évaluer l'équilibre

- Chercher plusieurs chemins viables, pas une égalité artificielle entre toutes les cartes.
- Comparer les alternatives sur le temps gagné, les dégâts évités, le coût, le risque et les synergies.
- Distinguer les états explorés par la simulation d'un taux de victoire probabiliste.
- Refuser une carte obligatoire, strictement dominante, presque toujours morte ou uniquement utile quand la victoire est déjà acquise.
- Considérer les tests et la simulation comme des garde-fous ; réserver le verdict de fun au jeu réel et à la décision du joueur.

## Valider avant de conclure

Exécuter au minimum :

```powershell
npm run check
npm test
npm run verify:story
npm run simulate:combat
npm run qa:visual
```

Exiger un test de régression du cycle complet lorsqu'un état traverse plusieurs tours : application, visibilité, consommation, disparition, sauvegarde et reprise si applicable.

## Transmettre aux autres disciplines

- Fournir au skill `concevoir-progression-fantasy-story` les effets observés lorsqu'un niveau, une statistique ou une récompense permanente modifie le combat.
- Fournir au skill visuel le nom fonctionnel, le type, la cible, le coût, le déclencheur, la durée et les états d'affichage.
- Fournir au skill de dialogue uniquement un texte fonctionnel stabilisé à polir.
- Fournir au skill de branches toute conséquence narrative envisagée sans l'appliquer silencieusement.

## Rendre la décision

Présenter l'hypothèse, la décision provoquée, les variantes testées, les résultats du moteur, les chemins observés, le test dans l'application, les risques restants et le verdict `garder`, `ajuster` ou `retirer`.
