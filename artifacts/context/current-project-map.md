# Carte de reprise de Fantasy Story

> Générée localement par `npm run context:loop:refresh`. Elle route l'audit ; elle ne remplace ni la vérification ciblée ni le parcours réel dans Electron.

## Référence

- **Empreinte :** `750fc7a4ec728ca9`
- **Générée :** 2026-07-25T12:31:59.552Z
- **Git informatif :** branche `agent/lightweight-loops-pwa`, HEAD `e7f4901ec746`, 98 entrée(s) dans le worktree
- **Comparaison fiable :** les changements sont détectés par le contenu des fichiers, même si le worktree n'est pas commité.
- **Boucle active :** `artifacts/loops/009-le-grimoire-de-combat.md` — `à jouer`
- **Dernier verdict :** `artifacts/loops/008-la-couche-de-menus.md` — `garder`

## Routage

| Domaine | Empreinte | Fichiers repères | Validation |
| --- | --- | --- | --- |
| Règles et boucle | `446a9f6a53f6` | `AGENTS.md`<br>`.agents/skills/conduire-boucle-fantasy-story/SKILL.md`<br>`artifacts/loops/009-le-grimoire-de-combat.md` | validateur du skill, puis `git diff --check` |
| Livre et structure | `e14975892ce0` | `content/chapters/`<br>`src/server/story-format.js`<br>`src/server/narrative-tree.js` | `npm run verify:story` et tests narratifs ciblés |
| État et sauvegarde | `1b87cb6bc51c` | `src/server/state-schema.js`<br>`src/server/story-repository.js`<br>`src/server/book-session-service.js` | `npm run check` et tests de persistance ciblés |
| Moteur | `46c80bfc128d` | `src/server/branching-book-runtime.js`<br>`src/server/combat-engine.js`<br>`src/server/progression-service.js` | `npm run check` et tests moteur ciblés |
| Application et interface | `da59a929159f` | `src/main.js`<br>`src/preload.js`<br>`src/renderer/app.js`<br>`src/renderer/styles.css` | `npm run qa:visual` si le rendu ou l'interaction change |
| Ressources visuelles | `14535cc4d8a3` | `src/renderer/assets/`<br>`content/visuals/`<br>`tools/capture-visual-qa.js` | licences, puis `npm run qa:visual` si l'affichage change |
| Tests | `ceb1f0735ee3` | `test/` | test ciblé du contrat modifié |
| Configuration et reste du projet | `a4e413235d8f` | `package.json`<br>`README.md`<br>`.gitignore` | validation dictée par le domaine concerné |

## Démarrage d'une boucle

1. Exécuter `npm run context:loop`.
2. Si le résultat est `CHAUD`, lire cette carte et la fiche active, puis contrôler l'application ou une capture récente.
3. Si le résultat est `CHAUD CIBLÉ`, inspecter seulement les domaines et fichiers signalés, puis contrôler l'application ou une capture récente.
4. Si le résultat est `FROID`, effectuer l'audit complet prévu par le skill.
5. Après une intégration validée ou un verdict, exécuter `npm run context:loop:refresh`.

Ne jamais utiliser cette carte pour ignorer une incohérence visible, une migration ambiguë ou un changement structurel non classé.
