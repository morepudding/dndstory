const { spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const FORBIDDEN_VISIBLE_PATTERNS = [
  /\[\[\s*memory\s*:/i, /```/, /^\s*[\[{]\s*"/,
  /\bcodex\b/i, /\bmodèle de langage\b/i, /\bprompt\b/i, /\bapplication\b/i,
  /\bfichier(?:s)?\b/i, /\bfonctionnement interne\b/i, /\bplan de travail\b/i,
  /\bvoici (?:le|un) plan\b/i, /\bmon raisonnement\b/i, /\ben tant qu['’]assistant/i,
  /\bchapitre\b/i, /\bscore\b/i, /\bmoteur narratif\b/i,
];

class CodexClient {
  constructor({ cwd }) {
    this.cwd = path.resolve(cwd);
    fs.mkdirSync(this.cwd, { recursive: true });
    this.proc = null;
    this.pending = new Map();
    this.activeTurns = new Map();
    this.loadedThreads = new Set();
    this.nextId = 1;
    this.ready = null;
    this.conversationThreadId = null;
    this.lastCheckpointThreadId = null;
    this.checkpointModelId = null;
  }

  status() {
    return { connected: Boolean(this.proc && !this.proc.killed), conversationThreadId: this.conversationThreadId, checkpointThreadId: this.lastCheckpointThreadId, checkpointModelId: this.checkpointModelId };
  }

  async connect() {
    if (this.ready) return this.ready;
    this.ready = new Promise((resolve, reject) => {
      const command = this.codexCommand();
      const hardening = [
        '-c', 'approval_policy="never"',
        '-c', 'features.shell_tool=false',
        '-c', 'features.unified_exec=false',
        '-c', 'features.multi_agent=false',
        '-c', 'features.apps=false',
        '-c', 'web_search="disabled"',
        '-c', 'mcp_servers={}',
        ...this.disabledMcpOverrides(),
      ];
      this.proc = spawn(command.file, [...command.args, 'app-server', ...hardening], { cwd: this.cwd, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
      this.proc.once('error', (error) => { this.ready = null; reject(error); });
      this.proc.once('exit', (code) => {
        const error = new Error(`Codex App Server s’est arrêté avec le code ${code}.`);
        for (const pending of this.pending.values()) pending.reject(error);
        this.pending.clear();
        for (const active of this.activeTurns.values()) active.reject(error);
        this.activeTurns.clear();
        this.ready = null; this.loadedThreads.clear();
        reject(error);
      });
      this.proc.stderr.on('data', (chunk) => console.error(`[fantasy-story app-server] ${chunk}`));
      readline.createInterface({ input: this.proc.stdout }).on('line', (line) => this.handle(line));
      this.request('initialize', { clientInfo: { name: 'fantasy-story', title: 'Fantasy Story', version: '0.2.0' } })
        .then(() => { this.notify('initialized', {}); resolve(); })
        .catch((error) => { this.ready = null; reject(error); });
    });
    return this.ready;
  }

  codexCommand() {
    if (process.env.CANDY_CODEX_PATH) return { file: process.env.CANDY_CODEX_PATH, args: [] };
    if (process.platform !== 'win32') return { file: 'codex', args: [] };
    const cliScript = path.join(process.env.APPDATA || '', 'npm', 'node_modules', '@openai', 'codex', 'bin', 'codex.js');
    if (fs.existsSync(cliScript)) return { file: process.execPath, args: [cliScript] };
    return { file: 'codex.cmd', args: [] };
  }

  disabledMcpOverrides() {
    const codexHome = process.env.CODEX_HOME || path.join(process.env.USERPROFILE || process.env.HOME || '', '.codex');
    const configFile = path.join(codexHome, 'config.toml');
    if (!fs.existsSync(configFile)) return [];
    const names = new Set();
    for (const line of fs.readFileSync(configFile, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*\[mcp_servers\.(?:"([^"]+)"|([^\.\]\s]+))(?:\.|\])/);
      const name = match?.[1] || match?.[2];
      if (name) names.add(name);
    }
    return [...names].sort().flatMap((name) => {
      const key = /^[A-Za-z0-9_-]+$/.test(name) ? name : JSON.stringify(name);
      return ['-c', `mcp_servers.${key}.enabled=false`];
    });
  }

  handle(line) {
    let message;
    try { message = JSON.parse(line); } catch { return; }
    if (message.id !== undefined && this.pending.has(message.id)) {
      const pending = this.pending.get(message.id); this.pending.delete(message.id);
      message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result);
      return;
    }
    const threadId = message.params?.threadId;
    const active = threadId ? this.activeTurns.get(threadId) : null;
    if (message.method === 'item/agentMessage/delta' && active) {
      const delta = message.params?.delta || '';
      active.text += delta;
      active.onDelta(delta);
    }
    if (message.method === 'item/completed' && active && message.params?.item?.type === 'agentMessage' && !active.text) {
      active.text = message.params.item.text || '';
    }
    if (message.method === 'turn/completed') {
      const target = active || [...this.activeTurns.values()].find((entry) => entry.turnId && entry.turnId === message.params?.turn?.id);
      if (target) {
        this.activeTurns.delete(target.threadId);
        const status = message.params?.turn?.status;
        const detail = message.params?.turn?.error?.message || message.params?.turn?.error || '';
        status === 'completed' ? target.resolve({ text: target.text.trim(), threadId: target.threadId }) : target.reject(new Error(`Tour Codex terminé avec le statut ${status || 'inconnu'}${detail ? ` : ${detail}` : ''}.`));
      }
    }
  }

  request(method, params) {
    if (!this.proc?.stdin?.writable) return Promise.reject(new Error('Codex App Server indisponible.'));
    const id = this.nextId++;
    const promise = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.proc.stdin.write(`${JSON.stringify({ method, id, params })}\n`);
    return promise;
  }
  notify(method, params) { this.proc.stdin.write(`${JSON.stringify({ method, params })}\n`); }

  restrictedSettings() {
    return { cwd: this.cwd, approvalPolicy: 'never', sandboxPolicy: { type: 'readOnly', networkAccess: false }, personality: 'none', summary: 'none' };
  }

  async startThread() {
    const result = await this.request('thread/start', this.restrictedSettings());
    this.loadedThreads.add(result.thread.id);
    return result.thread.id;
  }

  async ensureConversationThread(savedThreadId) {
    await this.connect();
    if (!savedThreadId) {
      const threadId = await this.startThread();
      this.conversationThreadId = threadId;
      return { threadId, recovery: null };
    }
    if (this.loadedThreads.has(savedThreadId)) {
      this.conversationThreadId = savedThreadId;
      return { threadId: savedThreadId, recovery: null };
    }
    try {
      await this.request('thread/resume', { threadId: savedThreadId, ...this.restrictedSettings() });
      this.loadedThreads.add(savedThreadId);
      this.conversationThreadId = savedThreadId;
      return { threadId: savedThreadId, recovery: null };
    } catch (error) {
      const threadId = await this.startThread();
      this.conversationThreadId = threadId;
      return { threadId, recovery: { type: 'conversation_thread_recreated', previousThreadId: savedThreadId, newThreadId: threadId, reason: error.message, at: new Date().toISOString() } };
    }
  }

  async runConversationTurn({ threadId, input, onDelta }) {
    return this.runTurn({ threadId, input, onDelta, outputSchema: undefined, effort: 'medium', timeoutMs: 120000 });
  }

  async discoverCheckpointModel() {
    if (this.checkpointModelId) return this.checkpointModelId;
    await this.connect();
    const result = await this.request('model/list', { includeHidden: false });
    const models = result.data || result.models || result.items || [];
    if (!models.length) throw new Error('Aucun modèle disponible pour le checkpoint.');
    const scored = models.map((model) => {
      const id = model.id || model.model;
      const haystack = `${id || ''} ${model.displayName || ''} ${model.description || ''}`.toLowerCase();
      let score = 0;
      if (/mini/.test(haystack)) score += 35;
      else if (/small|light|cost-efficient/.test(haystack)) score += 25;
      else if (/fast/.test(haystack)) score += 20;
      else if (/spark|luna/.test(haystack)) score += 10;
      if (model.supportedReasoningEfforts?.includes('low')) score += 5;
      return { id, score };
    }).filter((item) => item.id).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    this.checkpointModelId = scored[0].id;
    return this.checkpointModelId;
  }

  async runCheckpointTurn({ input, outputSchema }) {
    await this.connect();
    const model = await this.discoverCheckpointModel();
    const threadId = await this.startThread();
    this.lastCheckpointThreadId = threadId;
    return this.runTurn({ threadId, input, outputSchema, onDelta: () => {}, effort: 'low', timeoutMs: 60000, model });
  }

  async runStudioTurn({ input, outputSchema }) {
    await this.connect();
    const threadId = await this.startThread();
    return this.runTurn({ threadId, input, outputSchema, onDelta: () => {}, effort: 'medium', timeoutMs: 120000 });
  }

  async runTurn({ threadId, input, outputSchema, onDelta, effort, timeoutMs, model }) {
    if (this.activeTurns.has(threadId)) throw new Error('Un tour est déjà actif sur ce thread.');
    let setTurnId;
    const completion = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const active = this.activeTurns.get(threadId);
        this.activeTurns.delete(threadId);
        if (active?.turnId) this.request('turn/interrupt', { threadId, turnId: active.turnId }).catch(() => {});
        reject(new Error(`Le tour Codex a dépassé ${timeoutMs} ms.`));
      }, timeoutMs);
      const active = { threadId, turnId: null, text: '', onDelta, resolve: (value) => { clearTimeout(timer); resolve(value); }, reject: (error) => { clearTimeout(timer); reject(error); } };
      setTurnId = (turnId) => { active.turnId = turnId; };
      this.activeTurns.set(threadId, active);
    });
    try {
      const params = { threadId, input: [{ type: 'text', text: input }], ...this.restrictedSettings() };
      if (effort) params.effort = effort;
      if (model) params.model = model;
      if (outputSchema) params.outputSchema = outputSchema;
      const started = await this.request('turn/start', params);
      setTurnId(started.turn.id);
    } catch (error) {
      this.activeTurns.delete(threadId);
      throw error;
    }
    return completion;
  }

  close() { if (this.proc && !this.proc.killed) this.proc.kill(); }
}

function cleanVisibleResponse(text) {
  const value = String(text || '').trim();
  if (!value || FORBIDDEN_VISIBLE_PATTERNS.some((pattern) => pattern.test(value))) return { valid: false, text: 'Je t’écoute. Dis-moi ce que tu voulais vraiment me dire.' };
  return { valid: true, text: value };
}

function parseLastJsonObject(text, requiredKeys = []) {
  const source = String(text || ''); const candidates = []; let start = -1; let depth = 0; let quoted = false; let escaped = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) { if (escaped) escaped = false; else if (character === '\\') escaped = true; else if (character === '"') quoted = false; continue; }
    if (character === '"') { quoted = true; continue; }
    if (character === '{') { if (depth === 0) start = index; depth += 1; }
    else if (character === '}' && depth > 0) { depth -= 1; if (depth === 0 && start >= 0) { candidates.push(source.slice(start, index + 1)); start = -1; } }
  }
  for (const candidate of candidates.reverse()) {
    try { const value = JSON.parse(candidate); if (requiredKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key))) return value; } catch { /* essayer le candidat précédent */ }
  }
  throw new Error('La réponse structurée de l’assistant Atelier est invalide.');
}

module.exports = { CodexClient, FORBIDDEN_VISIBLE_PATTERNS, cleanVisibleResponse, parseLastJsonObject };
