const fs = require('fs');
const os = require('os');
const path = require('path');
const { CharacterStore } = require('../src/server/character-store');

function tempStore() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'candy-test-'));
  const file = path.join(dir, 'state.json');
  return { dir, file, store: new CharacterStore(file) };
}

function emptyPatch(overrides = {}) {
  return { relationDelta: null, scenePatch: null, memoryAdds: [], memoryCorrections: [], memoryRemovals: [], relationshipEvents: [], ...overrides };
}

function source(userMessage, assistantResponse) { return { userMessage, assistantResponse }; }

module.exports = { emptyPatch, source, tempStore };
