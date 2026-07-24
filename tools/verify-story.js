const { validateNarrativeTree } = require('../src/server/narrative-tree');
const { StoryRepository } = require('../src/server/story-repository');

const reports = new StoryRepository().all().map((story) => {
  const report = validateNarrativeTree(story, { publish: true });
  return {
    storyId: story.id,
    accepted: report.accepted,
    errors: report.errors,
    warnings: report.warnings,
    metrics: { ...report.metrics, paths: undefined },
  };
});
console.log(JSON.stringify(reports, null, 2));
if (reports.some((report) => !report.accepted)) process.exitCode = 1;
