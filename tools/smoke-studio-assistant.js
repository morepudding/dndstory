const fs = require('fs');
const os = require('os');
const path = require('path');
const { CodexClient, parseLastJsonObject } = require('../src/server/codex-client');

(async () => {
  const graph = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content', 'chapters', 'la-route-des-ronces.json'), 'utf8'));
  const client = new CodexClient({ cwd: fs.mkdtempSync(path.join(os.tmpdir(), 'fantasy-story-studio-ai-')) });
  try {
    const result = await client.runStudioTurn({
      input: `Critique en français la distinction des choix de ce nœud, sans modifier de fichier : ${JSON.stringify(graph.nodes[0])}`,
      outputSchema: { type: 'object', additionalProperties: false, required: ['summary'], properties: { summary: { type: 'string' } } },
    });
    console.log(JSON.stringify(parseLastJsonObject(result.text, ['summary']), null, 2));
  } finally { client.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
