# Boucle 003 — La cage du treuil

**Statut :** `garder`

## Contrat

- **Nouveauté centrale :** faire bifurquer réellement l'histoire autour d'un choix incompatible : dépenser une charge arcanique pour sauver une captive maintenant, ou conserver toute sa magie pour poursuivre le responsable de l'enlèvement.
- **Décision ou sensation :** renoncer lucidement à une possibilité importante, puis vivre assez longtemps avec la conséquence pour que les deux parcours racontent des histoires différentes.
- **Point de départ :** le Sorcier arrive aux vieilles carrières par le passage oublié ou par la route surveillée ; cette provenance modifie visiblement la scène d'entrée et ce qu'il sait avant le dilemme.
- **Étoffement scénaristique :** donner un visage aux captifs, révéler qu'un responsable organise leur transfert et transformer les vieilles carrières en lieu occupé avec ses travailleurs, ses galeries et ses intérêts opposés.
- **Conséquence visible :** sauver la captive ouvre une fuite souterraine vécue avec elle tandis que le responsable s'échappe ; le poursuivre ouvre une traque et un combat, permet de récupérer ses ordres, mais laisse la captive emportée dans les galeries profondes. Les deux conséquences sont montrées dans des scènes distinctes avant leur fin respective.
- **Branches héritées ou ouvertes :** `carriere-par-passage` reprend l'arrivée sous le treuil sans avoir été vu ; `carriere-par-la-route` reprend l'alerte causée par le silence du guetteur. Ces fins produisent deux introductions différentes. La boucle ouvre ensuite deux futurs persistants — `captive-sauvee` ou `ordres-recuperes` — et ne les reconverge pas avant son terme.
- **Dans la boucle :** deux entrées conditionnelles courtes, une scène d'ancrage commune seulement si elle conserve la provenance, le dilemme central, une dépense déterministe de charge avant le texte de conséquence, une branche de fuite avec la captive, une branche de poursuite avec combat, deux conclusions gagnantes distinctes, des échecs causalement préparés, l'état minimal persistant et une présentation visible de la conséquence active.
- **Hors boucle :** système général de repos ou de mana hors combat, compagnon permanent, faction complète, niveau 3, nouvelle carte, équipement, boutique, seconde décision majeure et reconvergence artificielle vers une conclusion identique.

## Parcours joueur

Terminer la boucle 002 par le guide puis par la route surveillée → constater deux arrivées différentes aux carrières → atteindre la cage du treuil → sauver la captive et parcourir avec elle la galerie d'évacuation → reprendre le dilemme → poursuivre le responsable, jouer le combat et récupérer les ordres → vérifier que chaque fin montre ce qui a été gagné, ce qui a été perdu et quel futur reste ouvert.

## Routage des tours

**Mode :** `orchestré`

| Tour et étape(s) | Modèle | Effort | Condition d'escalade |
| --- | --- | --- | --- |
| 1 — auditer les états héritables et structurer les deux branches | Sol | high | arrêt et retour au cadrage si les fins de la 002 ne permettent pas une reprise causale honnête |
| 2 — intégrer moteur, état, livre et interface | Terra | high | arrêt et retour à la structure si l'intégration oblige à reconverger ou à créer un système général |
| 3 — écrire les textes définitifs | Sol | high | arrêt et retour à la structure si Mira ou Varek n'acquièrent pas une voix et une fonction distinctes |
| 4 — traiter l'intégration visuelle | Terra | medium | Terra high dans un nouveau lancement si le comportement affiché reste ambigu |
| 5 — exécuter les preuves hors Codex, puis les résumer en lecture seule | PowerShell puis Luna | déterministe puis low | retour explicite au tour responsable de la preuve échouée |

- **Orchestrateur :** `npm run loop:003` calcule le contexte une fois, ouvre un fil Codex neuf à chaque changement de modèle, transmet un passage compact, puis exécute les preuves finales hors Codex. Il affiche progression, durée, tentative et plafond, s'arrête sur échec sans correction silencieuse et exige une validation humaine après la structure. Le tour Luna `low` final reste en lecture seule. `npm run loop:003 -- -DryRun` vérifie le routage sans appeler de modèle.
- **Prochaine étape :** essai joueur : parcourir les deux provenances et les deux issues, puis donner le verdict `garder`, `ajuster` ou `retirer`.

## Budget de preuve

- **Automatique ciblée :** reprise des deux fins de la boucle 002, paiement unique de la charge, démarrage du combat avec la réserve correcte, persistance de `captive-sauvee` ou `ordres-recuperes`, absence de mutation partielle en cas de refus.
- **Acceptation :** `npm run check`, `npm run verify:story`, `npm run simulate:combat`, puis `npm test` une seule fois après convergence.
- **Application réelle :** jouer les deux provenances et les deux branches jusqu'à leurs scènes finales en 1200 × 820, puis vérifier le dilemme et la conséquence active en 760 × 900.

## Résultat

- **Intégré :** prose définitive des deux arrivées, du pivot, de la fuite avec Mira, de la poursuite de Varek et des trois issues ; les provenances restent perceptibles dans les scènes jouées, sans changement de causalité ni d’équilibrage.
- **Visuel intégré :** trois illustrations raster propres aux carrières (`treuil-et-puits`, `ravin-evasion`, `registre-et-puits`) et deux marqueurs construits en code : provenance héritée visible pendant toute la boucle, puis issue persistante visible à la fin. Aucun élément générique supplémentaire n’a été importé ; les icônes open source et leur licence existantes sont conservées.
- **Preuve visuelle :** `npm run qa:visual` réussi hors du bac à sable imbriqué ; le harnais Electron a produit les huit captures de la cage, validé les scènes, provenances, issues et charges, puis contrôlé l'absence de débordement horizontal à 760 px. Les tentatives internes à Codex ont conservé des avertissements Mojo/cache propres à leur bac à sable.
- **Preuve de parcours :** sauvegarde/réouverture validée pour `captive-sauvee` et `ordres-recuperes` ; captures Electron produites pour passage, sauvetage, poursuite et ordres récupérés en 1200 × 820 et 760 × 900. Les assertions de scène, de provenance, d’issue et de charge ont passé.
- **Observation combat :** Varek est gagnable mais exigeant : 8 victoires sur 2 766 états explorés, avec une meilleure victoire à 1 PV utilisant Entrave de givre. C’est un fait à évaluer par le joueur, pas un rééquilibrage décidé ici.
- **Preuve narrative :** `npm run verify:story` accepté sans avertissement ; `test/cage-du-treuil.test.js` validé 4/4 avec l’isolation Node désactivée pour contourner le refus `spawn EPERM` du bac à sable.
- **Reste incertain :** la difficulté exigeante de Varek reste un point d'observation pour les prochaines boucles, sans bloquer la conservation de celle-ci.
- **Verdict :** `garder` — boucle 003 validée par le joueur le 24 juillet 2026.
