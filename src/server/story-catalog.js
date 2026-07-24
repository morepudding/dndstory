const { validateNarrativeTree } = require('./narrative-tree');
const { normalizeStory } = require('./story-format');

const STORY_ID = 'la-route-des-ronces';
const BRUMEPONT_STORY_ID = 'la-nuit-a-brumepont';
const CAGE_STORY_ID = 'la-cage-du-treuil';
const STORY_IDS = [STORY_ID, BRUMEPONT_STORY_ID, CAGE_STORY_ID];

class StoryCatalog {
  constructor(stories) {
    this.cache = new Map();
    for (const source of stories) {
      const story = normalizeStory(source);
      if (!STORY_IDS.includes(story.id)) throw new Error(`Histoire inconnue : ${story.id}.`);
      const report = validateNarrativeTree(story, { publish: true });
      if (!report.accepted) throw new Error(`Livre-jeu invalide : ${report.errors.map((item) => item.message).join('; ')}`);
      this.cache.set(story.id, story);
    }
  }

  get(storyId = STORY_ID) {
    const story = this.cache.get(storyId);
    if (!story) throw new Error(`Histoire canonique introuvable : ${storyId}.`);
    return structuredClone(story);
  }

  select(progression) {
    const unlocked = progression?.claimedRewardIds?.includes('route-des-ronces-premiere-victoire');
    return this.get(unlocked ? BRUMEPONT_STORY_ID : STORY_ID);
  }

  next(storyId, progression) {
    if (
      storyId === STORY_ID
      && progression?.claimedRewardIds?.includes('route-des-ronces-premiere-victoire')
      && progression.unspentStatPoints === 0
    ) {
      return this.get(BRUMEPONT_STORY_ID);
    }
    if (storyId === BRUMEPONT_STORY_ID) return this.get(CAGE_STORY_ID);
    return null;
  }

  all() {
    return STORY_IDS.map((storyId) => this.get(storyId));
  }
}

module.exports = {
  BRUMEPONT_STORY_ID,
  CAGE_STORY_ID,
  STORY_ID,
  STORY_IDS,
  StoryCatalog,
};
