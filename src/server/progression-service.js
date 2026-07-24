const { STAT_KEYS } = require('./narrative-tree');
const { randomUUID } = require('./random-id');

const MAX_STAT = 3;

class ProgressionService {
  constructor({ store }) {
    this.store = store;
  }

  read() {
    return structuredClone(this.store.read().character.progression);
  }

  allocateStat(stat) {
    if (!STAT_KEYS.includes(stat)) {
      throw codedError('PROGRESSION_STAT_UNKNOWN', 'Cette statistique n’existe pas.');
    }
    const updated = this.store.transaction((draft) => {
      const progression = draft.character.progression;
      if (progression.unspentStatPoints < 1) {
        throw codedError('PROGRESSION_POINT_UNAVAILABLE', 'Aucun point de statistique n’est disponible.');
      }
      if (progression.stats[stat] >= MAX_STAT) {
        throw codedError('PROGRESSION_STAT_MAX', 'Cette statistique a déjà atteint son maximum.');
      }
      progression.stats[stat] += 1;
      progression.unspentStatPoints -= 1;
      return draft;
    });
    return structuredClone(updated.character.progression);
  }
}

function applyProgressionReward(draft, session) {
  const reward = session?.ending?.reward;
  if (!reward) return { awarded: false, reason: 'no_reward' };
  const progression = draft.character.progression;
  if (progression.claimedRewardIds.includes(reward.id)) {
    return { awarded: false, reason: 'already_claimed' };
  }
  const previousLevel = progression.level;
  progression.level = Math.max(progression.level, reward.level);
  progression.unspentStatPoints += reward.statPoints;
  progression.gold += reward.gold;
  progression.claimedRewardIds.push(reward.id);
  progression.rewardHistory.push({
    id: reward.id,
    title: reward.title,
    storyId: session.storyId,
    endingId: session.ending.endingId,
    previousLevel,
    level: progression.level,
    statPoints: reward.statPoints,
    gold: reward.gold,
    claimedAt: session.completedAt,
  });
  return { awarded: true, reward: structuredClone(reward) };
}

function applyChoiceTransaction(draft, transaction, { storyId, choiceId, purchasedAt }) {
  if (!transaction) return { applied: false, reason: 'no_transaction' };
  const progression = draft.character.progression;
  if (progression.gold < transaction.gold) {
    throw codedError('PROGRESSION_GOLD_INSUFFICIENT', `Il faut ${transaction.gold} or pour cette dépense.`);
  }
  progression.gold -= transaction.gold;
  if (transaction.item) {
    if (!Object.prototype.hasOwnProperty.call(progression.inventory, transaction.item.id)) {
      throw codedError('PROGRESSION_ITEM_UNKNOWN', 'Cet objet ne peut pas être ajouté à l’inventaire.');
    }
    progression.inventory[transaction.item.id] += transaction.item.quantity;
  }
  const entry = {
    id: randomUUID(),
    offerId: transaction.id,
    title: transaction.title,
    gold: transaction.gold,
    storyId,
    choiceId,
    purchasedAt,
    ...(transaction.item ? {
      itemId: transaction.item.id,
      quantity: transaction.item.quantity,
    } : {}),
  };
  progression.transactionHistory.push(entry);
  return { applied: true, transaction: structuredClone(entry) };
}

function consumeInventoryItem(draft, itemId) {
  const progression = draft.character.progression;
  if (!Object.prototype.hasOwnProperty.call(progression.inventory, itemId)) {
    throw codedError('PROGRESSION_ITEM_UNKNOWN', 'Cet objet n’existe pas.');
  }
  if (progression.inventory[itemId] < 1) {
    throw codedError('PROGRESSION_ITEM_UNAVAILABLE', 'Cet objet n’est pas disponible.');
  }
  progression.inventory[itemId] -= 1;
  return progression.inventory[itemId];
}

function codedError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

module.exports = {
  MAX_STAT,
  ProgressionService,
  applyChoiceTransaction,
  applyProgressionReward,
  consumeInventoryItem,
};
