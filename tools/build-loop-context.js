const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const CONTEXT_DIR = path.join(ROOT, "artifacts", "context");
const STATE_PATH = path.join(CONTEXT_DIR, "loop-context-state.json");
const MAP_PATH = path.join(CONTEXT_DIR, "current-project-map.md");
const SCHEMA_VERSION = 1;
const MAX_CHANGED_PATHS = 16;

const DOMAINS = [
  {
    id: "workflow",
    label: "Règles et boucle",
    matches: (file) =>
      file === "AGENTS.md" ||
      file === "tools/build-loop-context.js" ||
      file.startsWith(".agents/skills/") ||
      file.startsWith("artifacts/loops/"),
    anchors: [
      "AGENTS.md",
      ".agents/skills/conduire-boucle-fantasy-story/SKILL.md",
    ],
    validation: "validateur du skill, puis `git diff --check`",
  },
  {
    id: "story",
    label: "Livre et structure",
    matches: (file) =>
      file.startsWith("content/chapters/") ||
      file.startsWith("content/drafts/") ||
      [
        "src/server/story-format.js",
        "src/server/narrative-tree.js",
        "tools/build-story.js",
        "tools/verify-story.js",
      ].includes(file),
    anchors: [
      "content/chapters/",
      "src/server/story-format.js",
      "src/server/narrative-tree.js",
    ],
    validation: "`npm run verify:story` et tests narratifs ciblés",
  },
  {
    id: "persistence",
    label: "État et sauvegarde",
    matches: (file) =>
      [
        "src/server/state-schema.js",
        "src/server/story-repository.js",
        "src/server/character-store.js",
        "src/server/book-session-service.js",
      ].includes(file),
    anchors: [
      "src/server/state-schema.js",
      "src/server/story-repository.js",
      "src/server/book-session-service.js",
    ],
    validation: "`npm run check` et tests de persistance ciblés",
  },
  {
    id: "engine",
    label: "Moteur",
    matches: (file) =>
      file.startsWith("src/server/") ||
      [
        "tools/play-branching-book.js",
        "tools/simulate-combat.js",
      ].includes(file),
    anchors: [
      "src/server/branching-book-runtime.js",
      "src/server/combat-engine.js",
      "src/server/progression-service.js",
    ],
    validation: "`npm run check` et tests moteur ciblés",
  },
  {
    id: "ui",
    label: "PWA et interface",
    matches: (file) =>
      file.startsWith("src/pwa/") ||
      (file.startsWith("src/renderer/") &&
        !file.startsWith("src/renderer/assets/")),
    anchors: [
      "src/pwa/entry.js",
      "src/pwa/browser-api.js",
      "src/renderer/app.js",
      "src/renderer/styles.css",
    ],
    validation: "`npm run build:pwa`, puis parcours manuel dans la PWA si le rendu ou l'interaction change",
  },
  {
    id: "assets",
    label: "Ressources visuelles",
    matches: (file) =>
      file.startsWith("content/visuals/") ||
      file.startsWith("src/renderer/assets/"),
    anchors: [
      "src/renderer/assets/",
      "content/visuals/",
    ],
    validation: "licences, puis parcours manuel dans la PWA si l'affichage change",
  },
  {
    id: "tests",
    label: "Tests",
    matches: (file) => file.startsWith("test/"),
    anchors: ["test/"],
    validation: "test ciblé du contrat modifié",
  },
  {
    id: "project",
    label: "Configuration et reste du projet",
    matches: () => true,
    anchors: ["package.json", "README.md", ".gitignore"],
    validation: "validation dictée par le domaine concerné",
  },
];

const SKIPPED_DIRECTORIES = new Set([
  ".git",
  ".codex",
  "node_modules",
  "dist",
  "coverage",
]);

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function isGitIgnored(relativePath) {
  try {
    execFileSync(
      "git",
      ["check-ignore", "--quiet", "--", toPosix(relativePath)],
      {
        cwd: ROOT,
        stdio: "ignore",
      },
    );
    return true;
  } catch {
    return false;
  }
}

function shouldSkipDirectory(relativePath, name) {
  if (SKIPPED_DIRECTORIES.has(name)) {
    return true;
  }

  const normalized = toPosix(relativePath);
  if (isGitIgnored(normalized)) {
    return true;
  }

  return (
    normalized === "artifacts/context" ||
    normalized.startsWith("artifacts/context/") ||
    normalized === "artifacts/qa" ||
    normalized.startsWith("artifacts/qa/")
  );
}

function shouldSkipFile(relativePath) {
  const name = path.basename(relativePath);
  return (
    isGitIgnored(relativePath) ||
    name === ".env" ||
    name.startsWith(".env.") ||
    name.endsWith(".pem") ||
    name.endsWith(".key")
  );
}

function listProjectFiles(directory = ROOT, relativeDirectory = "") {
  const files = [];
  const entries = fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name, "en"));

  for (const entry of entries) {
    const relativePath = relativeDirectory
      ? path.join(relativeDirectory, entry.name)
      : entry.name;
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!shouldSkipDirectory(relativePath, entry.name)) {
        files.push(...listProjectFiles(absolutePath, relativePath));
      }
      continue;
    }

    if (entry.isFile() && !shouldSkipFile(relativePath)) {
      files.push(toPosix(relativePath));
    }
  }

  return files;
}

function hashFile(relativePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.join(ROOT, relativePath)))
    .digest("hex");
}

function hashEntries(entries) {
  const hash = crypto.createHash("sha256");
  for (const [relativePath, fileHash] of Object.entries(entries).sort(([a], [b]) =>
    a.localeCompare(b, "en"),
  )) {
    hash.update(relativePath);
    hash.update("\0");
    hash.update(fileHash);
    hash.update("\0");
  }
  return hash.digest("hex");
}

function readGitValue(args, fallback) {
  try {
    return execFileSync("git", args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return fallback;
  }
}

function readGitState() {
  const status = readGitValue(
    ["status", "--short", "--untracked-files=all"],
    "",
  );
  return {
    branch: readGitValue(["branch", "--show-current"], "inconnue"),
    head: readGitValue(["rev-parse", "--short=12", "HEAD"], "sans-commit"),
    dirtyCount: status ? status.split(/\r?\n/u).filter(Boolean).length : 0,
  };
}

function readLoops() {
  const loopsDirectory = path.join(ROOT, "artifacts", "loops");
  if (!fs.existsSync(loopsDirectory)) {
    return [];
  }

  return fs
    .readdirSync(loopsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => {
      const relativePath = toPosix(path.join("artifacts", "loops", entry.name));
      const content = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
      const title = content.match(/^#\s+(.+)$/mu)?.[1] || entry.name;
      const status =
        content.match(/\*\*Statut\s*:\*\*\s*`([^`]+)`/u)?.[1] || "inconnu";
      return { path: relativePath, title, status };
    })
    .sort((left, right) => left.path.localeCompare(right.path, "en"));
}

function selectLoopContext(loops) {
  const terminalStatuses = new Set(["garder", "retirer"]);
  const active =
    [...loops]
      .reverse()
      .find((loop) => !terminalStatuses.has(loop.status.toLowerCase())) ||
    loops.at(-1) ||
    null;
  const lastVerdict =
    [...loops]
      .reverse()
      .find((loop) => terminalStatuses.has(loop.status.toLowerCase())) || null;
  return { active, lastVerdict };
}

function buildState() {
  const domainFiles = Object.fromEntries(
    DOMAINS.map((domain) => [domain.id, {}]),
  );

  for (const relativePath of listProjectFiles()) {
    const domain = DOMAINS.find((candidate) => candidate.matches(relativePath));
    domainFiles[domain.id][relativePath] = hashFile(relativePath);
  }

  const domains = {};
  for (const domain of DOMAINS) {
    const files = domainFiles[domain.id];
    domains[domain.id] = {
      hash: hashEntries(files),
      files,
    };
  }

  const overallEntries = {};
  for (const domain of DOMAINS) {
    overallEntries[domain.id] = domains[domain.id].hash;
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    git: readGitState(),
    overallHash: hashEntries(overallEntries),
    domains,
    loops: readLoops(),
  };
}

function readPreviousState() {
  if (!fs.existsSync(STATE_PATH)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  } catch {
    return null;
  }
}

function compareStates(previous, current) {
  const changedDomains = [];

  for (const domain of DOMAINS) {
    const before = previous.domains?.[domain.id]?.files || {};
    const after = current.domains[domain.id].files;
    const paths = [...new Set([...Object.keys(before), ...Object.keys(after)])]
      .filter((relativePath) => before[relativePath] !== after[relativePath])
      .sort((left, right) => left.localeCompare(right, "en"));

    if (paths.length > 0) {
      changedDomains.push({
        id: domain.id,
        label: domain.label,
        paths,
      });
    }
  }

  return changedDomains;
}

function formatLoop(loop) {
  return loop ? `\`${loop.path}\` — \`${loop.status}\`` : "aucune";
}

function buildMarkdown(state) {
  const { active, lastVerdict } = selectLoopContext(state.loops);
  const lines = [
    "# Carte de reprise de Fantasy Story",
    "",
    "> Générée localement par `npm run context:loop:refresh`. Elle route l'audit ; elle ne remplace ni la vérification ciblée ni le parcours réel dans la PWA.",
    "",
    "## Référence",
    "",
    `- **Empreinte :** \`${state.overallHash.slice(0, 16)}\``,
    `- **Générée :** ${state.generatedAt}`,
    `- **Git informatif :** branche \`${state.git.branch}\`, HEAD \`${state.git.head}\`, ${state.git.dirtyCount} entrée(s) dans le worktree`,
    "- **Comparaison fiable :** les changements sont détectés par le contenu des fichiers, même si le worktree n'est pas commité.",
    `- **Boucle active :** ${formatLoop(active)}`,
    `- **Dernier verdict :** ${formatLoop(lastVerdict)}`,
    "",
    "## Routage",
    "",
    "| Domaine | Empreinte | Fichiers repères | Validation |",
    "| --- | --- | --- | --- |",
  ];

  for (const domain of DOMAINS) {
    const activeAnchors =
      domain.id === "workflow" && active
        ? [...domain.anchors, active.path]
        : domain.anchors;
    const anchors = activeAnchors.map((anchor) => `\`${anchor}\``).join("<br>");
    lines.push(
      `| ${domain.label} | \`${state.domains[domain.id].hash.slice(0, 12)}\` | ${anchors} | ${domain.validation} |`,
    );
  }

  lines.push(
    "",
    "## Démarrage d'une boucle",
    "",
    "1. Exécuter `npm run context:loop`.",
    "2. Si le résultat est `CHAUD`, lire cette carte et la fiche active, puis contrôler l'application ou une capture récente.",
    "3. Si le résultat est `CHAUD CIBLÉ`, inspecter seulement les domaines et fichiers signalés, puis contrôler l'application ou une capture récente.",
    "4. Si le résultat est `FROID`, effectuer l'audit complet prévu par le skill.",
    "5. Après une intégration validée ou un verdict, exécuter `npm run context:loop:refresh`.",
    "",
    "Ne jamais utiliser cette carte pour ignorer une incohérence visible, une migration ambiguë ou un changement structurel non classé.",
    "",
  );

  return lines.join("\n");
}

function writeIfChanged(filePath, content) {
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, "utf8") === content) {
    return false;
  }
  fs.writeFileSync(filePath, content, "utf8");
  return true;
}

function refreshContext(current, previous) {
  const unchanged =
    previous?.schemaVersion === SCHEMA_VERSION &&
    previous.overallHash === current.overallHash;
  current.generatedAt = unchanged
    ? previous.generatedAt
    : new Date().toISOString();

  fs.mkdirSync(CONTEXT_DIR, { recursive: true });
  const stateChanged = writeIfChanged(
    STATE_PATH,
    `${JSON.stringify(current, null, 2)}\n`,
  );
  const mapChanged = writeIfChanged(MAP_PATH, buildMarkdown(current));

  console.log(
    `Contexte de boucle actualisé (${current.overallHash.slice(0, 16)}).`,
  );
  console.log(
    `${Object.values(current.domains).reduce(
      (total, domain) => total + Object.keys(domain.files).length,
      0,
    )} fichier(s) classé(s), ${current.git.dirtyCount} entrée(s) Git informative(s).`,
  );
  console.log(
    stateChanged || mapChanged
      ? "Référence enregistrée dans artifacts/context/."
      : "Référence déjà à jour, aucun fichier réécrit.",
  );
}

function checkContext(current, previous) {
  if (!previous || previous.schemaVersion !== SCHEMA_VERSION) {
    console.log("Contexte de boucle : FROID");
    console.log(
      "Aucune référence compatible. Effectuer l'audit complet, puis lancer `npm run context:loop:refresh`.",
    );
    return;
  }

  const changedDomains = compareStates(previous, current);
  const { active } = selectLoopContext(previous.loops || []);

  if (changedDomains.length === 0) {
    console.log("Contexte de boucle : CHAUD");
    console.log(`Référence : ${previous.overallHash.slice(0, 16)}`);
    console.log(`Boucle active : ${formatLoop(active)}`);
    console.log("Domaines modifiés : aucun");
    console.log("Lire `artifacts/context/current-project-map.md`.");
    return;
  }

  console.log("Contexte de boucle : CHAUD CIBLÉ");
  console.log(`Référence : ${previous.overallHash.slice(0, 16)}`);
  console.log(
    `Domaines modifiés : ${changedDomains
      .map((domain) => `${domain.label} (${domain.paths.length})`)
      .join(", ")}`,
  );

  const changedPaths = changedDomains.flatMap((domain) =>
    domain.paths.map((relativePath) => `${domain.label} : ${relativePath}`),
  );
  console.log("Fichiers à inspecter :");
  for (const changedPath of changedPaths.slice(0, MAX_CHANGED_PATHS)) {
    console.log(`- ${changedPath}`);
  }
  if (changedPaths.length > MAX_CHANGED_PATHS) {
    console.log(`- … ${changedPaths.length - MAX_CHANGED_PATHS} autre(s)`);
  }
  console.log(
    "Lire la carte, inspecter ces changements et passer en audit froid si leur portée est ambiguë.",
  );
}

function main() {
  const mode = process.argv.includes("--refresh") ? "refresh" : "check";
  const previous = readPreviousState();
  const current = buildState();

  if (mode === "refresh") {
    refreshContext(current, previous);
  } else {
    checkContext(current, previous);
  }
}

main();
