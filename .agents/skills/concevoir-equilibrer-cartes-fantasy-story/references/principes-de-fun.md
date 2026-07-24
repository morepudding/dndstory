# Principes de fun pour les cartes

## Partir d'une décision

Une carte intéressante ne se résume pas à un chiffre supérieur. Elle demande au joueur de choisir entre des bénéfices incompatibles : agir maintenant ou préparer le prochain tour, infliger des dégâts ou réduire un risque, conserver une ressource ou sécuriser un tempo.

Formuler avant toute implémentation :

> Le joueur hésitera entre **cette carte** et **cette autre option** parce que…

Si aucune hésitation crédible n'apparaît, revoir l'idée.

## Examiner sept dimensions

1. **Timing** : la bonne fenêtre est-elle reconnaissable sans être automatique ?
2. **Coût d'opportunité** : quelle action, carte ou ressource abandonner pour la jouer ?
3. **Risque** : que se passe-t-il si la lecture de la situation est mauvaise ?
4. **Tempo** : change-t-elle la quantité ou l'ordre des actions utiles ?
5. **Synergie** : ouvre-t-elle des combinaisons sans devenir obligatoire ?
6. **Contre-jeu** : l'adversaire ou la rencontre garde-t-il une réponse lisible ?
7. **Lisibilité** : le joueur peut-il anticiper le résultat avant de cliquer ?

## Concevoir un état

Un état doit modifier une décision future, pas seulement afficher une icône. Définir :

- qui le reçoit ;
- ce qui le déclenche ;
- combien de temps il dure ;
- s'il se cumule ;
- quand il est consommé ;
- ce que le joueur voit avant, pendant et après sa consommation.

Préférer un effet court et vérifiable à une règle générale difficile à prévoir.

Exemple de tension utile : choisir entre une protection immédiate et un ralentissement qui réduit la prochaine pioche ennemie. Le premier sécurise le tour courant ; le second parie sur le tour suivant. Les valeurs exactes doivent rester ajustables.

## Détecter les anti-modèles

- **Choix dominant** : meilleur dans presque toutes les situations.
- **Carte morte** : trop rarement jouable ou utile.
- **Victoire amplifiée** : forte seulement lorsque la partie est déjà gagnée.
- **Complexité sans décision** : beaucoup de texte pour un résultat évident.
- **Effet invisible** : impact réel mais impossible à anticiper ou confirmer.
- **Faux risque** : coût annoncé qui ne change jamais la meilleure ligne de jeu.

## Définir le seuil de conservation

Garder une proposition lorsque :

- elle crée au moins deux lignes de jeu crédibles ;
- son effet est compris avant l'action et confirmé après ;
- elle n'élimine pas une carte existante de tous les chemins utiles ;
- la simulation ne révèle ni blocage ni solution obligatoire ;
- le combat réel produit l'hésitation recherchée.

Sinon, ajuster une seule variable principale ou retirer la proposition.
