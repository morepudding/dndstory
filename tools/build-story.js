const fs = require('fs');
const { validateNarrativeTree } = require('../src/server/narrative-tree');
const { StoryRepository } = require('../src/server/story-repository');

const repository = new StoryRepository();
const outputs = repository.all().map((story) => {
  const report = validateNarrativeTree(story, { publish: true });
  if (!report.accepted) throw new Error(report.errors.map((error) => error.message).join(' '));
  const outputFile = repository.file(story.id);
  fs.writeFileSync(outputFile, `${JSON.stringify(story, null, 2)}\n`, 'utf8');
  return { outputFile, metrics: report.metrics };
});
console.log(JSON.stringify(outputs, null, 2));
