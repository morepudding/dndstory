# Carte de reprise de Fantasy Story

> Générée localement par `npm run context:loop:refresh`. Elle route l'audit ; elle ne remplace ni la vérification ciblée ni le parcours réel dans la PWA.

## Référence

- **Empreinte :** `c16614ddee929934`
- **Générée :** 2026-07-25T13:18:05.953Z
- **Git informatif :** branche `agent/lightweight-loops-pwa`, HEAD `b0a69d0d6923`, 107 entrée(s) dans le worktree
- **Comparaison fiable :** les changements sont détectés par le contenu des fichiers, même si le worktree n'est pas commité.
- **Boucle active :** `artifacts/loops/011-faire-exister-les-conclusions.md` — `à jouer`
- **Dernier verdict :** `artifacts/loops/009-le-grimoire-de-combat.md` — `garder`

## Routage

| Domaine | Empreinte | Fichiers repères | Validation |
| --- | --- | --- | --- |
| Règles et boucle | `95caaf8583fc` | `AGENTS.md`<br>`.agents/skills/conduire-boucle-fantasy-story/SKILL.md`<br>`artifacts/loops/011-faire-exister-les-conclusions.md` | validateur du skill, puis `git diff --check` |
| Livre et structure | `df73a5154300` | `content/chapters/`<br>`src/server/story-format.js`<br>`src/server/narrative-tree.js` | `npm run verify:story` et tests narratifs ciblés |
| État et sauvegarde | `1b87cb6bc51c` | `src/server/state-schema.js`<br>`src/server/story-repository.js`<br>`src/server/book-session-service.js` | `npm run check` et tests de persistance ciblés |
| Moteur | `de63550b1b7b` | `src/server/branching-book-runtime.js`<br>`src/server/combat-engine.js`<br>`src/server/progression-service.js` | `npm run check` et tests moteur ciblés |
| PWA et interface | `6a405c463842` | `src/pwa/entry.js`<br>`src/pwa/browser-api.js`<br>`src/renderer/app.js`<br>`src/renderer/styles.css` | `npm run build:pwa`, puis parcours manuel dans la PWA si le rendu ou l'interaction change |
| Ressources visuelles | `e2c948adae22` | `src/renderer/assets/`<br>`content/visuals/` | licences, puis parcours manuel dans la PWA si l'affichage change |
| Tests | `e767de7a6c72` | `test/` | test ciblé du contrat modifié |
| Configuration et reste du projet | `471c891367c6` | `package.json`<br>`README.md`<br>`.gitignore` | validation dictée par le domaine concerné |

## Démarrage d'une boucle

1. Exécuter `npm run context:loop`.
2. Si le résultat est `CHAUD`, lire cette carte et la fiche active, puis contrôler l'application ou une capture récente.
3. Si le résultat est `CHAUD CIBLÉ`, inspecter seulement les domaines et fichiers signalés, puis contrôler l'application ou une capture récente.
4. Si le résultat est `FROID`, effectuer l'audit complet prévu par le skill.
5. Après une intégration validée ou un verdict, exécuter `npm run context:loop:refresh`.

Ne jamais utiliser cette carte pour ignorer une incohérence visible, une migration ambiguë ou un changement structurel non classé.
