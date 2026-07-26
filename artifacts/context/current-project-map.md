# Carte de reprise de Fantasy Story

> Générée localement par `npm run context:loop:refresh`. Elle route l'audit ; elle ne remplace ni la vérification ciblée ni le parcours réel dans la PWA.

## Référence

- **Empreinte :** `1695f44d1537d377`
- **Générée :** 2026-07-26T12:57:10.962Z
- **Git informatif :** branche `main`, HEAD `c3e2b1184cde`, 7 entrée(s) dans le worktree
- **Comparaison fiable :** les changements sont détectés par le contenu des fichiers, même si le worktree n'est pas commité.
- **Boucle active :** `artifacts/loops/014-ce-qui-demeure.md` — `à jouer`
- **Dernier verdict :** `artifacts/loops/013-le-pouls-du-combat.md` — `garder`

## Routage

| Domaine | Empreinte | Fichiers repères | Validation |
| --- | --- | --- | --- |
| Règles et boucle | `2a51e8346cda` | `AGENTS.md`<br>`.agents/skills/conduire-boucle-fantasy-story/SKILL.md`<br>`artifacts/loops/014-ce-qui-demeure.md` | validateur du skill, puis `git diff --check` |
| Livre et structure | `74d803dcaaf5` | `content/chapters/`<br>`src/server/story-format.js`<br>`src/server/narrative-tree.js` | `npm run verify:story` et tests narratifs ciblés |
| État et sauvegarde | `a7fcb6630b6e` | `src/server/state-schema.js`<br>`src/server/story-repository.js`<br>`src/server/book-session-service.js` | `npm run check` et tests de persistance ciblés |
| Moteur | `109ace1a2aa6` | `src/server/branching-book-runtime.js`<br>`src/server/combat-engine.js`<br>`src/server/progression-service.js` | `npm run check` et tests moteur ciblés |
| PWA et interface | `4a4158a355c3` | `src/pwa/entry.js`<br>`src/pwa/browser-api.js`<br>`src/renderer/app.js`<br>`src/renderer/styles.css` | `npm run build:pwa`, puis parcours manuel dans la PWA si le rendu ou l'interaction change |
| Ressources visuelles | `248367c1d145` | `src/renderer/assets/`<br>`content/visuals/` | licences, puis parcours manuel dans la PWA si l'affichage change |
| Tests | `882a568af143` | `test/` | test ciblé du contrat modifié |
| Configuration et reste du projet | `dab565a4c8d7` | `package.json`<br>`README.md`<br>`.gitignore` | validation dictée par le domaine concerné |

## Démarrage d'une boucle

1. Exécuter `npm run context:loop`.
2. Si le résultat est `CHAUD`, lire cette carte et la fiche active, puis contrôler l'application ou une capture récente.
3. Si le résultat est `CHAUD CIBLÉ`, inspecter seulement les domaines et fichiers signalés, puis contrôler l'application ou une capture récente.
4. Si le résultat est `FROID`, effectuer l'audit complet prévu par le skill.
5. Après une intégration validée ou un verdict, exécuter `npm run context:loop:refresh`.

Ne jamais utiliser cette carte pour ignorer une incohérence visible, une migration ambiguë ou un changement structurel non classé.
