# Fiche de boucle

Limiter chaque fiche à une page courte. Remplacer les indications entre chevrons et retirer les lignes inutiles.

```markdown
# Boucle <numéro> — <nom>

**Statut :** `cadrée` | `intégrée` | `à jouer` | `garder` | `ajuster` | `retirer`

## Contrat

- **Nouveauté centrale :** <une seule nouveauté>
- **Décision ou sensation :** <ce que le joueur doit éprouver ou choisir>
- **Point de départ :** <état observable avant la boucle>
- **Étoffement scénaristique :** <arc, lieu ou personnage existant que cette boucle approfondit ; retirer la ligne si elle n'en offre aucune occasion utile>
- **Conséquence visible :** <changement vécu et montré avant la fin de cette boucle, pas seulement promis pour plus tard>
- **Branches héritées ou ouvertes :** <états antérieurs repris, futurs distincts conservés et point éventuel de reconvergence>
- **Dans la boucle :** <contenu, règle, état, interface et persistance nécessaires>
- **Hors boucle :** <extensions explicitement refusées>

## Parcours joueur

<suite courte d'actions allant du point de départ au verdict>

## Routage des tours

**Mode :** `manuel` | `orchestré`

| Tour et étape(s) | Modèle | Effort | Condition d'escalade |
| --- | --- | --- | --- |
| <1 — cadrer> | <Sol> | <xhigh> | <preuve qui justifierait un changement> |
| <2 — étapes cohérentes suivantes> | <Terra, Sol ou Luna> | <low, medium, high ou xhigh> | <condition précise> |

- **Prochaine étape :** <étape, modèle et effort>

## Budget de preuve

- **Automatique ciblée :** <commande minimale>
- **Acceptation :** <suite large seulement si le risque la justifie>
- **Application réelle :** <chemin et tailles de fenêtre à essayer>

## Résultat

- **Intégré :** <faits vérifiables>
- **Reste incertain :** <questions que seul le jeu tranche>
- **Verdict :** <garder, ajuster ou retirer, avec une phrase de raison>
```

Regrouper dans un même tour les étapes adjacentes qui utilisent le même réglage. Retirer les lignes de routage inutiles. Ne pas recopier la conversation, détailler chaque fichier ni accumuler les sorties de tests. Lier les preuves existantes lorsqu'elles sont utiles.
