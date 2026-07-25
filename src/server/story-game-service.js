const { BookSessionService } = require('./book-session-service');
const { meetsChoiceRequirements } = require('./narrative-tree');
const { ProgressionService } = require('./progression-service');

class StoryGameService {
  constructor({ store, storyRepository, diagnostics = null }) {
    Object.assign(this, { store, storyRepository, diagnostics });
    this.book = new BookSessionService({ store, storyRepository, diagnostics });
    this.progression = new ProgressionService({ store });
  }

  readStory() {
    const progression = this.progression.read();
    const view = this.book.read();
    const story = view
      ? this.storyRepository.get(view.id)
      : this.storyRepository.select(progression);
    if (!view) {
      return {
        active: false,
        status: 'idle',
        storyId: story.id,
        title: story.title,
        chapterSummary: story.showChapterSummary === false ? '' : story.chapterSummary,
        hero: heroFromProgression(story.hero, progression),
        progression,
        choices: [],
        requiresAdultConfirmation: false,
      };
    }
    const nextStory = view.status === 'success'
      ? this.storyRepository.next(view.id, progression)
      : null;
    const storedStory = this.store.read().story;
    return {
      active: true,
      storyId: view.id,
      title: view.title,
      chapterSummary: view.chapterSummary,
      rating: view.rating,
      hero: structuredClone(view.hero),
      progression,
      arcaneCharges: view.arcaneCharges,
      sourceEndingId: storedStory.activeRun?.sourceEndingId || null,
      cageOutcome: storedStory.cageOutcome,
      thirdLevelOutcome: storedStory.thirdLevelOutcome,
      act: { id: view.act.id, index: view.act.index, title: view.act.title },
      node: { id: view.node.id, kind: view.node.kind, title: view.node.title, text: view.node.text },
      status: view.status,
      terminal: view.terminal,
      inCombat: view.inCombat,
      combat: structuredClone(view.combat),
      ending: structuredClone(view.ending),
      choices: view.status === 'active' && view.node.kind === 'choice'
        ? view.node.choices.map((choice, index) => ({
          id: choice.id,
          number: index + 1,
          label: choice.label,
          playerText: choice.playerText,
          requirements: structuredClone(choice.requirements || []),
          transaction: structuredClone(choice.transaction || null),
          arcaneChargeCost: choice.arcaneChargeCost || 0,
          available: meetsChoiceRequirements(choice, view.hero.stats, progression, view),
        }))
        : [],
      combatItems: combatItemsFor(view, progression),
      canRetryAct: view.status === 'failure',
      canRestart: true,
      canContinueAdventure: Boolean(nextStory),
      canContinueFreeChat: Boolean(
        view.status === 'success'
        && progression.unspentStatPoints === 0
        && !nextStory
      ),
      continueLabel: nextStory
        ? nextStory.continueLabel || `Poursuivre vers ${nextStory.title}`
        : 'Revenir à l’accueil',
      canResolveLevelUp: progression.unspentStatPoints > 0,
      pathLength: view.historyLength,
      requiresAdultConfirmation: false,
    };
  }

  startStory(storyId = null, { sourceEndingId = null } = {}) {
    const progression = this.progression.read();
    const story = storyId
      ? this.storyRepository.get(storyId)
      : this.storyRepository.select(progression);
    if (story.rating === '18+' && !this.store.read().contentConsent.adultConfirmedAt) {
      return {
        active: false,
        status: 'age-gate',
        storyId: story.id,
        title: story.title,
        choices: [],
        requiresAdultConfirmation: true,
        rating: story.rating,
        warnings: story.contentWarnings,
        participantsAllAdults: story.participantsAllAdults,
      };
    }
    const transition = this.book.start(story.id, { sourceEndingId });
    return { ...this.readStory(), opening: transition.opening };
  }

  restartStory() {
    this.assertProgressionResolved();
    const run = this.store.read().story.activeRun;
    return this.startStory(run?.storyId || null, { sourceEndingId: run?.sourceEndingId || null });
  }

  allocateProgressionStat(stat) {
    const progression = this.progression.allocateStat(stat);
    return { progression, story: this.readStory() };
  }

  chooseStoryOption(choiceId) {
    const transition = this.book.choose(choiceId);
    return {
      playerText: transition.choice.playerText,
      text: transition.view.node.text,
      story: this.readStory(),
    };
  }

  playCombatCard(cardId) {
    const transition = this.book.playCard(cardId);
    return { outcome: transition.outcome, story: this.readStory() };
  }

  passCombatReaction() {
    const transition = this.book.passReaction();
    return { outcome: transition.outcome, story: this.readStory() };
  }

  endCombatTurn() {
    const transition = this.book.endCombatTurn();
    return { outcome: null, story: this.readStory() };
  }

  useCombatItem(itemId) {
    const transition = this.book.useCombatItem(itemId);
    return { outcome: transition.outcome, healed: transition.healed, story: this.readStory() };
  }

  retryStoryAct() {
    const transition = this.book.retryAct();
    return { ...this.readStory(), opening: transition.view.node.text };
  }

  confirmAdultAccess() {
    this.store.transaction((draft) => {
      draft.contentConsent.adultConfirmedAt = new Date().toISOString();
      return draft;
    });
    return { confirmed: true };
  }

  revokeAdultAccess() {
    this.store.transaction((draft) => {
      draft.contentConsent.adultConfirmedAt = null;
      draft.story.activeRun = null;
      return draft;
    });
    return { confirmed: false };
  }

  quitStory() {
    this.assertProgressionResolved();
    this.book.quit();
    return this.readStory();
  }

  continueAfterSuccess() {
    const run = this.store.read().story.activeRun;
    if (!run || run.status !== 'success') throw codedError('STORY_CONTINUE_UNAVAILABLE', 'La conversation libre se rouvre après une réussite.');
    this.assertProgressionResolved();
    const nextStory = this.storyRepository.next(run.storyId, this.progression.read());
    if (nextStory) {
      const sourceEndingId = run.ending.endingId;
      this.book.quit();
      return this.startStory(nextStory.id, { sourceEndingId });
    }
    return this.quitStory();
  }

  assertProgressionResolved() {
    if (this.progression.read().unspentStatPoints > 0) {
      throw codedError('PROGRESSION_CHOICE_REQUIRED', 'Attribue ton point de statistique avant de poursuivre.');
    }
  }
}

function heroFromProgression(hero, progression) {
  return {
    ...structuredClone(hero),
    level: progression.level,
    stats: structuredClone(progression.stats),
  };
}

function combatItemsFor(view, progression) {
  if (!view.inCombat || !view.combat) return [];
  const count = progression.inventory?.['healing-potion'] || 0;
  const combat = view.combat;
  return [{
    id: 'healing-potion',
    name: 'Potion de soin',
    timing: 'action',
    family: 'item',
    role: 'recovery',
    count,
    heal: 5,
    actionCost: 1,
    available: count > 0
      && combat.phase === 'player'
      && combat.player.hp < combat.player.maxHp
      && combat.player.actionsPlayed < combat.player.actionLimit,
  }];
}

function codedError(code, text) {
  const error = new Error(text);
  error.code = code;
  return error;
}

module.exports = { StoryGameService };
