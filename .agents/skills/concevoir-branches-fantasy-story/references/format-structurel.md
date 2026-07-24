# Format structurel générique

## Contrat du récit

Recopier explicitement les contraintes fournies : genre, ton, public, personnage jouable, nombre d'actes, nature et nombre des fins, nombre de routes gagnantes, règles de reprise et contenu interdit. Ne compléter aucune contrainte absente par les habitudes d'un autre projet.

## Chapitre

- `premise` : situation et promesse.
- `dramaticQuestion` : question explorée sans réponse morale prédéfinie.
- `fixedBeats` : événements indispensables et justification.
- `stateModel` : états sémantiques strictement utiles.
- `acts` : mouvements causaux du chapitre, selon le nombre demandé.
- `endings` : issues conformes au contrat et cause narrative de chacune.

## Scène

- `id`, `actId`, `title`.
- `role` : `anchoring` uniquement pour l'introduction non stratégique ; `strategic` ou omission ailleurs.
- `situation`, `driver`, `goal`, `tension`, `turn`, `choices`, `handoff`.

## Choix

- `id`, `targetNodeId`.
- `role` : `anchoring` pour les options introductives sans conséquence ; `strategic` ou omission ailleurs.
- Pour un choix stratégique : `approach`, `value`, `benefit`, `cost`, `risk`, `immediateConsequence`, `delayedTrace`.
- Pour un choix d'ancrage : seulement une micro-action adaptée à la scène et la cible commune. Aucun avantage, coût, risque, état ou trace.

## Transmission à l'écriture

Pour chaque scène, transmettre uniquement situation, faits connus, objectifs, informations cachées autorisées, intention communicative, contenu indispensable, gestes imposés par la causalité et résultat narratif. Ne produire aucune réplique ni prose finale.
