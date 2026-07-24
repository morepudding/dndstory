const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createDefaultState, migrateState, validateCanonicalState } = require('./state-schema');

class CharacterStore {
  constructor(file, options = {}) {
    this.file = path.resolve(file);
    this.backupFile = `${this.file}.bak`;
    this.fs = options.fs || fs;
    this.ensure();
  }

  ensure() {
    this.fs.mkdirSync(path.dirname(this.file), { recursive: true });
    if (!this.fs.existsSync(this.file)) {
      if (this.fs.existsSync(this.backupFile)) {
        const backup = this.readFile(this.backupFile);
        validateCanonicalState(backup);
        this.atomicWrite(backup, { preserveBackup: false });
      } else {
        this.atomicWrite(createDefaultState(), { preserveBackup: false });
      }
      return;
    }
    const raw = this.readFile(this.file);
    const migrated = migrateState(raw);
    validateCanonicalState(migrated);
    if (raw.schemaVersion !== migrated.schemaVersion) {
      this.atomicWrite(migrated, { preserveBackup: false });
      this.fs.copyFileSync(this.file, this.backupFile);
      validateCanonicalState(this.readFile(this.backupFile));
    }
  }

  read() {
    try {
      const state = this.readFile(this.file);
      validateCanonicalState(state);
      return structuredClone(state);
    } catch (error) {
      if (!this.fs.existsSync(this.backupFile)) throw error;
      const backup = this.readFile(this.backupFile);
      validateCanonicalState(backup);
      this.atomicWrite(backup, { preserveBackup: false });
      return structuredClone(backup);
    }
  }

  transaction(mutator) {
    const current = this.read();
    const draft = structuredClone(current);
    const proposed = mutator(draft) || draft;
    proposed.revision = current.revision + 1;
    proposed.updatedAt = new Date().toISOString();
    validateCanonicalState(proposed);
    this.atomicWrite(proposed);
    return structuredClone(proposed);
  }

  updateProfile(profile) {
    return this.transaction((draft) => {
      if (typeof profile.name === 'string' && profile.name.trim()) draft.character.identity.name = profile.name.trim();
      if (typeof profile.occupation === 'string' && profile.occupation.trim()) draft.character.identity.occupation = profile.occupation.trim();
      if (Array.isArray(profile.traits) && profile.traits.length) draft.character.personality.traits = profile.traits.map((x) => String(x).trim()).filter(Boolean).slice(0, 12);
      for (const key of ['location', 'time', 'outfit', 'mood']) if (typeof profile[key] === 'string' && profile[key].trim()) draft.character.scene[key] = profile[key].trim();
      return draft;
    });
  }

  atomicWrite(value, { preserveBackup = true } = {}) {
    validateCanonicalState(value);
    const dir = path.dirname(this.file);
    const token = `${process.pid}-${crypto.randomUUID()}`;
    const temp = path.join(dir, `.${path.basename(this.file)}.${token}.tmp`);
    const backupTemp = `${this.backupFile}.${token}.tmp`;
    let fd;
    try {
      const serialized = `${JSON.stringify(value, null, 2)}\n`;
      fd = this.fs.openSync(temp, 'wx');
      this.fs.writeFileSync(fd, serialized, 'utf8');
      this.fs.fsyncSync(fd);
      this.fs.closeSync(fd); fd = undefined;
      validateCanonicalState(this.readFile(temp));

      if (preserveBackup && this.fs.existsSync(this.file)) {
        const previous = this.readFile(this.file);
        validateCanonicalState(previous);
        this.fs.copyFileSync(this.file, backupTemp);
        validateCanonicalState(this.readFile(backupTemp));
        if (this.fs.existsSync(this.backupFile)) this.fs.rmSync(this.backupFile);
        this.fs.renameSync(backupTemp, this.backupFile);
      }

      if (this.fs.existsSync(this.file)) this.fs.rmSync(this.file);
      this.fs.renameSync(temp, this.file);
      this.fsyncDirectory(dir);
    } finally {
      if (fd !== undefined) this.fs.closeSync(fd);
      for (const leftover of [temp, backupTemp]) if (this.fs.existsSync(leftover)) this.fs.rmSync(leftover);
    }
    return value;
  }

  readFile(file) { return JSON.parse(this.fs.readFileSync(file, 'utf8')); }
  fsyncDirectory(dir) {
    try { const fd = this.fs.openSync(dir, 'r'); this.fs.fsyncSync(fd); this.fs.closeSync(fd); } catch { /* Windows peut refuser fsync sur un dossier. */ }
  }
}

module.exports = { CharacterStore };
