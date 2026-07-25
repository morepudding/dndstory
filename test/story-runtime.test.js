const test = require('node:test');
const assert = require('node:assert/strict');
const { ConversationService } = require('../src/server/conversation-service');
const { StoryRepository } = require('../src/server/story-repository');
const { CharacterStore } = require('../src/server/character-store');
const { DevelopmentDiagnostics } = require('../src/server/diagnostics');
const { tempStore } = require('./helpers');

function setup(existing = null) {
  const base = existing || tempStore();
  let modelCalls = 0;
  const gateway = {
    ensureConversationThread: async () => {
      modelCalls += 1;
      return { threadId: 'free' };
    },
    runConversationTurn: async () => {
      modelCalls += 1;
      return { text: 'Le narrateur écoute.' };
    },
  };
  const service = new ConversationService({
    store: base.store,
    gateway,
    diagnostics: new DevelopmentDiagnostics({ enabled: true }),
    storyRepository: new StoryRepository(),
  });
  return { ...base, service, modelCalls: () => modelCalls };
}

function enterCombat(service) {
  service.startStory();
  service.chooseStoryOption('ancrage-etincelle');
  return service.chooseStoryOption('examiner-talus').story;
}

function winCombat(service) {
  for (let guard = 0; guard < 30 && service.readStory().status === 'active'; guard += 1) {
    const combat = service.readStory().combat;
    if (!combat) break;
    if (combat.phase === 'reaction') {
      const slowed = combat.enemy.statuses.some((status) => status.id === 'slowed');
      const reaction = combat.cards.find(
        (card) => card.available && card.effect.status?.id === 'slowed' && !slowed,
      );
      if (reaction) service.playCombatCard(reaction.instanceId);
      else service.passCombatReaction();
      continue;
    }
    const spell = combat.cards.find((card) => card.available && card.family === 'spell');
    const action = spell || combat.cards.find((card) => card.available);
    if (action) service.playCombatCard(action.instanceId);
    else service.endCombatTurn();
  }
  return service.readStory();
}

function fightWithoutMagic(service) {
  for (let guard = 0; guard < 30 && service.readStory().status === 'active'; guard += 1) {
    const combat = service.readStory().combat;
    if (!combat) break;
    if (combat.phase === 'reaction') {
      service.passCombatReaction();
      continue;
    }
    const mundane = combat.cards.find((card) => card.available && card.family !== 'spell');
    if (mundane) service.playCombatCard(mundane.instanceId);
    else service.endCombatTurn();
  }
  return service.readStory();
}

test('les choix verrouillés sont visibles et le serveur refuse de contourner Force 2', () => {
  const context = setup();
  context.service.startStory();
  context.service.chooseStoryOption('ancrage-etincelle');
  const choices = context.service.readStory().choices;
  assert.equal(choices.length, 4);
  assert.equal(choices.find((choice) => choice.id === 'examiner-talus').available, true);
  assert.equal(choices.find((choice) => choice.id === 'sonder-talus').available, true);
  assert.equal(choices.find((choice) => choice.id === 'deplacer-charrette').available, false);
  const before = context.store.read();
  assert.throws(
    () => context.service.chooseStoryOption('deplacer-charrette'),
    (error) => error.code === 'CHOICE_REQUIREMENT_NOT_MET',
  );
  assert.deepEqual(context.store.read(), before);
});

test('la route gagnante est déterministe, persistante et sans appel au modèle', () => {
  const context = setup();
  enterCombat(context.service);
  const result = winCombat(context.service);
  const run = context.store.read().story.activeRun;
  assert.equal(result.status, 'success');
  assert.equal(run.ending.endingId, 'courrier-sauve');
  assert.equal(run.history.at(-1).kind, 'combat');
  assert.equal(run.history.at(-1).outcome, 'victory');
  assert.equal(context.modelCalls(), 0);
  assert.match(context.store.read().character.relationshipEvents.at(-1).description, /courrier/i);
});

test('main, pioche, défausse, PV et phase survivent à une relance complète', () => {
  const first = setup();
  enterCombat(first.service);
  first.service.playCombatCard('braise-occulte:1');
  const expected = first.service.readStory().combat;
  const second = setup({
    dir: first.dir,
    file: first.file,
    store: new CharacterStore(first.file),
  });
  const reopened = second.service.readStory().combat;
  assert.deepEqual(reopened, expected);
  assert.equal(reopened.phase, 'player');
  assert.equal(reopened.player.actionsPlayed, 1);
});

test('refuser toute magie mène à la mort de combat, puis la reprise remet le deck à zéro', () => {
  const context = setup();
  enterCombat(context.service);
  const failed = fightWithoutMagic(context.service);
  assert.equal(failed.status, 'failure');
  assert.equal(failed.ending.endingId, 'mort-au-combat');
  const retry = context.service.retryStoryAct();
  assert.equal(retry.status, 'active');
  assert.equal(retry.node.id, 'depart');
  assert.equal(retry.pathLength, 0);
  assert.equal(context.store.read().character.relationshipEvents.length, 0);
});

test('une carte hors phase est refusée sans aucune mutation', () => {
  const context = setup();
  enterCombat(context.service);
  const before = context.store.read();
  assert.throws(
    () => context.service.playCombatCard('entrave-de-givre:3'),
    (error) => error.code === 'CARD_WRONG_PHASE',
  );
  assert.deepEqual(context.store.read(), before);
});

test('chaque choix narratif persiste le texte exact du joueur puis du narrateur', () => {
  const context = setup();
  context.service.startStory();
  const before = context.store.read();
  const result = context.service.chooseStoryOption('ancrage-silence');
  const after = context.store.read();
  assert.match(result.playerText, /tends l’oreille/);
  assert.deepEqual(after.conversation.messages.slice(-2).map((message) => message.role), ['user', 'assistant']);
  assert.equal(after.conversation.messages.at(-1).content, result.text);
  assert.equal(before.conversation.messages.length + 2, after.conversation.messages.length);
});

test('le texte libre est refusé pendant un choix ou un combat', async () => {
  const context = setup();
  context.service.startStory();
  await assert.rejects(
    context.service.send('Je contourne les choix.'),
    (error) => error.code === 'STORY_CHOICE_REQUIRED',
  );
  context.service.chooseStoryOption('ancrage-etincelle');
  context.service.chooseStoryOption('examiner-talus');
  await assert.rejects(
    context.service.send('Je contourne le combat.'),
    (error) => error.code === 'STORY_CHOICE_REQUIRED',
  );
  assert.equal(context.modelCalls(), 0);
});

test('une partie provenant d’une autre histoire est retirée au prochain démarrage', () => {
  const context = setup();
  context.service.startStory();
  context.store.transaction((draft) => {
    draft.story.activeRun.storyId = 'ancienne-histoire';
    return draft;
  });
  const reopened = setup({
    dir: context.dir,
    file: context.file,
    store: new CharacterStore(context.file),
  });
  assert.equal(reopened.service.readStory().active, false);
  assert.equal(reopened.store.read().story.activeRun, null);
  assert.equal(reopened.store.read().recoveryEvents.at(-1).type, 'story_source_changed');
});

test('après la victoire, les chapitres s’enchaînent jusqu’au troisième palier avant la conversation libre', async () => {
  const context = setup();
  enterCombat(context.service);
  winCombat(context.service);
  context.service.allocateProgressionStat('strength');
  const brumepont = context.service.continueAfterSuccess();
  assert.equal(brumepont.storyId, 'la-nuit-a-brumepont');
  context.service.chooseStoryOption('ancrage-carrier');
  const guided = context.service.chooseStoryOption('payer-guide').story;
  assert.equal(guided.status, 'success');
  const cage = context.service.continueAfterSuccess();
  assert.equal(cage.storyId, 'la-cage-du-treuil');
  context.service.chooseStoryOption('ancrage-treuil');
  context.service.chooseStoryOption('sauver-mira');
  const thirdLevel = context.service.continueAfterSuccess();
  assert.equal(thirdLevel.storyId, 'le-troisieme-palier');
  context.service.chooseStoryOption('ancrage-acces');
  context.service.chooseStoryOption('suivre-air-froid');
  context.service.chooseStoryOption('condamner-passage');
  context.service.continueAfterSuccess();
  const response = await context.service.send('Que raconte la suite ?');
  assert.equal(response.text, 'Le narrateur écoute.');
  assert.equal(context.modelCalls(), 2);
  assert.equal(context.store.read().character.relationshipEvents.length, 4);
});
