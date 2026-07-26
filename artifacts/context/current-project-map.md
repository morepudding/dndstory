# Carte de reprise de Fantasy Story

> Générée localement par `npm run context:loop:refresh`. Elle route l'audit ; elle ne remplace ni la vérification ciblée ni le parcours réel dans la PWA.

## Référence

- **Empreinte :** `71713be625812c3b`
- **Générée :** 2026-07-26T07:09:58.119Z
- **Git informatif :** branche `main`, HEAD `42b9d5e570da`, 32 entrée(s) dans le worktree
- **Comparaison fiable :** les changements sont détectés par le contenu des fichiers, même si le worktree n'est pas commité.
- **Boucle active :** `artifacts/loops/012-la-magie-spontanee.md` — `à valider par le joueur`
- **Dernier verdict :** `artifacts/loops/009-le-grimoire-de-combat.md` — `garder`

## Routage

| Domaine | Empreinte | Fichiers repères | Validation |
| --- | --- | --- | --- |
| Règles et boucle | `b93040c78a9c` | `AGENTS.md`<br>`.agents/skills/conduire-boucle-fantasy-story/SKILL.md`<br>`artifacts/loops/012-la-magie-spontanee.md` | validateur du skill, puis `git diff --check` |
| Livre et structure | `f81cc26e277d` | `content/chapters/`<br>`src/server/story-format.js`<br>`src/server/narrative-tree.js` | `npm run verify:story` et tests narratifs ciblés |
| État et sauvegarde | `674e27579b99` | `src/server/state-schema.js`<br>`src/server/story-repository.js`<br>`src/server/book-session-service.js` | `npm run check` et tests de persistance ciblés |
| Moteur | `67b987720c2f` | `src/server/branching-book-runtime.js`<br>`src/server/combat-engine.js`<br>`src/server/progression-service.js` | `npm run check` et tests moteur ciblés |
| PWA et interface | `5c32d26f0dd5` | `src/pwa/entry.js`<br>`src/pwa/browser-api.js`<br>`src/renderer/app.js`<br>`src/renderer/styles.css` | `npm run build:pwa`, puis parcours manuel dans la PWA si le rendu ou l'interaction change |
| Ressources visuelles | `248367c1d145` | `src/renderer/assets/`<br>`content/visuals/` | licences, puis parcours manuel dans la PWA si l'affichage change |
| Tests | `55a16a3f06fb` | `test/` | test ciblé du contrat modifié |
| Configuration et reste du projet | `3e293755e386` | `package.json`<br>`README.md`<br>`.gitignore` | validation dictée par le domaine concerné |

## Démarrage d'une boucle

1. Exécuter `npm run context:loop`.
2. Si le résultat est `CHAUD`, lire cette carte et la fiche active, puis contrôler l'application ou une capture récente.
3. Si le résultat est `CHAUD CIBLÉ`, inspecter seulement les domaines et fichiers signalés, puis contrôler l'application ou une capture récente.
4. Si le résultat est `FROID`, effectuer l'audit complet prévu par le skill.
5. Après une intégration validée ou un verdict, exécuter `npm run context:loop:refresh`.

Ne jamais utiliser cette carte pour ignorer une incohérence visible, une migration ambiguë ou un changement structurel non classé.
