const {
  createDefaultState,
  migrateState,
  validateCanonicalState,
} = require('../server/state-schema');

const DATABASE_NAME = 'fantasy-story';
const STORE_NAME = 'game-state';
const STATE_KEY = 'canonical';

class BrowserCharacterStore {
  static async create() {
    const database = await openDatabase();
    const raw = await readState(database);
    const state = raw ? migrateState(raw) : createDefaultState();
    validateCanonicalState(state);
    const store = new BrowserCharacterStore(database, state);
    if (!raw || raw.schemaVersion !== state.schemaVersion) await store.persist();
    return store;
  }

  constructor(database, state) {
    this.database = database;
    this.state = structuredClone(state);
    this.pending = Promise.resolve();
  }

  read() {
    validateCanonicalState(this.state);
    return structuredClone(this.state);
  }

  transaction(mutator) {
    const current = this.read();
    const draft = structuredClone(current);
    const proposed = mutator(draft) || draft;
    proposed.revision = current.revision + 1;
    proposed.updatedAt = new Date().toISOString();
    validateCanonicalState(proposed);
    this.state = structuredClone(proposed);
    this.pending = this.persist();
    return structuredClone(proposed);
  }

  updateProfile(profile) {
    return this.transaction((draft) => {
      if (typeof profile.name === 'string' && profile.name.trim()) draft.character.identity.name = profile.name.trim();
      if (typeof profile.occupation === 'string' && profile.occupation.trim()) draft.character.identity.occupation = profile.occupation.trim();
      if (Array.isArray(profile.traits) && profile.traits.length) draft.character.personality.traits = profile.traits.map((item) => String(item).trim()).filter(Boolean).slice(0, 12);
      for (const key of ['location', 'time', 'outfit', 'mood']) {
        if (typeof profile[key] === 'string' && profile[key].trim()) draft.character.scene[key] = profile[key].trim();
      }
      return draft;
    });
  }

  persist() {
    const snapshot = structuredClone(this.state);
    return new Promise((resolve, reject) => {
      const transaction = this.database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(snapshot, STATE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('La sauvegarde mobile a échoué.'));
      transaction.onabort = () => reject(transaction.error || new Error('La sauvegarde mobile a été interrompue.'));
    });
  }

  async flush() {
    await this.pending;
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB est indisponible.'));
  });
}

function readState(database) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(STATE_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error('La sauvegarde mobile est illisible.'));
  });
}

module.exports = { BrowserCharacterStore };
