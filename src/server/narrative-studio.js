const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validateNarrativeTree } = require('./narrative-tree');
const { BranchingBookEngine } = require('./branching-book-runtime');
const { STORY_ID } = require('./story-repository');
const { parseLastJsonObject } = require('./codex-client');

class NarrativeStudio {
  constructor({ dataDir, storyRepository, store, codex }) {
    Object.assign(this, { storyRepository, store, codex });
    this.draftDir = path.join(dataDir, 'narrative-studio', 'drafts');
    this.backupDir = path.join(dataDir, 'narrative-studio', 'backups');
    fs.mkdirSync(this.draftDir, { recursive: true });
    fs.mkdirSync(this.backupDir, { recursive: true });
  }

  read() {
    const draft = this.draftFile();
    const graph = fs.existsSync(draft) ? JSON.parse(fs.readFileSync(draft, 'utf8')) : this.storyRepository.get();
    return {
      graph,
      report: validateNarrativeTree(graph),
      source: fs.existsSync(draft) ? 'draft' : 'canonical',
      publishable: true,
    };
  }

  save(graph) {
    const canonical = this.storyRepository.get();
    if (graph?.id !== canonical.id) throw new Error('Le brouillon ne correspond pas au livre canonique.');
    atomicJsonWrite(this.draftFile(), graph);
    return { savedAt: new Date().toISOString(), report: validateNarrativeTree(graph) };
  }

  analyze(graph) {
    return validateNarrativeTree(graph);
  }

  preview({ graph, session = null, command, nodeId = null, choiceId = null, cardId = null }) {
    const engine = new BranchingBookEngine(graph, { validate: false });
    if (command === 'start') {
      const started = engine.start({ runId: `studio-${crypto.randomUUID()}`, at: new Date().toISOString() });
      if (nodeId && nodeId !== started.activeNodeId) {
        const node = engine.nodes.get(nodeId);
        if (!node) throw new Error('Nœud de départ du playtest introuvable.');
        engine.activateNode(started, node, new Date().toISOString());
      }
      return { session: started, view: engine.read(started) };
    }
    if (command === 'choose') return engine.choose(session, choiceId, new Date().toISOString());
    if (command === 'play_card') return engine.playCard(session, cardId, new Date().toISOString());
    if (command === 'end_turn') return engine.endCombatTurn(session, new Date().toISOString());
    if (command === 'pass_reaction') return engine.passReaction(session, new Date().toISOString());
    if (command === 'retry') return engine.retryAct(session);
    throw new Error('Commande de playtest inconnue.');
  }

  publish({ warningsAccepted = false } = {}) {
    const { graph } = this.read();
    const approved = { ...structuredClone(graph), status: 'approved' };
    const report = validateNarrativeTree(approved, { publish: true });
    if (!report.accepted) throw codedError('PUBLISH_BLOCKED', `Publication bloquée : ${report.errors.map((item) => item.message).join(' ')}`);
    if (report.warnings.length && !warningsAccepted) throw codedError('WARNINGS_NOT_ACCEPTED', 'Les avertissements éditoriaux doivent être acceptés explicitement.');
    if (this.store.read().story.activeRun) throw codedError('STORY_IN_USE', 'Cette histoire est actuellement jouée. Quitte la partie avant de la publier.');
    const canonical = this.storyRepository.file();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backup = path.join(this.backupDir, `${STORY_ID}-${stamp}.json`);
    if (fs.existsSync(canonical)) fs.copyFileSync(canonical, backup);
    atomicJsonWrite(canonical, approved);
    atomicJsonWrite(this.draftFile(), approved);
    this.storyRepository.invalidate();
    return { publishedAt: new Date().toISOString(), backup, report };
  }

  async assist({ graph, nodeId = null, operation }) {
    const allowed = new Set(['critique_node', 'critique_graph', 'distinct_choices', 'failure_branch', 'combat_fairness']);
    if (!allowed.has(operation)) throw new Error('Opération d’assistance inconnue.');
    const node = nodeId ? graph.nodes?.find((item) => item.id === nodeId) : null;
    const report = validateNarrativeTree(graph);
    const input = [
      'Tu es consultant narratif. Réponds en français avec une proposition éditoriale seulement. Ne modifie aucun fichier.',
      'L’aventure met en scène un Sorcier. Respecte causalité visible, choix distincts, règles de combat lisibles et fantasy accessible.',
      `Opération : ${operation}.`, `Métriques : ${JSON.stringify(report.metrics)}.`,
      `Nœud ciblé : ${JSON.stringify(node)}.`, `Graphe : ${JSON.stringify(graph)}.`,
      'Retourne un JSON avec summary, rationale, risks et proposedChanges. Chaque changement doit décrire before et after afin que l’auteur décide manuellement.',
    ].join('\n');
    const outputSchema = { type: 'object', additionalProperties: false, required: ['summary', 'rationale', 'risks', 'proposedChanges'], properties: { summary: { type: 'string' }, rationale: { type: 'string' }, risks: { type: 'array', items: { type: 'string' } }, proposedChanges: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['field', 'before', 'after'], properties: { field: { type: 'string' }, before: { type: 'string' }, after: { type: 'string' } } } } } };
    const result = await this.codex.runStudioTurn({ input, outputSchema });
    return parseLastJsonObject(result.text, ['summary', 'rationale', 'risks', 'proposedChanges']);
  }

  draftFile() {
    return path.join(this.draftDir, `${STORY_ID}.json`);
  }
}

function atomicJsonWrite(file, value) {
  const dir = path.dirname(file); fs.mkdirSync(dir, { recursive: true });
  const temp = path.join(dir, `.${path.basename(file)}.${process.pid}-${crypto.randomUUID()}.tmp`);
  let fd;
  try {
    fd = fs.openSync(temp, 'wx'); fs.writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); fs.fsyncSync(fd); fs.closeSync(fd); fd = undefined;
    JSON.parse(fs.readFileSync(temp, 'utf8'));
    try { fs.renameSync(temp, file); } catch (error) { if (!fs.existsSync(file)) throw error; fs.rmSync(file); fs.renameSync(temp, file); }
  } finally { if (fd !== undefined) fs.closeSync(fd); if (fs.existsSync(temp)) fs.rmSync(temp); }
}

function codedError(code, text) { const error = new Error(text); error.code = code; return error; }

module.exports = { NarrativeStudio, atomicJsonWrite };
