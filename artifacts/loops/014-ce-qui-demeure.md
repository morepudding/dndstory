# Boucle 014 — Le journal de route

**Statut :** `à jouer`

## Cap

- **Nouveauté centrale :** un journal de route rassemble les conséquences réellement acquises et l’étape actuellement poursuivie.
- **Effet recherché :** sentir que l’aventure possède une histoire cumulative et retrouver immédiatement ce qui a changé sans quitter l’écran narratif.
- **Dans la boucle :** événements déjà persistés, chapitre en cours, accès direct depuis l’en-tête narratif et présentation paysage mobile.
- **Hors boucle :** nouvelle conséquence, saisie manuelle, encyclopédie, quête secondaire, carte du monde ou modification des branches.

## À tester par le joueur

Depuis une scène narrative, ouvrir `Journal`. Vérifier que les chapitres accomplis racontent le parcours réellement joué, que l’étape en cours reste distincte, puis refermer le journal et reprendre le choix sans perdre le contexte.

## État

- **Hypothèse reformulée après deux ajustements :** les badges puis la divergence immédiate amélioraient localement une couture, mais ne donnaient pas à l’aventure une mémoire visible.
- **Passe :** 1 sur 2 de l’hypothèse reformulée.
- **Verdict passe 1 :** `ajuster` — deux badges résumaient le choix sans produire une conséquence jouable assez forte.
- **Verdict passe 2 :** `ajuster` — la conséquence est réelle, mais l’écran narratif ne donne toujours pas une vision cumulative satisfaisante.
- **Intégré :** l’en-tête narratif ouvre un journal en surimpression. Il distingue l’étape en cours des conclusions acquises, ordonne celles-ci comme une chronologie et conserve le décor derrière la chronique.
- **Vérifié :** contrôle syntaxique complet, construction PWA et diff propre. Le contrôle interactif automatisé du navigateur local est resté indisponible ; le parcours téléphone constitue donc la preuve visuelle.
- **Reste incertain :** le journal rend-il l’aventure plus incarnée et l’écran narratif plus agréable sans devenir un tableau de bord ?
- **Verdict attendu :** `garder`, `ajuster` ou `retirer` selon l’utilité et le plaisir d’ouvrir la chronique pendant le parcours.
