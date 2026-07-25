---
name: relier-aventure-fantasy-story
description: Auditer, cadrer ou corriger les coutures d’une aventure Fantasy Story déjà jouable sans ajouter de nouveau contenu. Utiliser ce skill lorsqu’un parcours complet révèle des transitions abruptes entre chapitres, un combat mal introduit ou conclu, une récompense ou dépense peu visible, une conséquence oubliée, un écran de fin prématuré ou des contenus validés à des niveaux de finition différents.
---

# Relier l’aventure Fantasy Story

Transformer des boucles locales validées en une aventure continue. Traiter une famille de coutures sur le parcours existant ; ne créer ni chapitre, ni adversaire, ni mécanique adjacente.

## Reprendre avec peu de contexte

1. Exécuter `npm run context:loop`.
2. Exécuter `node .agents/skills/relier-aventure-fantasy-story/scripts/resumer-journal.js`.
3. En contexte `CHAUD`, lire la carte courante et le résumé compact. Ne lire une fiche complète que si sa contribution ou son incertitude concerne la couture étudiée.
4. En contexte `CHAUD CIBLÉ`, inspecter uniquement les domaines signalés et les frontières concernées.
5. En contexte `FROID`, reconstruire le parcours jouable depuis le livre, le moteur, la sauvegarde et l’interface ; ne pas charger toutes les anciennes conversations ou captures.

Le script ne modifie rien. Ne pas créer un second journal : les fiches dans `artifacts/loops/` restent la mémoire commune.

## Choisir une seule famille de coutures

Parcourir l’aventure du début à la dernière conclusion disponible, puis choisir la famille la plus visible :

- chapitre vers chapitre ;
- récit vers combat et combat vers récit ;
- choix vers dépense, objet, or, progression ou conséquence ;
- réussite ou échec vers conclusion, reprise ou menu ;
- héritage d’une branche vers la scène suivante.

Une couture est faible si le joueur ne peut pas répondre immédiatement à :

1. Que vient-il d’arriver ?
2. Qu’est-ce qui a changé ?
3. Qu’est-ce que je poursuis maintenant ?

Corriger cette famille partout sur le parcours retenu. Reporter les autres familles ; ne pas dilater la passe en refonte générale.

## Auditer

- Partir d’un parcours réel dans la PWA ou d’une capture récente.
- Comparer l’expérience aux promesses et incertitudes du journal compact.
- Distinguer une absence de contenu d’un contenu présent mais masqué, trop tôt remplacé ou silencieusement appliqué.
- Vérifier les mutations déterministes déjà enregistrées avant d’ajouter un nouvel état.
- Préférer un bref battement narratif, un delta explicite (`+12 or`, `−1 charge`) ou une action de continuation claire à un nouvel écran permanent.
- Laisser le joueur lire une conclusion avant d’ouvrir un menu ou le chapitre suivant.

Pour un audit seul, rendre la famille prioritaire, ses preuves et une passe bornée. Ne modifier aucun fichier.

## Corriger

Si l’implémentation est demandée :

1. Créer une fiche courte dans `artifacts/loops/` pour la famille choisie.
2. Relier d’abord règle, état, refus et persistance.
3. Relier ensuite les textes et l’interface aux mutations existantes.
4. Garder les textes de transition courts et spécifiques à la conséquence.
5. Ne pas réécrire les scènes déjà validées sauf si la couture exige une phrase d’entrée ou de sortie.

Ne pas charger `conduire-boucle-fantasy-story` en parallèle par défaut. Charger seulement le spécialiste indispensable si la correction exige des dialogues définitifs, une règle de progression ou un traitement visuel.

## Prouver

Le parcours manuel complet est la preuve principale. Vérifier chaque frontière de la famille retenue sur au moins une réussite et, si elle diffère, un échec.

- Ajouter au plus un test ciblé si une mutation déterministe resterait invisible.
- Ne pas lancer la suite complète par défaut.
- Pour une modification du skill seul, utiliser son validateur et `git diff --check`.
- Après intégration validée ou verdict, exécuter `npm run context:loop:refresh`.

Terminer avec : couture traitée, changement visible, parcours à jouer, incertitude restante et verdict attendu `garder`, `ajuster` ou `retirer`.
