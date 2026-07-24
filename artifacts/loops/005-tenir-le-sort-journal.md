# Journal comparatif — Boucle 005

Ce journal mesure la boucle manuelle afin de la comparer aux boucles orchestrées 002/003. Il est tenu directement dans le dépôt, sans script d’orchestration.

## Identification

- **Boucle :** `005-tenir-le-sort`
- **Mode :** manuel, assistant unique, fil unique
- **Modèle appelé par orchestration :** aucun
- **Sous-agents :** aucun
- **Script PowerShell de boucle :** aucun
- **Début local :** `2026-07-24T10:29:24+02:00`
- **Début UTC :** `2026-07-24T08:29:24Z`
- **Fin locale de l’intégration :** `2026-07-24T10:58:38+02:00`
- **Fin UTC de l’intégration :** `2026-07-24T08:58:38Z`
- **Statut :** `ready_to_play`

## Étapes

| Étape | Début local | Fin locale | Durée | Tentatives | Résultat |
| --- | --- | --- | --- | ---: | --- |
| Contexte et audit ciblé | 10:21 | 10:29 | 00:08:00 | 1 | réussi |
| Contrat et journal | 10:29 | 10:32 | 00:03:00 | 1 | réussi |
| Moteur, contrat et sauvegarde | 10:32 | 10:36 | 00:04:00 | 2 | réussi |
| Interface du plateau | 10:36 | 10:51 | 00:15:00 | 2 | réussi |
| Tests ciblés et simulation de travail | 10:38 | 10:48 | 00:10:00 | 6 | réussi |
| Preuves d’acceptation | 10:51 | 10:52 | 00:00:52 | 1 | réussi |
| Parcours Electron réel | 10:52 | 10:57 | 00:05:00 | 2 | réussi après correction de capture |
| Synthèse et passage au joueur | 10:57 | 10:58:38 | 00:01:38 | 1 | réussi |

## Commandes et preuves

| Commande ou contrôle | Portée | Tentative | Durée | Résultat |
| --- | --- | ---: | --- | --- |
| `npm run context:loop` | routage de l’audit | 1 | non mesurée séparément | réussi — `CHAUD CIBLÉ` |
| Inspection de la capture récente du combat | référence visible | 1 | non mesurée séparément | réussie |
| `node --test --test-isolation=none test/combat-concentration.test.js` | référence rouge avant implémentation | 1 | 0,35 s | échec attendu — carte absente, 0/6 |
| `node --test --test-isolation=none test/combat-concentration.test.js` | premier cycle moteur | 2 | 0,32 s | réussi — 6/6 |
| `node --test --test-isolation=none test/combat-concentration.test.js` | ajout de la persistance | 3 | 0,59 s | échec — comparaison vue/raw incorrecte, 6/7 |
| `node --test --test-isolation=none test/combat-concentration.test.js` | persistance corrigée | 4 | 0,55 s | réussi — 7/7 |
| tests Concentration + Tempo | interaction entre boucles 004/005 | 1 | 0,47 s | échec — 2 assertions 004 choisissaient Orbe par position |
| tests Concentration + Tempo | interaction corrigée | 2 | 0,56 s | réussi — 10/10 |
| simulation Varek ciblée | première intégration du deck | 1 | 1,41 s | échec d’équilibre — 24 victoires, toutes avec Orbe |
| simulation Varek ciblée | deux Éclats conservés | 2 | 0,90 s | échec d’équilibre — 22 victoires, toutes avec Orbe |
| simulation Varek ciblée | fenêtre Orbe au round 3 | 3 | 0,86 s | échec d’équilibre — 29 victoires, toutes avec Orbe |
| simulation Varek ciblée | Orbe remplace un Voile | 4 | 1,15 s | réussi — 126 victoires, 94 avec Orbe et 32 sans |
| tests Concentration + Tempo + équilibre | convergence ciblée | 1 | 12,95 s | réussi — 14/14 |
| `npm run check` | syntaxe globale | 1 | 4,58 s | réussi |
| `npm run verify:story` | livre et schéma | 1 | 1,98 s | réussi — 3 livres sans avertissement |
| `npm run simulate:combat` | quatre combats | 1 | 13,41 s | réussi — aucune exploration tronquée |
| `npm test` | suite complète | 1 | 29,53 s | réussi — 64/64 |
| `npm run qa:visual` | premier parcours Electron | 1 | 55,19 s | fonctionnellement réussi ; capture active saisie avant repaint |
| `npm run qa:visual` | preuve visuelle corrigée | 2 | 48,80 s | réussi |

## Incidents et reprises

- La carte de contexte désignait d’abord une ancienne fiche 004 centrée sur un jet de caractéristique. Après actualisation du worktree, la fiche autoritaire `004-prendre-l-ascendant.md`, le moteur et les tests de tempo étaient présents. Aucun ancien prototype n’a été restauré.
- À 10:30, `src/renderer/app.js` a encore été modifié par la boucle 004 après l’audit initial. L’intégration visuelle 005 est différée jusqu’à stabilisation de cette passe afin de ne pas écraser un fichier concurrent.
- À 10:38, une première tentative de patch visuel 005 s’est arrêtée sur contrôle de contexte parce que la 004 venait encore de modifier `app.js`. `apply_patch` n’a écrit aucun des trois fichiers demandés. La version fraîche a ensuite été rechargée.
- L’audit du cycle réel a montré qu’Orbe à 1 charge ne laissait qu’une Réaction contre les deux attaques de Varek : la Concentration était impossible à protéger selon sa propre règle. Une seule valeur a été ajustée, le coût de l’Orbe passe à 0 charge, et la pioche est réordonnée sans changer ses quantités pour fournir la fenêtre `Orbe + Voile + Entrave`.
- La première exploration ciblée a trouvé 24 victoires sur 2 897 états, toutes avec Orbe. Le retrait initial d’un Éclat arcanique avait rendu la nouveauté obligatoire. L’intégration remplace donc un doublon de Bâton à la place et conserve les deux Éclats comme ligne concurrente.
- La deuxième exploration a encore trouvé 22 victoires sur 2 078 états, toutes avec Orbe : conserver les Éclats ne suffisait pas lorsqu’ils arrivaient après la fenêtre de survie. La main offensive originale de la 004 est restaurée au round 2 ; Orbe rejoint `Entrave + Voile` au round 3 et Coup de hampe est déplacé dans la paire ennemie correspondante, sans modifier la composition des decks.
- La troisième exploration a trouvé 29 victoires sur 1 999 états, encore toutes avec Orbe, parfois utilisé uniquement pour ses 2 dégâts immédiats. Tant qu’Orbe remplaçait une attaque, son usage restait nécessaire pour atteindre le total de dégâts. Il remplace désormais un doublon de Voile et ouvre le premier round avec `Voile + Entrave` face à `Lanterne + Coup de hampe`.
- Le premier parcours Electron a validé toutes les assertions, mais l’inspection humaine a vu que la capture bureau de l’état actif conservait l’ancien frame du compositeur. Un `forceRepaint` a été ajouté avant la capture ; la seconde QA produit la bonne preuve. C’est l’unique correction après le premier parcours Electron.
- Le contrôle direct de la fenêtre Electron déjà ouverte a échoué deux fois avec `SetIsBorderRequired … 0x80004002`. Le parcours frais du harnais Electron reste valide ; aucune coordonnée aveugle n’a été utilisée.
- Les nombreux changements locaux préexistants sont hors périmètre et restent préservés.

## Données finales de comparaison

- **Durée totale jusqu’à `ready_to_play` :** 00:29:14
- **Nombre total de tentatives d’étape :** 16
- **Nombre d’échecs de commandes de conception :** 6, dont 1 référence rouge attendue, 2 corrections de tests et 3 rejets d’équilibrage
- **Nombre de collisions de fichier évitées :** 1
- **Nombre de corrections après premier parcours Electron :** 1
- **Validations larges exécutées :** `check` 1 fois, `verify:story` 1 fois, `simulate:combat` 1 fois, `npm test` 1 fois, `qa:visual` 2 fois pour corriger la preuve
- **Verdict joueur :** en attente
