class CombatEngine {
  constructor(config, hero) {
    this.config = structuredClone(config);
    this.hero = structuredClone(hero);
    this.cards = new Map(this.config.player.cards.map((card) => [card.id, card]));
    this.enemyCards = new Map(this.config.enemy.cards.map((card) => [card.id, card]));
  }

  start(nodeId, { spellUses = this.hero.stats.intelligence } = {}) {
    const stats = this.hero.stats;
    const combat = {
      nodeId,
      round: 1,
      phase: 'player',
      player: {
        name: this.config.player.name,
        portrait: this.config.player.portrait || null,
        stats: structuredClone(stats),
        hp: stats.constitution * 5,
        maxHp: stats.constitution * 5,
        spellUses,
        maxSpellUses: stats.intelligence,
        actionLimit: stats.agility,
        actionsPlayed: 0,
        drawCount: stats.wisdom,
        spontaneousMagicAvailable: true,
        statuses: [],
      },
      enemy: {
        name: this.config.enemy.name,
        portrait: this.config.enemy.portrait || null,
        hp: this.config.enemy.maxHp,
        maxHp: this.config.enemy.maxHp,
        drawCount: this.config.enemy.drawCount,
        statuses: [],
        drawPile: this.config.enemy.deck.map((cardId, index) => ({
          instanceId: `enemy:${cardId}:${index + 1}`,
          cardId,
        })),
        hand: [],
        discardPile: [],
      },
      drawPile: this.config.player.deck.map((cardId, index) => ({
        instanceId: `${cardId}:${index + 1}`,
        cardId,
      })),
      hand: [],
      discardPile: [],
      pendingAttack: null,
      log: [{
        round: 1,
        type: 'combat_started',
        text: `${this.config.enemy.name} attaque.`,
      }],
    };
    this.drawForRound(combat);
    return combat;
  }

  playCard(combat, instanceId) {
    this.assertCombat(combat);
    const handIndex = combat.hand.findIndex((instance) => instance.instanceId === instanceId);
    if (handIndex === -1) throw codedError('CARD_UNAVAILABLE', 'Cette carte n’est pas dans votre main.');
    const instance = combat.hand[handIndex];
    const card = this.cards.get(instance.cardId);
    const actionCost = this.assertPlayableCard(combat, card);

    const next = structuredClone(combat);
    const [playedInstance] = next.hand.splice(handIndex, 1);
    next.discardPile.push(playedInstance);
    next.player.spellUses -= card.chargeCost;
    if (card.timing === 'action') return this.resolveActionCard(next, card, actionCost);
    return this.resolveReactionCard(next, card);
  }

  shapeSpell(combat, instanceId, targetCardId) {
    this.assertCombat(combat);
    if (!combat.player.spontaneousMagicAvailable) {
      throw codedError(
        'SPONTANEOUS_MAGIC_SPENT',
        'La Magie spontanée a déjà été utilisée pendant ce combat.',
      );
    }
    const handIndex = combat.hand.findIndex((instance) => instance.instanceId === instanceId);
    if (handIndex === -1) {
      throw codedError('CARD_UNAVAILABLE', 'La carte à façonner n’est pas dans votre main.');
    }
    const sourceInstance = combat.hand[handIndex];
    const sourceCard = this.cards.get(sourceInstance.cardId);
    const targetCard = this.cards.get(targetCardId);
    if (!targetCard || targetCard.family !== 'spell') {
      throw codedError(
        'SPONTANEOUS_MAGIC_TARGET_INVALID',
        'La Magie spontanée doit produire un sort connu du Sorcier.',
      );
    }
    if (targetCard.id === sourceCard.id) {
      throw codedError(
        'SPONTANEOUS_MAGIC_UNCHANGED',
        'Choisissez un sort différent de la carte façonnée.',
      );
    }
    const actionCost = this.assertPlayableCard(combat, targetCard);

    const next = structuredClone(combat);
    const [shapedInstance] = next.hand.splice(handIndex, 1);
    next.discardPile.push(shapedInstance);
    next.player.spontaneousMagicAvailable = false;
    next.player.spellUses -= targetCard.chargeCost;
    next.log.push({
      round: next.round,
      type: 'spontaneous_magic',
      sourceCardId: sourceCard.id,
      targetCardId: targetCard.id,
      text: `Magie spontanée façonne ${sourceCard.name} en ${targetCard.name}.`,
    });
    if (targetCard.timing === 'action') {
      return this.resolveActionCard(next, targetCard, actionCost);
    }
    return this.resolveReactionCard(next, targetCard);
  }

  endTurn(combat) {
    this.assertCombat(combat);
    if (combat.phase !== 'player') {
      throw codedError('END_TURN_UNAVAILABLE', 'Le tour du Sorcier est déjà terminé.');
    }
    const next = structuredClone(combat);
    next.log.push({
      round: next.round,
      type: 'turn_ended',
      text: 'Le Sorcier termine son tour.',
    });
    const outcome = this.startEnemyTurn(next);
    return { combat: next, outcome };
  }

  useItem(combat, itemId) {
    this.assertCombat(combat);
    if (itemId !== 'healing-potion') throw codedError('COMBAT_ITEM_UNKNOWN', 'Cet objet ne peut pas être utilisé en combat.');
    if (combat.phase !== 'player') throw codedError('COMBAT_ITEM_WRONG_PHASE', 'La potion se boit pendant votre phase d’action.');
    if (combat.player.actionsPlayed >= combat.player.actionLimit) {
      throw codedError('ACTION_LIMIT_REACHED', 'La limite d’Agilité est atteinte pour ce round.');
    }
    if (combat.player.hp >= combat.player.maxHp) {
      throw codedError('COMBAT_HEALING_NOT_NEEDED', 'Vos points de vie sont déjà au maximum.');
    }
    const next = structuredClone(combat);
    const healed = Math.min(5, next.player.maxHp - next.player.hp);
    next.player.hp += healed;
    next.player.actionsPlayed += 1;
    next.log.push({
      round: next.round,
      type: 'item',
      itemId,
      text: `Le Sorcier boit une potion de soin, récupère ${healed} PV et dépense 1 Action.`,
    });
    const outcome = next.player.actionsPlayed >= next.player.actionLimit
      ? this.startEnemyTurn(next)
      : null;
    return { combat: next, outcome, healed };
  }

  passReaction(combat) {
    this.assertCombat(combat);
    if (combat.phase !== 'reaction') {
      throw codedError('REACTION_UNAVAILABLE', 'Aucune attaque n’attend de réaction.');
    }
    const next = structuredClone(combat);
    next.log.push({
      round: next.round,
      type: 'reaction_passed',
      text: 'Le Sorcier garde sa magie.',
    });
    return this.resolveEnemyAttack(next, 0);
  }

  cardsFor(combat) {
    this.assertCombat(combat);
    return combat.hand.map((instance) => {
      const card = this.cards.get(instance.cardId);
      const availability = this.cardAvailabilityFor(combat, card);
      return {
        instanceId: instance.instanceId,
        ...structuredClone(card),
        actionCost: availability.actionCost,
        resolvedDamage: card.family === 'weapon'
          ? card.effect.damage * combat.player.stats.strength
          : card.effect.damage,
        available: availability.available,
      };
    });
  }

  spontaneousMagicOptionsFor(combat) {
    this.assertCombat(combat);
    const expectedTiming = combat.phase === 'player' ? 'action' : 'reaction';
    return [...this.cards.values()]
      .filter((card) => card.family === 'spell' && card.timing === expectedTiming)
      .map((card) => {
        const availability = this.cardAvailabilityFor(combat, card);
        const sourceAvailable = combat.hand.some(
          (instance) => instance.cardId !== card.id,
        );
        return {
          ...structuredClone(card),
          actionCost: availability.actionCost,
          resolvedDamage: card.effect.damage,
          available: combat.player.spontaneousMagicAvailable
            && sourceAvailable
            && availability.available,
          unavailableReason: availability.reason,
        };
      });
  }

  deckCardsFor(combat) {
    this.assertCombat(combat);
    const zones = [
      ['draw', combat.drawPile],
      ['hand', combat.hand],
      ['discard', combat.discardPile],
    ];
    return zones.flatMap(([zone, pile]) => pile.map((instance) => ({
      instanceId: instance.instanceId,
      ...structuredClone(this.cards.get(instance.cardId)),
      zone,
    })));
  }

  resolveActionCard(combat, card, actionCost) {
    const damage = card.family === 'weapon'
      ? card.effect.damage * combat.player.stats.strength
      : card.effect.damage;
    combat.player.actionsPlayed += actionCost;
    this.consumeActionTempo(combat);
    combat.enemy.hp = Math.max(0, combat.enemy.hp - damage);
    combat.log.push({
      round: combat.round,
      type: 'card',
      cardId: card.id,
      text: card.family === 'weapon'
        ? `${card.name} inflige ${damage} dégâts (${card.effect.damage} × Force ${combat.player.stats.strength}).`
        : `${card.name} inflige ${damage} dégâts à ${combat.enemy.name}.`,
    });
    if (combat.enemy.hp === 0) return { combat, outcome: 'victory' };
    if (card.effect.concentration) {
      this.startConcentration(combat, card);
    }
    const outcome = combat.player.actionsPlayed >= combat.player.actionLimit
      ? this.startEnemyTurn(combat)
      : null;
    return { combat, outcome };
  }

  resolveReactionCard(combat, card) {
    const block = card.effect.block || 0;
    if (card.effect.status) this.applyStatus(combat, card.effect.status);
    combat.log.push({
      round: combat.round,
      type: 'card',
      cardId: card.id,
      text: card.effect.status?.id === 'slowed'
        ? `${card.name} bloque ${block} dégât${block > 1 ? 's' : ''} et applique Ralentissement ${card.effect.status.stacks}.`
        : card.effect.status?.id === 'advantage'
          ? `${card.name} prépare Avantage : la prochaine carte Action coûtera 0 Action.`
          : `${card.name} bloque jusqu’à ${block} dégâts.`,
    });
    return this.resolveEnemyAttack(combat, block);
  }

  startEnemyTurn(combat) {
    const slowed = combat.enemy.statuses.find((status) => status.id === 'slowed');
    const penalty = slowed?.stacks || 0;
    const drawCount = Math.max(0, combat.enemy.drawCount - penalty);
    if (slowed) {
      combat.enemy.statuses = combat.enemy.statuses.filter((status) => status.id !== 'slowed');
      combat.log.push({
        round: combat.round,
        type: 'status_consumed',
        statusId: 'slowed',
        text: `Ralentissement réduit la pioche de ${combat.enemy.name} de ${combat.enemy.drawCount} à ${drawCount} carte${drawCount > 1 ? 's' : ''}, puis se dissipe.`,
      });
    }
    this.drawEnemyCards(combat, drawCount);
    if (combat.enemy.hand.length === 0) {
      combat.log.push({
        round: combat.round,
        type: 'enemy_turn_skipped',
        text: `${combat.enemy.name} ne peut jouer aucune carte.`,
      });
      return this.finishEnemyTurn(combat);
    }
    this.announceEnemyAttack(combat);
    return null;
  }

  announceEnemyAttack(combat) {
    const instance = combat.enemy.hand[0];
    const card = this.enemyCards.get(instance.cardId);
    combat.pendingAttack = {
      instanceId: instance.instanceId,
      cardId: card.id,
      name: card.name,
      damage: card.damage,
      ...(card.effect ? { effect: structuredClone(card.effect) } : {}),
    };
    combat.phase = 'reaction';
    combat.log.push({
      round: combat.round,
      type: 'enemy_attack_announced',
      text: `${combat.enemy.name} prépare ${combat.pendingAttack.name} (${combat.pendingAttack.damage} dégâts${card.effect?.status?.id === 'disadvantage' ? ' + Désavantage' : ''}).`,
    });
  }

  resolveEnemyAttack(combat, block) {
    const attackEffect = combat.pendingAttack.effect
      ? structuredClone(combat.pendingAttack.effect)
      : null;
    const damage = Math.max(0, combat.pendingAttack.damage - block);
    combat.player.hp = Math.max(0, combat.player.hp - damage);
    combat.log.push({
      round: combat.round,
      type: 'enemy_attack',
      text: damage
        ? `${combat.enemy.name} inflige ${damage} dégâts au Sorcier.`
        : `${combat.enemy.name} ne traverse pas la défense du Sorcier.`,
    });
    if (damage > 0) this.breakConcentration(combat);
    if (attackEffect?.status) this.applyStatus(combat, attackEffect.status);
    const resolvedIndex = combat.enemy.hand.findIndex(
      (instance) => instance.instanceId === combat.pendingAttack.instanceId,
    );
    if (resolvedIndex !== -1) {
      const [resolved] = combat.enemy.hand.splice(resolvedIndex, 1);
      combat.enemy.discardPile.push(resolved);
    }
    combat.pendingAttack = null;
    if (combat.player.hp === 0) return { combat, outcome: 'defeat' };

    if (combat.enemy.hand.length > 0) {
      this.announceEnemyAttack(combat);
      return { combat, outcome: null };
    }
    const outcome = this.finishEnemyTurn(combat);
    return { combat, outcome };
  }

  finishEnemyTurn(combat) {
    if (combat.enemy.hand.length > 0) {
      combat.enemy.discardPile.push(...combat.enemy.hand.splice(0));
    }
    this.discardHand(combat);
    combat.round += 1;
    combat.phase = 'player';
    combat.player.actionsPlayed = 0;
    const outcome = this.triggerConcentration(combat);
    if (outcome) return outcome;
    this.drawForRound(combat);
    return null;
  }

  startConcentration(combat, card) {
    combat.player.statuses.push({
      id: 'concentration',
      name: 'Concentration',
      stacks: 1,
      sourceCardId: card.id,
      sourceCardName: card.name,
      damage: card.effect.concentration.damage,
      description: `${card.effect.concentration.damage} dégâts au début du prochain tour ; se brise au premier dégât subi.`,
    });
    combat.log.push({
      round: combat.round,
      type: 'concentration_started',
      statusId: 'concentration',
      cardId: card.id,
      text: `${card.name} reste suspendu : Concentration ${card.effect.concentration.damage} dégâts.`,
    });
  }

  breakConcentration(combat) {
    const concentration = combat.player.statuses.find(
      (status) => status.id === 'concentration',
    );
    if (!concentration) return;
    combat.player.statuses = combat.player.statuses.filter(
      (status) => status.id !== 'concentration',
    );
    combat.log.push({
      round: combat.round,
      type: 'concentration_broken',
      statusId: 'concentration',
      cardId: concentration.sourceCardId,
      text: `${concentration.sourceCardName} se brise au premier dégât subi.`,
    });
  }

  triggerConcentration(combat) {
    const concentration = combat.player.statuses.find(
      (status) => status.id === 'concentration',
    );
    if (!concentration) return null;
    combat.player.statuses = combat.player.statuses.filter(
      (status) => status.id !== 'concentration',
    );
    combat.enemy.hp = Math.max(0, combat.enemy.hp - concentration.damage);
    combat.log.push({
      round: combat.round,
      type: 'concentration_triggered',
      statusId: 'concentration',
      cardId: concentration.sourceCardId,
      text: `${concentration.sourceCardName} éclate et inflige ${concentration.damage} dégâts à ${combat.enemy.name}.`,
    });
    return combat.enemy.hp === 0 ? 'victory' : null;
  }

  applyStatus(combat, effect) {
    if (effect.target === 'enemy' && effect.id === 'slowed') {
      const current = combat.enemy.statuses.find((status) => status.id === effect.id);
      if (current) {
        current.stacks = Math.max(current.stacks, effect.stacks);
        return;
      }
      combat.enemy.statuses.push({
        id: 'slowed',
        name: 'Ralentissement',
        stacks: effect.stacks,
        description: `Prochaine pioche ennemie : −${effect.stacks}.`,
      });
      return;
    }

    if (
      effect.target !== 'player'
      || !['advantage', 'disadvantage'].includes(effect.id)
    ) return;

    const oppositeId = effect.id === 'advantage' ? 'disadvantage' : 'advantage';
    const opposite = combat.player.statuses.find((status) => status.id === oppositeId);
    if (opposite) {
      combat.player.statuses = combat.player.statuses.filter((status) => status.id !== oppositeId);
      combat.log.push({
        round: combat.round,
        type: 'status_neutralized',
        statusId: effect.id,
        text: 'Avantage et Désavantage s’annulent.',
      });
      return;
    }
    if (combat.player.statuses.some((status) => status.id === effect.id)) return;

    const isAdvantage = effect.id === 'advantage';
    combat.player.statuses.push({
      id: effect.id,
      name: isAdvantage ? 'Avantage' : 'Désavantage',
      stacks: 1,
      description: isAdvantage
        ? 'La prochaine carte Action coûte 0 Action.'
        : 'La prochaine carte Action coûte 2 Actions.',
    });
    combat.log.push({
      round: combat.round,
      type: 'status_applied',
      statusId: effect.id,
      text: isAdvantage
        ? 'Avantage est prêt pour la prochaine carte Action.'
        : 'Désavantage pèsera sur la prochaine carte Action.',
    });
  }

  actionCostFor(combat, card) {
    if (card.timing !== 'action') return 0;
    if (combat.player.statuses.some((status) => status.id === 'advantage')) return 0;
    if (combat.player.statuses.some((status) => status.id === 'disadvantage')) return 2;
    return 1;
  }

  cardAvailabilityFor(combat, card) {
    const expectedTiming = combat.phase === 'player' ? 'action' : 'reaction';
    const actionCost = this.actionCostFor(combat, card);
    if (card.timing !== expectedTiming) {
      return {
        available: false,
        actionCost,
        reason: combat.phase === 'player'
          ? 'Disponible pendant une phase de Réaction.'
          : 'Disponible pendant une phase d’Action.',
      };
    }
    if (
      combat.phase === 'player'
      && combat.player.actionsPlayed + actionCost > combat.player.actionLimit
    ) {
      return {
        available: false,
        actionCost,
        reason: actionCost === 2
          ? 'Désavantage exige 2 Actions disponibles.'
          : 'La limite d’Agilité est atteinte pour ce round.',
      };
    }
    if (card.chargeCost > combat.player.spellUses) {
      return {
        available: false,
        actionCost,
        reason: 'Il ne reste pas assez de charges de sort.',
      };
    }
    if (
      card.effect.concentration
      && combat.player.statuses.some((status) => status.id === 'concentration')
    ) {
      return {
        available: false,
        actionCost,
        reason: 'Un Orbe est déjà suspendu.',
      };
    }
    return { available: true, actionCost, reason: null };
  }

  assertPlayableCard(combat, card) {
    const availability = this.cardAvailabilityFor(combat, card);
    if (availability.available) return availability.actionCost;
    if (card.timing !== (combat.phase === 'player' ? 'action' : 'reaction')) {
      throw codedError(
        'CARD_WRONG_PHASE',
        combat.phase === 'player'
          ? 'C’est au Sorcier de jouer une carte Action.'
          : 'Seule une carte Réaction peut être jouée maintenant.',
      );
    }
    if (card.chargeCost > combat.player.spellUses) {
      throw codedError('NOT_ENOUGH_SPELL_USES', availability.reason);
    }
    if (
      card.effect.concentration
      && combat.player.statuses.some((status) => status.id === 'concentration')
    ) {
      throw codedError(
        'CONCENTRATION_ALREADY_ACTIVE',
        'Un Orbe est déjà suspendu : cette Concentration doit d’abord se résoudre.',
      );
    }
    throw codedError('ACTION_LIMIT_REACHED', availability.reason);
  }

  consumeActionTempo(combat) {
    const tempo = combat.player.statuses.find(
      (status) => ['advantage', 'disadvantage'].includes(status.id),
    );
    if (!tempo) return;
    combat.player.statuses = combat.player.statuses.filter((status) => status.id !== tempo.id);
    combat.log.push({
      round: combat.round,
      type: 'status_consumed',
      statusId: tempo.id,
      text: `${tempo.name} est consommé par la carte Action.`,
    });
  }

  drawForRound(combat) {
    let drawn = 0;
    while (drawn < combat.player.drawCount) {
      if (combat.drawPile.length === 0) {
        if (combat.discardPile.length === 0) break;
        combat.drawPile = combat.discardPile.splice(0);
        combat.log.push({
          round: combat.round,
          type: 'deck_recycled',
          text: 'La défausse reforme la pioche.',
        });
      }
      combat.hand.push(combat.drawPile.shift());
      drawn += 1;
    }
    combat.log.push({
      round: combat.round,
      type: 'cards_drawn',
      text: `${drawn} carte${drawn > 1 ? 's' : ''} piochée${drawn > 1 ? 's' : ''} grâce à Sagesse ${combat.player.stats.wisdom}.`,
    });
  }

  drawEnemyCards(combat, drawCount) {
    let drawn = 0;
    while (drawn < drawCount) {
      if (combat.enemy.drawPile.length === 0) {
        if (combat.enemy.discardPile.length === 0) break;
        combat.enemy.drawPile = combat.enemy.discardPile.splice(0);
        combat.log.push({
          round: combat.round,
          type: 'enemy_deck_recycled',
          text: `La défausse de ${combat.enemy.name} reforme sa pioche.`,
        });
      }
      combat.enemy.hand.push(combat.enemy.drawPile.shift());
      drawn += 1;
    }
    combat.log.push({
      round: combat.round,
      type: 'enemy_cards_drawn',
      text: `${combat.enemy.name} pioche ${drawn} carte${drawn > 1 ? 's' : ''} d’attaque.`,
    });
  }

  discardHand(combat) {
    if (combat.hand.length === 0) return;
    combat.discardPile.push(...combat.hand.splice(0));
  }

  assertCombat(combat) {
    if (
      !combat
      || combat.nodeId == null
      || !Number.isInteger(combat.round)
      || !['player', 'reaction'].includes(combat.phase)
      || !Number.isFinite(combat.player?.hp)
      || !Number.isFinite(combat.enemy?.hp)
      || !Array.isArray(combat.drawPile)
      || !Array.isArray(combat.hand)
      || !Array.isArray(combat.discardPile)
      || !Array.isArray(combat.player?.statuses)
      || typeof combat.player?.spontaneousMagicAvailable !== 'boolean'
      || !Number.isInteger(combat.enemy?.drawCount)
      || !Array.isArray(combat.enemy?.statuses)
      || !Array.isArray(combat.enemy?.drawPile)
      || !Array.isArray(combat.enemy?.hand)
      || !Array.isArray(combat.enemy?.discardPile)
    ) {
      throw codedError('COMBAT_STATE_INVALID', 'État de combat invalide.');
    }
  }
}

function codedError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

module.exports = { CombatEngine };
