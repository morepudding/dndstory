# Fantasy Story

Jeu personnel Electron de fiction interactive heroic fantasy, inspiré de Dungeons & Dragons pour ses mécaniques et de Baldur's Gate pour les possibilités offertes par ses lieux.

Le livre, les choix, les combats, la progression et les mutations de ressources sont déterministes et sauvegardés localement après chaque action.

## Aventure jouable

L'aventure actuelle suit un Sorcier à travers trois chapitres :

1. **La Route des Ronces** — premiers choix et combat contre le Pillard.
2. **La Nuit à Brumepont** — utilisation diégétique de l'or : potion, repas, guide ou épargne.
3. **La Cage du Treuil** — sauver Mira ou conserver sa magie pour poursuivre Varek.

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

## Direction artistique

La référence canonique de la future interface premium du combat est :

[`artifacts/concepts/combat-premium-imagegen-v2.png`](artifacts/concepts/combat-premium-imagegen-v2.png)

Le skill local [`concevoir-visuels-fantasy-story`](.agents/skills/concevoir-visuels-fantasy-story/SKILL.md) organise son intégration progressive : une seule famille d'éléments par passe, validation dans Electron, puis verdict `garder`, `ajuster` ou `retirer`.

## Installation

```powershell
npm ci
npm start
```

## Validation

```powershell
npm run check
npm run verify:story
npm run simulate:combat
npm test
npm run qa:visual
```

L'Atelier narratif reste disponible en développement et utilise le même validateur ainsi que le même moteur de prévisualisation que le jeu.
