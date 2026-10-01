import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { baseURL } from "../mcp-base-url.js";

const templateUri = "ui://after/story-v2.html";

const widgetMeta = {
  ui: {
    resourceUri: templateUri,
    visibility: ["model", "app"],
  },
  "ui/resourceUri": templateUri,
  "openai/outputTemplate": templateUri,
  "openai/toolInvocation/invoking": "Ouverture de AFTER // 02:47…",
  "openai/toolInvocation/invoked": "Scène prête",
  "openai/widgetAccessible": true,
  "openai/resultCanProduceWidget": true,
};

const initialState = (playerName = "Romain") => ({
  mode: "after_story",
  chapter: "CHAPITRE 01",
  chapterTitle: "LE CENTRE",
  timeLabel: "JEUDI · 02:47 · EXTÉRIEUR INCONNU",
  headline: "Quelqu’un frappe à la porte.",
  objective: "Comprendre ce qui se passe dehors.",
  resources: { waterDays: 5, foodDays: 4, batteryPercent: 62 },
  playerName,
  narration:
    "Le courant saute d’un coup. Une seconde plus tard, un choc lourd résonne contre la porte principale du centre sportif. Puis un deuxième. Plus fort.",
  dialogue: [
    { speaker: "lea", text: "Dites-moi que c’est juste quelqu’un de bourré qui s’est paumé." },
    { speaker: "maya", text: "Non. J’ai vu des gens courir sur la route avant que le réseau tombe." },
    { speaker: "elise", text: "La porte arrière vient de bouger." },
  ],
  choices: ["Barricader la porte", "Monter sur le toit", "Aller voir le parking"],
  sceneSummary:
    "Début de l’épidémie. Le groupe de quatre étudiants adultes est isolé dans un ancien centre sportif rural. Le réseau est tombé et quelqu’un ou quelque chose frappe à l’entrée.",
});

const storyBible = `
AFTER // 02:47 est une histoire contemporaine de survie zombie, réaliste, sans fantasy.

Le joueur incarne Romain, étudiant adulte du groupe. Ne décide jamais à sa place : il peut répondre librement ou choisir une proposition.

Personnages :
- Léa, 19 ans : étudiante en communication, coupe pixie blonde, spontanée, sincère, cash, parfois imprudente. Elle masque ses inquiétudes par l’humour et l’action.
- Maya, 20 ans : étudiante en STAPS, tomboy, athlétique sans caricature, déterminée, franche, compétitive, très loyale. Elle préfère agir plutôt que débattre.
- Élise, 19 ans : étudiante en arts appliqués, gothique alternative, cheveux noirs longs et frange, observatrice, créative, humour noir, réservée mais très sensible.

Cadre : ancien centre sportif/internat rural, catastrophe en cours, information fragmentaire, danger crédible. Les zombies restent physiques et biologiques, jamais magiques.

Ton : thriller de survie adulte, dialogues naturels, tension lente, relations qui évoluent selon les actes. Les rapprochements romantiques ou sexuels doivent rester entre adultes consentants et émerger progressivement du contexte, jamais comme une récompense automatique. Pas de violence sexuelle.

À chaque continuation :
1. Fais avancer concrètement la survie.
2. Fais parler seulement les personnages utiles à la scène.
3. Garde les personnalités cohérentes et évite les archétypes grossiers.
4. Termine avec 2 à 4 options courtes tout en laissant le joueur écrire librement.
5. Appelle ensuite l’outil render_after_turn avec la scène que tu viens d’écrire afin de mettre à jour l’interface.
`;

const handler = createMcpHandler(async (server) => {
  const response = await fetch(baseURL + "/");
  let html = await response.text();
  // Vercel Preview injects its toolbar script after </html>. That script is not part of
  // the MCP app and can be blocked by ChatGPT\'s widget CSP, so strip it before serving.
  html = html.replace(/<script[^>]*vercel\.live[^>]*><\/script>/gi, "");
  html = html.replace("<head>", `<head><base href="${baseURL}/">`);

  server.registerResource(
    "after-story-widget",
    templateUri,
    {
      title: "AFTER // 02:47",
      description: "Interface interactive de l’histoire de survie AFTER // 02:47",
      mimeType: "text/html;profile=mcp-app",
      _meta: {
        ui: {
          prefersBorder: false,
          domain: baseURL,
          csp: {
            resourceDomains: [baseURL],
            connectDomains: [],
          },
        },
        "openai/widgetDescription":
          "Interface de visual novel/survie avec Léa, Maya et Élise, choix d’action et état du refuge.",
        "openai/widgetPrefersBorder": false,
        "openai/widgetDomain": baseURL,
        "openai/widgetCSP": {
          resource_domains: [baseURL],
          connect_domains: [],
        },
        "openai/ui": {
          availableDisplayModes: ["fullscreen"],
        },
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html;profile=mcp-app",
          text: html,
          _meta: {
            ui: {
              prefersBorder: false,
              domain: baseURL,
              csp: {
                resourceDomains: [baseURL],
                connectDomains: [],
              },
            },
            "openai/widgetDescription":
              "Interface de visual novel/survie avec Léa, Maya et Élise, choix d’action et état du refuge.",
            "openai/widgetPrefersBorder": false,
            "openai/widgetDomain": baseURL,
            "openai/widgetCSP": {
              resource_domains: [baseURL],
              connect_domains: [],
            },
            "openai/ui": {
              availableDisplayModes: ["fullscreen"],
            },
          },
        },
      ],
    })
  );

  server.registerTool(
    "open_after_story",
    {
      title: "Ouvrir AFTER // 02:47",
      description:
        "Démarre ou réaffiche l’histoire interactive AFTER // 02:47. Utilise cet outil quand l’utilisateur veut lancer, reprendre ou afficher l’interface de l’histoire.",
      inputSchema: {
        playerName: z.string().optional().describe("Prénom du joueur. Par défaut : Romain."),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: widgetMeta,
    },
    async ({ playerName }) => {
      const state = initialState(playerName || "Romain");
      return {
        content: [
          {
            type: "text",
            text:
              "AFTER // 02:47 est prêt. Utilise get_story_context si tu as besoin de la bible, puis continue l’histoire. Après chaque continuation, appelle render_after_turn pour afficher la scène.",
          },
        ],
        structuredContent: state,
        _meta: widgetMeta,
      };
    }
  );

  server.registerTool(
    "get_story_context",
    {
      title: "Lire la bible de AFTER",
      description:
        "Retourne les règles de narration, le cadre et les personnalités de Léa, Maya et Élise. Appelle-le avant de continuer si le contexte n’est pas déjà clair.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async () => ({
      content: [{ type: "text", text: storyBible }],
    })
  );

  server.registerTool(
    "render_after_turn",
    {
      title: "Afficher la prochaine scène",
      description:
        "Affiche dans l’interface AFTER la scène que tu viens d’écrire. Après chaque réponse narrative au joueur, appelle cet outil avec la nouvelle scène, les dialogues, l’objectif, les ressources et les choix.",
      inputSchema: {
        headline: z.string().describe("Titre court de la scène actuelle."),
        timeLabel: z.string().describe("Repère temporel et/ou lieu, par ex. JEUDI · 03:12 · GYMNASE."),
        narration: z.string().describe("Narration principale de la nouvelle scène."),
        dialogue: z
          .array(
            z.object({
              speaker: z.enum(["lea", "maya", "elise", "player"]),
              text: z.string(),
            })
          )
          .max(6)
          .describe("Répliques utiles de la scène, dans l’ordre."),
        choices: z.array(z.string()).min(2).max(4).describe("2 à 4 actions proposées au joueur."),
        objective: z.string().describe("Objectif concret actuel du groupe."),
        waterDays: z.number().int().min(0).max(20),
        foodDays: z.number().int().min(0).max(20),
        batteryPercent: z.number().int().min(0).max(100),
        sceneSummary: z
          .string()
          .describe("Résumé compact des faits persistants importants pour les prochains tours."),
        chapter: z.string().optional().describe("Numéro de chapitre, ex. CHAPITRE 01."),
        chapterTitle: z.string().optional().describe("Titre du chapitre, ex. LE CENTRE."),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: widgetMeta,
    },
    async ({
      headline,
      timeLabel,
      narration,
      dialogue,
      choices,
      objective,
      waterDays,
      foodDays,
      batteryPercent,
      sceneSummary,
      chapter,
      chapterTitle,
    }) => {
      const state = {
        mode: "after_story",
        chapter: chapter || "CHAPITRE 01",
        chapterTitle: chapterTitle || "LE CENTRE",
        timeLabel,
        headline,
        objective,
        resources: { waterDays, foodDays, batteryPercent },
        narration,
        dialogue,
        choices,
        sceneSummary,
      };
      return {
        content: [
          {
            type: "text",
            text:
              "Scène affichée. Continue à respecter la bible de AFTER et attends l’action du joueur.",
          },
        ],
        structuredContent: state,
        _meta: widgetMeta,
      };
    }
  );
});

export { handler as GET, handler as POST, handler as DELETE };
