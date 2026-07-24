# Carte de reprise de Fantasy Story

> Générée localement par `npm run context:loop:refresh`. Elle route l'audit ; elle ne remplace ni la vérification ciblée ni le parcours réel dans Electron.

## Référence

- **Empreinte :** `fd699bf08c4e08e7`
- **Générée :** 2026-07-24T11:27:48.177Z
- **Git informatif :** branche `main`, HEAD `fb705654bd77`, 8 entrée(s) dans le worktree
- **Comparaison fiable :** les changements sont détectés par le contenu des fichiers, même si le worktree n'est pas commité.
- **Boucle active :** `artifacts/loops/006-jouer-sur-mobile.md` — `à jouer`
- **Dernier verdict :** `artifacts/loops/003-la-cage-du-treuil.md` — `garder`

## Routage

| Domaine | Empreinte | Fichiers repères | Validation |
| --- | --- | --- | --- |
| Règles et boucle | `25d2e0d106fd` | `AGENTS.md`<br>`.agents/skills/conduire-boucle-fantasy-story/SKILL.md`<br>`artifacts/loops/006-jouer-sur-mobile.md` | validateur du skill, puis `git diff --check` |
| Livre et structure | `04a19fa95a85` | `content/chapters/`<br>`src/server/story-format.js`<br>`src/server/narrative-tree.js` | `npm run verify:story` et tests narratifs ciblés |
| État et sauvegarde | `bb640c6b1f6c` | `src/server/state-schema.js`<br>`src/server/story-repository.js`<br>`src/server/book-session-service.js` | `npm run check` et tests de persistance ciblés |
| Moteur | `2d2469ef6342` | `src/server/branching-book-runtime.js`<br>`src/server/combat-engine.js`<br>`src/server/progression-service.js` | `npm run check` et tests moteur ciblés |
| Application et interface | `16d1e1f6faef` | `src/main.js`<br>`src/preload.js`<br>`src/renderer/app.js`<br>`src/renderer/styles.css` | `npm run qa:visual` si le rendu ou l'interaction change |
| Ressources visuelles | `ba0aafb0ffd7` | `src/renderer/assets/`<br>`content/visuals/`<br>`tools/capture-visual-qa.js` | licences, puis `npm run qa:visual` si l'affichage change |
| Tests | `dbd681c8bd84` | `test/` | test ciblé du contrat modifié |
| Configuration et reste du projet | `104bcf541193` | `package.json`<br>`README.md`<br>`.gitignore` | validation dictée par le domaine concerné |

## Démarrage d'une boucle

1. Exécuter `npm run context:loop`.
2. Si le résultat est `CHAUD`, lire cette carte et la fiche active, puis contrôler l'application ou une capture récente.
3. Si le résultat est `CHAUD CIBLÉ`, inspecter seulement les domaines et fichiers signalés, puis contrôler l'application ou une capture récente.
4. Si le résultat est `FROID`, effectuer l'audit complet prévu par le skill.
5. Après une intégration validée ou un verdict, exécuter `npm run context:loop:refresh`.

Ne jamais utiliser cette carte pour ignorer une incohérence visible, une migration ambiguë ou un changement structurel non classé.
