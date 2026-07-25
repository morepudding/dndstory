const { hydrateStoryCardSets } = require('./card-catalog');

function normalizeStory(source) {
  if (source?.format === 'branching-book') return hydrateStoryCardSets(source);
  if (!Array.isArray(source?.nodes) || !Array.isArray(source?.acts) || !Array.isArray(source?.endings)) {
    throw new Error('Format de scénario inconnu.');
  }
  const endingById = new Map(source.endings.map((ending) => [ending.id, ending]));
  return hydrateStoryCardSets({
    schemaVersion: 4,
    format: 'branching-book',
    status: 'approved',
    id: source.id,
    title: source.title,
    globalPremise: source.premise,
    chapterSummary: source.premise,
    showChapterSummary: source.presentation?.showChapterSummary !== false,
    rating: '18+',
    participantsAllAdults: true,
    contentWarnings: ['violence de fantasy', 'mort possible du personnage'],
    designRules: source.designNotes?.principles || [],
    entryNodeId: source.entryNodeId,
    acts: source.acts.map((act) => ({
      id: act.id,
      index: act.index,
      title: act.title,
      entryNodeId: act.entryNodeId,
      summary: act.movement,
    })),
    nodes: source.nodes.map((node) => {
      const ending = node.endingId ? endingById.get(node.endingId) : null;
      const common = {
        id: node.id,
        actId: node.actId,
        kind: ending?.kind || 'choice',
        title: node.title,
        text: node.sceneText,
        role: node.role || 'strategic',
        humanStake: node.humanStake,
        relationalMovement: node.relationalMovement,
      };
      if (ending) {
        return {
          ...common,
          choices: [],
          terminal: {
            endingId: ending.id,
            reason: ending.cause || ending.category,
            outcomeSummary: `${ending.resolution} ${ending.cost}`,
            ...(ending.kind === 'failure' ? { retryActId: ending.retryActId || node.actId } : {}),
          },
        };
      }
      return {
        ...common,
        choices: node.choices.map((choice) => ({
          id: choice.id,
          role: choice.role || 'strategic',
          label: choice.label,
          playerText: choice.playerText,
          targetNodeId: choice.targetNodeId,
        })),
      };
    }),
  });
}

module.exports = { normalizeStory };
