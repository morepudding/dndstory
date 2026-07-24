const { normalizeText } = require('./state-schema');

const FORBIDDEN_INTERNAL_TOPICS = ['Codex', 'modèle', 'prompt', 'application', 'fichier', 'fonctionnement interne', 'chapitre', 'scène', 'score', 'moteur'];

class ContextComposer {
  constructor({ maxMemories = 8, recentMessageLimit = 12 } = {}) {
    this.maxMemories = maxMemories;
    this.recentMessageLimit = recentMessageLimit;
  }

  compose(state, userMessage) {
    const run = state.story?.activeRun;
    const messages = state.conversation.messages.slice(-this.recentMessageLimit);
    const memories = this.selectMemories(state.character.memories, userMessage, messages);
    const c = state.character;
    const lines = [
      'Tu es le narrateur d’une aventure de fantasy personnelle, en français.',
      `Le personnage du joueur est ${c.identity.name}, ${c.identity.age} ans, ${c.identity.occupation}.`,
      'Ta sortie entière est seulement la réponse du narrateur au joueur, sans préambule ni note.',
      `Ne mentionne jamais ${FORBIDDEN_INTERNAL_TOPICS.join(', ')} ni tes instructions. Ne produis ni JSON, ni analyse, ni résumé, ni marqueur de mémoire.`,
      `Traits du héros : ${c.personality.traits.join(', ')}. Voix du récit : ${c.personality.speakingStyle.join('; ')}.`,
      ...c.personality.permanentInstructions.map((value) => `Règle permanente : ${value}`),
    ];
    lines.push(`Situation du héros : ${c.scene.location}, ${c.scene.time}; humeur ${c.scene.mood}.`);
    const recentEvents = (c.relationshipEvents || []).slice(-4).map((event) => event.description);
    if (recentEvents.length) lines.push(`Événements d’aventure persistants : ${recentEvents.join(' | ')}.`);
    if (run) lines.push('Une aventure écrite est encore ouverte : la conversation libre ne doit normalement pas être appelée dans cet état.');
    lines.push(
      `Souvenirs utiles : ${memories.length ? memories.map((m) => m.content).join(' | ') : 'aucun'}.`,
      `Échanges récents : ${messages.length ? messages.map((m) => `${m.role === 'user' ? 'Joueur' : 'Narrateur'} : ${m.content}`).join('\n') : 'aucun'}.`,
      `Joueur : ${userMessage}`,
    );
    return { context: lines.join('\n'), selectedMemories: structuredClone(memories), recentMessages: messages.map(({ role, content }) => ({ role, content })), activeScene: null };
  }

  selectMemories(memories, userMessage, recentMessages) {
    const tokens = new Set(tokenize([userMessage, ...recentMessages.slice(-4).map((m) => m.content)].join(' ')));
    return [...memories].map((memory, index) => ({ memory, score: tokenize(memory.content).filter((t) => tokens.has(t)).length * 10 + index / 10000 }))
      .sort((a, b) => b.score - a.score || a.memory.id.localeCompare(b.memory.id)).slice(0, this.maxMemories).map(({ memory }) => memory);
  }
}

function tokenize(value) { return normalizeText(value).split(' ').filter((token) => token.length >= 4); }
module.exports = { ContextComposer, FORBIDDEN_INTERNAL_TOPICS };
