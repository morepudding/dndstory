# Fantasy Story

Jeu personnel Electron et PWA de fiction interactive heroic fantasy, inspiré de Dungeons & Dragons pour ses mécaniques et de Baldur's Gate pour les possibilités offertes par ses lieux.

Le livre, les choix, les combats, la progression et les mutations de ressources sont déterministes et sauvegardés localement après chaque action.

## Aventure jouable

L'aventure actuelle suit un Sorcier à travers quatre chapitres :

1. **La Route des Ronces** — premiers choix et combat contre le Pillard.
2. **La Nuit à Brumepont** — utilisation diégétique de l'or : potion, repas, guide ou épargne.
3. **La Cage du Treuil** — sauver Mira ou conserver sa magie pour poursuivre Varek.
4. **Le Troisième Palier** — prolonger l’héritage de Mira ou des ordres, libérer les sondeurs puis décider du sort du passage ancien.

La première victoire ouvre le niveau 2, accorde 12 pièces d'or et permet d'améliorer une statistique.

Les livres canoniques sont dans [`content/chapters`](content/chapters).

## Combat de cartes

Le Sorcier joue des cartes Action, puis réagit aux intentions ennemies révélées une par une. Les statistiques déterminent directement ses ressources :

- **Force** : dégâts des armes ;
- **Constitution** : points de vie ;
- **Agilité** : Actions disponibles ;
- **Sagesse** : cartes piochées ;
- **Intelligence** : charges de sort.

Les mécaniques actuellement intégrées comprennent notamment :

- **Ralentissement** : réduit la prochaine pioche ennemie ;
- **Avantage / Désavantage** : la prochaine carte Action coûte 0 ou 2 Actions ;
- **Concentration** : `Orbe suspendu` produit des dégâts différés s'il est protégé pendant le tour ennemi.

Le moteur persiste les PV, charges, états, round, phase, mains, pioches, défausses et conséquences narratives.

Le deck initial forme un grimoire de dix cartes visible pendant le combat : quatre Braises occultes, deux Bâtons de voyage, deux Éclats arcaniques, un Voile d’azur et une Entrave de givre.

## Direction artistique

La référence canonique de la future interface premium du combat est :

[`artifacts/concepts/combat-premium-imagegen-v2.png`](artifacts/concepts/combat-premium-imagegen-v2.png)

Le skill local [`concevoir-visuels-fantasy-story`](.agents/skills/concevoir-visuels-fantasy-story/SKILL.md) organise son intégration progressive : une seule famille d'éléments par passe, validation dans Electron, puis verdict `garder`, `ajuster` ou `retirer`.

## Installation

```powershell
npm ci
npm start
```

## PWA mobile

La PWA réutilise les mêmes chapitres, moteurs, règles et composants que l’application Electron. Seuls le stockage IndexedDB, le cache hors ligne et l’enveloppe d’installation sont spécifiques au navigateur.

```powershell
npm run start:pwa
```

La version locale s’ouvre sur `http://127.0.0.1:4173`. Le build déployable est produit dans `dist/pwa` par :

```powershell
npm run build:pwa
```

Une installation sur un téléphone exige de servir ce dossier en HTTPS. Le chat Codex et l’Atelier restent réservés à l’application PC ; le livre-jeu, les combats, la progression et la sauvegarde fonctionnent hors ligne dans la PWA.

## Validation légère

Le joueur vérifie lui-même chaque parcours. Pendant une boucle, Codex limite donc la preuve à un contrôle ciblé lorsque le risque le justifie.

- `npm run verify:story` seulement si le livre ou son schéma change ;
- `npm run simulate:combat` seulement si les règles ou l’équilibrage changent ;
- `npm test` pour une migration risquée, une publication importante ou sur demande ;
- `npm run qa:visual` et `npm run qa:pwa` uniquement sur demande.

Avant une publication PWA : `npm run build:pwa`, `git diff --check`, puis smoke test de l’URL publique.

L'Atelier narratif reste disponible en développement et utilise le même validateur ainsi que le même moteur de prévisualisation que le jeu.
