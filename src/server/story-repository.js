const fs = require('fs');
const path = require('path');
const { validateNarrativeTree } = require('./narrative-tree');
const { normalizeStory } = require('./story-format');

const STORY_ID = 'la-route-des-ronces';
const BRUMEPONT_STORY_ID = 'la-nuit-a-brumepont';
const CAGE_STORY_ID = 'la-cage-du-treuil';
const STORY_IDS = [STORY_ID, BRUMEPONT_STORY_ID, CAGE_STORY_ID];

class StoryRepository {
  constructor({ contentRoot = path.join(__dirname, '..', '..', 'content', 'chapters') } = {}) {
    this.contentRoot = path.resolve(contentRoot);
    this.cache = new Map();
  }

  file(storyId = STORY_ID) {
    if (!STORY_IDS.includes(storyId)) throw new Error(`Histoire inconnue : ${storyId}.`);
    return path.join(this.contentRoot, `${storyId}.json`);
  }

  get(storyId = STORY_ID) {
    if (this.cache.has(storyId)) return structuredClone(this.cache.get(storyId));
    const file = this.file(storyId);
    if (!fs.existsSync(file)) throw new Error(`Histoire canonique introuvable : ${file}.`);
    const story = normalizeStory(JSON.parse(fs.readFileSync(file, 'utf8')));
    if (story.id !== storyId) throw new Error(`Le livre canonique doit avoir l’identifiant ${storyId}.`);
    const report = validateNarrativeTree(story, { publish: true });
    if (!report.accepted) throw new Error(`Livre-jeu invalide : ${report.errors.map((item) => item.message).join('; ')}`);
    this.cache.set(storyId, story);
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

  invalidate(storyId = null) {
    if (storyId) this.cache.delete(storyId);
    else this.cache.clear();
  }
}

module.exports = {
  BRUMEPONT_STORY_ID,
  CAGE_STORY_ID,
  STORY_ID,
  STORY_IDS,
  StoryRepository,
};
