const fs = require('fs');
const path = require('path');
const {
  BRUMEPONT_STORY_ID,
  CAGE_STORY_ID,
  STORY_ID,
  STORY_IDS,
  THIRD_LEVEL_STORY_ID,
  StoryCatalog,
} = require('./story-catalog');

class StoryRepository extends StoryCatalog {
  constructor({ contentRoot = path.join(__dirname, '..', '..', 'content', 'chapters') } = {}) {
    const stories = STORY_IDS.filter((storyId) => (
      fs.existsSync(path.join(path.resolve(contentRoot), `${storyId}.json`))
    )).map((storyId) => {
      const file = path.join(path.resolve(contentRoot), `${storyId}.json`);
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    });
    super(stories);
    this.contentRoot = path.resolve(contentRoot);
  }

  file(storyId = STORY_ID) {
    if (!STORY_IDS.includes(storyId)) throw new Error(`Histoire inconnue : ${storyId}.`);
    return path.join(this.contentRoot, `${storyId}.json`);
  }

  invalidate(storyId = null) {
    const ids = storyId ? [storyId] : STORY_IDS;
    for (const id of ids) {
      const file = this.file(id);
      if (!fs.existsSync(file)) {
        if (storyId) throw new Error(`Histoire canonique introuvable : ${file}.`);
        this.cache.delete(id);
        continue;
      }
      const fresh = new StoryCatalog([JSON.parse(fs.readFileSync(file, 'utf8'))]).get(id);
      this.cache.set(id, fresh);
    }
  }
}

module.exports = {
  BRUMEPONT_STORY_ID,
  CAGE_STORY_ID,
  STORY_ID,
  STORY_IDS,
  THIRD_LEVEL_STORY_ID,
  StoryRepository,
};
