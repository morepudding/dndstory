const sorcererCore = require('../../content/cards/sorcier.json');

const CARD_SETS = new Map([
  [sorcererCore.id, sorcererCore],
]);

function hydrateStoryCardSets(source) {
  const story = structuredClone(source);
  for (const node of story.nodes || []) {
    const player = node.combat?.player;
    if (!player?.cardSet) continue;
    const cardSet = CARD_SETS.get(player.cardSet);
    if (!cardSet) throw new Error(`Catalogue de cartes inconnu : ${player.cardSet}.`);
    if (player.cards != null) {
      throw new Error(`Le combat ${node.id} mélange catalogue partagé et définitions locales.`);
    }
    const deckCardIds = new Set(player.deck || []);
    player.cards = cardSet.cards
      .filter((card) => deckCardIds.has(card.id))
      .map((card) => structuredClone(card));
    delete player.cardSet;
  }
  return story;
}

function getCardSet(cardSetId) {
  const cardSet = CARD_SETS.get(cardSetId);
  if (!cardSet) throw new Error(`Catalogue de cartes inconnu : ${cardSetId}.`);
  return structuredClone(cardSet);
}

function dehydrateStoryCardSets(source) {
  const story = structuredClone(source);
  for (const node of story.nodes || []) {
    const player = node.combat?.player;
    if (!Array.isArray(player?.cards)) continue;
    const cardSet = matchingCardSet(player.cards, player.deck);
    if (!cardSet) continue;
    const canonicalById = new Map(cardSet.cards.map((card) => [card.id, card]));
    for (const card of player.cards) {
      if (JSON.stringify(card) !== JSON.stringify(canonicalById.get(card.id))) {
        throw new Error(
          `La carte ${card.id} doit être modifiée dans le catalogue ${cardSet.id}, pas dans une rencontre.`,
        );
      }
    }
    player.cardSet = cardSet.id;
    delete player.cards;
  }
  return story;
}

function matchingCardSet(cards, deck) {
  for (const cardSet of CARD_SETS.values()) {
    const ids = new Set(cardSet.cards.map((card) => card.id));
    if (
      cards.every((card) => ids.has(card.id))
      && (deck || []).every((cardId) => ids.has(cardId))
    ) return cardSet;
  }
  return null;
}

module.exports = { dehydrateStoryCardSets, getCardSet, hydrateStoryCardSets };
