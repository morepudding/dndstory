# Boucle 005 — Tenir le sort

**Statut :** `à jouer`

## Contrat

- **Nouveauté centrale :** adapter la Concentration de D&D en un pari déterministe d’un round : un sort concentré survit au tour ennemi, se brise au premier dégât non bloqué et produit son effet différé au début du prochain tour du Sorcier.
- **Décision ou sensation :** choisir entre les 5 dégâts immédiats d’Éclat arcanique et un Orbe suspendu plus puissant à terme, puis décider si les charges restantes méritent d’être dépensées pour protéger ce bénéfice futur.
- **Point de départ :** le combat existant contre Varek après la boucle 004, avec Avantage/Désavantage, deux Actions, deux charges et un plateau qui expose les intentions ennemies.
- **Étoffement scénaristique :** approfondir le duel magique contre Varek sans modifier ses scènes ni ses conséquences.
- **Conséquence visible :** Orbe suspendu reste posé comme sort actif ; le fil de Concentration se brise au premier dégât subi ou déclenche 5 dégâts au début du tour suivant.
- **Branches héritées ou ouvertes :** aucune nouvelle branche narrative ; la mécanique prolonge uniquement la branche de poursuite de Varek.
- **Dans la boucle :** un état Concentration non cumulable, une carte Action `Orbe suspendu`, son interaction avec les coûts 0/1/2, les dégâts bloqués ou subis, la persistance, les journaux du moteur, la simulation et sa représentation sur le plateau.
- **Hors boucle :** jet de Constitution, concentration générale sur plusieurs sorts, durée supérieure à un tour ennemi, nouvelle carte ennemie, nouveau chapitre, nouvel ennemi, type de dégâts, résistance, équipement et deckbuilding.

## Règle

- `Orbe suspendu` ne consomme aucune charge et paie le coût en Actions calculé par Avantage/Désavantage. Sa conservation contre les deux intentions de Varek peut en revanche exiger les deux charges disponibles en Réactions.
- Il inflige 2 dégâts immédiatement et crée Concentration avec 5 dégâts différés.
- Une seule Concentration peut être active ; la carte est indisponible tant que son Orbe est déjà suspendu.
- Chaque attaque est résolue après le blocage. Un résultat de 0 dégât conserve la Concentration ; tout dégât strictement positif la brise.
- Si le Sorcier survit au tour ennemi avec sa Concentration, les 5 dégâts sont appliqués au début de son prochain tour, avant la pioche, puis l’état disparaît.
- Si ces dégâts mettent Varek à 0 PV, le combat se termine immédiatement en victoire sans ouvrir un nouveau tour jouable.

## Parcours joueur

Poursuivre Varek → jouer Orbe suspendu avec un coût affiché de 0, 1 ou 2 Actions → protéger entièrement l’Orbe et voir ses 5 dégâts différés → recommencer et accepter un dégât pour voir le fil se briser → bloquer Coup de hampe, conserver l’Orbe mais recevoir Désavantage → terminer le combat avec et sans Orbe sur le plateau bureau puis étroit.

## Routage des tours

**Mode :** `manuel — un seul assistant, un seul fil, aucun appel à un autre modèle`

- **Mécanique :** intégrer le cycle complet sans toucher au récit.
- **Visuel :** prolonger en code le plateau de la boucle 004 avec une zone de sort actif et un fil lisible.
- **Preuve :** lancer les preuves ciblées pendant l’intégration, puis une seule passe des validations larges et un parcours Electron réel.
- **Prochaine étape :** jouer les lignes protégée et brisée dans l’application, puis rendre le verdict.

## Budget de preuve

- **Automatique ciblée :** coût 0/1/2, application, indisponibilité sans mutation, conservation sur blocage total, rupture sur dégât, déclenchement avant pioche, victoire différée, disparition et reprise sauvegardée.
- **Acceptation :** `npm run check`, `npm run verify:story`, `npm run simulate:combat` et `npm test` une seule fois après convergence.
- **Application réelle :** `npm run qa:visual`, puis parcours Varek en 1200 × 820 et 760 × 900 avec Concentration conservée et brisée.

## Résultat

- **Intégré :**
  - `Orbe suspendu` inflige 2 dégâts et crée une Concentration de 5 dégâts sans consommer de charge ;
  - le premier dégât non bloqué brise le fil ; un tour ennemi entièrement bloqué déclenche les dégâts avant la pioche suivante et peut terminer le combat ;
  - Concentration cohabite avec Avantage ou Désavantage, survit à la sauvegarde et interdit atomiquement un second Orbe ;
  - Orbe remplace un doublon de Voile, tandis que les deux Éclats arcaniques et toutes les cartes de dégâts sont conservés ;
  - la première main offre `Orbe + Voile + Entrave` face à `Lanterne + Coup de hampe`, donc protéger l’Orbe consomme les deux charges et laisse Désavantage au tour suivant ;
  - le plateau affiche une carte centrale reliée au Sorcier, puis un état doré au déclenchement ou un fil rouge rompu après les dégâts.
- **Équilibrage :** 2 494 états de Varek explorés sans troncature ; 126 victoires, dont 94 avec Orbe joué, 18 avec Concentration réellement déclenchée et 32 sans jouer Orbe. La meilleure ligne avec déclenchement gagne au round 3 avec 8 PV ; la meilleure sans Orbe gagne au round 4 avec 2 PV.
- **Preuves :** `npm run check`, `npm run verify:story`, `npm run simulate:combat`, 64 tests et `npm run qa:visual` réussissent. Le cycle ciblé couvre application, blocage total, rupture, coûts 0/2, victoire différée et réouverture de sauvegarde.
- **Preuves visuelles :** captures bureau et étroite de l’Orbe actif et brisé, plus capture bureau du déclenchement ; aucune ressource générique ou image générée ajoutée.
- **Reste incertain :** le plaisir réel du pari, la puissance ressentie du départ `Orbe + deux Réactions` et la densité verticale sur petit écran doivent être jugés par le joueur.
- **Verdict :** à jouer.
