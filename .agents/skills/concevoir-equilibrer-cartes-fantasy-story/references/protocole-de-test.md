# Protocole de test des cartes et états

## 1. Fixer la référence

Noter avant modification :

- la main et les ressources initiales ;
- le nombre d'actions ennemies ;
- les chemins de victoire connus ;
- le tour de victoire, les points de vie et la ressource restante sur les meilleurs chemins ;
- l'option existante à laquelle comparer la nouveauté.

Exécuter les contrôles de base :

```powershell
npm run check
npm test
npm run verify:story
```

## 2. Tester le contrat mécanique

Couvrir au minimum :

- la phase et la cible autorisées ;
- le paiement exact du coût ;
- l'effet immédiat ;
- le déclencheur et la durée d'un état ;
- le cumul, la consommation et la disparition ;
- la journalisation ;
- la sauvegarde, la reprise et la réinitialisation si concernées ;
- le refus d'une action illégale sans mutation partielle.

Pour un état traversant plusieurs tours, écrire un test de cycle complet plutôt qu'une collection de tests isolés.

## 3. Explorer les chemins

Exécuter :

```powershell
npm run simulate:combat
```

Interpréter la sortie comme une exploration déterministe d'états, pas comme un taux de victoire probabiliste.

Vérifier :

- l'existence d'un chemin gagnant avec la nouveauté ;
- l'existence d'un chemin gagnant sans elle ;
- l'absence de blocage ou de boucle infinie ;
- l'absence d'une ligne obligatoire qui écrase toutes les autres ;
- la comparaison du tour, des points de vie, des ressources et des cartes jouées ;
- la présence de chemins où la carte est bonne et d'autres où elle ne l'est pas.

## 4. Jouer le produit réel

Exécuter :

```powershell
npm run qa:visual
```

Puis parcourir le combat concerné dans l'application Electron lorsque le rythme, la compréhension ou le plaisir ne peuvent pas être prouvés automatiquement.

Vérifier visuellement :

- la carte jouable et indisponible ;
- le coût et la cible ;
- l'application de l'état ;
- l'état actif dans la zone correcte ;
- son effet au bon moment ;
- sa consommation et sa disparition ;
- le journal de combat ;
- une fenêtre bureau et une fenêtre étroite ;
- un chemin complet jusqu'à victoire ou défaite.

## 5. Décider

Rendre un compte rendu court :

- **Hypothèse** : décision recherchée.
- **Référence** : comportement avant modification.
- **Preuves** : tests, exploration et chemin joué.
- **Résultat** : ce que le joueur peut réellement choisir.
- **Risque restant** : sensation, lisibilité ou équilibre encore incertain.
- **Verdict** : `garder`, `ajuster` ou `retirer`.

Ne pas déclarer une carte amusante parce que les tests passent. Les tests prouvent la cohérence ; le jeu réel et la décision du joueur prouvent l'intérêt.
