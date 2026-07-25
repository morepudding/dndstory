---
name: concevoir-progression-fantasy-story
description: Concevoir, implémenter, équilibrer ou auditer la progression durable de Fantasy Story, notamment les niveaux, statistiques, points à distribuer, récompenses, or, équipement, boutique et économie. Utiliser ce skill pour créer une montée de niveau, attribuer ou dépenser une récompense, définir une courbe de puissance, faire évoluer les statistiques du héros ou vérifier la persistance et l'équilibre de ces systèmes. Ne pas inventer de cartes, de branches narratives ou de visuels sans transmission au skill spécialisé.
---

# Concevoir la progression de Fantasy Story

Faire de chaque gain permanent une décision visible et durable, puis vérifier ses conséquences dans le jeu réel.

## Partir de l'existant

Avant de proposer une progression :

1. Lire le héros et les règles du chapitre dans `content/chapters/`.
2. Lire `src/server/branching-book-runtime.js` et `src/server/combat-engine.js` pour recenser les effets réels des statistiques.
3. Lire `src/server/state-schema.js`, `src/server/character-store.js` et `src/server/book-session-service.js` pour comprendre sauvegarde, migration et attribution des fins.
4. Inspecter les tests et l'écran actuellement joué.
5. Préserver les changements locaux hors périmètre.

Ne pas supposer que le héros défini par un chapitre constitue déjà un profil persistant. Choisir une seule source de vérité durable et dériver les vues temporaires depuis celle-ci.

## Cadrer la progression

Définir explicitement :

- l'action qui déclenche le gain ;
- les conditions d'éligibilité ;
- le moment où le gain devient définitif ;
- la décision proposée au joueur ;
- le changement de puissance attendu ;
- le plafond et le rythme visés ;
- les éléments hors périmètre de la boucle ;
- le critère `garder`, `ajuster` ou `retirer`.

Garder Dungeons & Dragons comme inspiration mécanique et Baldur's Gate comme inspiration pour l'économie incarnée dans les lieux, puis adapter leurs principes aux valeurs et au rythme déjà présents dans Fantasy Story.

## Concevoir niveaux et statistiques

- Donner à chaque niveau une fonction lisible ; ne pas ajouter un niveau qui ne change que son numéro.
- Préférer peu de gains significatifs à une accumulation de bonus invisibles.
- Vérifier chaque statistique sur tous ses usages narratifs et de combat.
- Éviter qu'un choix de statistique soit obligatoire, irréversible sans avertissement ou sans effet perceptible.
- Afficher avant confirmation l'effet exact du point, puis empêcher une deuxième attribution.

Dans le moteur actuel, vérifier au minimum :

- `strength` : dégâts des armes ;
- `constitution` : points de vie ;
- `agility` : nombre d'actions ;
- `wisdom` : nombre de cartes piochées ;
- `intelligence` : charges de sort ;
- exigences de statistiques des choix narratifs.

Un seul point peut modifier fortement plusieurs chemins. Comparer les cinq options avec le combat et les scènes existants avant de fixer un plafond ou une récompense.

## Concevoir récompenses et économie

- Séparer la récompense obtenue, le solde possédé et la dépense effectuée.
- Attribuer une récompense une seule fois à partir d'un identifiant durable.
- Rendre l'attribution atomique : niveau, point, or et journal doivent réussir ensemble ou ne rien modifier.
- Empêcher qu'un redémarrage, une reprise d'acte, un double clic ou un rechargement du jeu duplique le gain.
- Pour l'or, définir les sources, les futurs usages et l'ordre de grandeur avant de fixer un montant.
- Faire circuler l'or dans le monde : potions, armures, services, paris, informations et accès à des branches propres à un lieu.
- Ne pas utiliser par défaut l'or pour améliorer directement une carte. Une carte ne change que si l'objet acheté produit cet effet de manière cohérente et visible dans l'univers.
- Accepter que toutes les dépenses ne soient pas optimales : distinguer valeur sûre, pari, confort, information incertaine et achat décevant sans cacher arbitrairement leur nature.
- Pour une boutique, comparer revenus, prix, fréquence d'achat et choix sacrifiés ; refuser l'achat si le solde est insuffisant sans mutation partielle.
- Pour l'équipement, définir possession, équipement actif, remplacement et effets dérivés sans confondre objet possédé et statistique permanente.

Si une boucle attribue de l'or pour une boutique future, persister et afficher l'or sans construire la boutique pendant cette même boucle.

## Implémenter le contrat durable

Préférer un profil compact indépendant de la partie active, adapté au schéma existant, contenant seulement les données nécessaires telles que :

- niveau actuel ;
- statistiques permanentes ;
- points non distribués ;
- solde d'or ;
- identifiants de récompenses déjà réclamées ;
- inventaire ou équipement uniquement lorsque leur boucle existe.

Ajouter validation, migration, refus d'actions illégales et journal observable. Appliquer les mutations déterministes localement avant tout texte produit par le modèle.

## Travailler par boucle

1. Établir la référence actuelle de puissance, de difficulté et de richesse.
2. Formuler une seule hypothèse de progression.
3. Implémenter le contrat, la migration et l'attribution idempotente.
4. Répercuter les valeurs sur les choix et le combat.
5. Transmettre au skill visuel les états verrouillé, disponible, sélectionné, confirmé et le détail des gains.
6. Exécuter les tests ciblés, la simulation de combat et le contrôle visuel proportionné.
7. Jouer le parcours complet dans la PWA, sauvegarde et reprise comprises.
8. Décider `garder`, `ajuster` ou `retirer`.

## Valider avant de conclure

Tester au minimum :

- migration d'une ancienne sauvegarde ;
- attribution unique de la récompense ;
- refus sans mutation d'une attribution ou d'un achat invalide ;
- persistance après fermeture et relance ;
- effet exact de chaque statistique sur les choix et le combat ;
- absence de duplication après reprise, redémarrage ou double action ;
- lisibilité de l'écran sur une fenêtre bureau et une fenêtre étroite.

Exécuter les contrôles couverts par le changement :

```powershell
npm run check
npm run simulate:combat
npm run build:pwa
```

Ajouter au plus un test ciblé si une régression déterministe pourrait rester invisible. Exécuter `npm run verify:story` seulement si le livre ou son schéma change.

## Transmettre aux autres disciplines

- Transmettre au skill de cartes les nouvelles valeurs de combat à simuler, sans lui faire décider la progression permanente.
- Transmettre au skill de branches les prix, objets, informations et accès qui doivent ouvrir ou fermer des chemins dans un lieu.
- Transmettre au skill visuel le contrat fonctionnel stabilisé de l'écran et des récompenses.
- Ne pas construire une boutique, un équipement ou une nouvelle mécanique narrative qui appartient à une boucle ultérieure.

## Rendre la décision

Présenter l'hypothèse, le gain ressenti, la décision offerte, les effets sur chaque système existant, les invariants de sauvegarde et d'économie, les parcours testés, les preuves dans la PWA et le verdict `garder`, `ajuster` ou `retirer`.
