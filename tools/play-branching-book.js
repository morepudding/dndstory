const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { BranchingBookRuntime } = require('../src/server/branching-book-runtime');
const { normalizeStory } = require('../src/server/story-format');

const DEFAULT_BOOK = path.join(__dirname, '..', 'content', 'chapters', 'la-route-des-ronces.json');

function loadBook(file = DEFAULT_BOOK) {
  const tree = normalizeStory(JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')));
  return { tree, validate: true, showChapterSummary: tree.showChapterSummary !== false };
}

function normalizeBook(book) {
  const tree = normalizeStory(book);
  return { tree, validate: true, showChapterSummary: tree.showChapterSummary !== false };
}

function renderScene(view, write = (text) => process.stdout.write(text)) {
  const lines = ['', `ACTE ${view.act.index} · ${view.act.title}`, view.node.title, '', view.node.text, ''];
  if (view.terminal) {
    lines.push(view.node.kind === 'success' ? 'FIN — RÉUSSITE' : 'FIN', view.node.terminal.outcomeSummary);
    if (view.node.kind === 'failure') lines.push('', '[r] Reprendre cet acte');
    lines.push('[n] Recommencer · [q] Quitter');
  } else if (view.inCombat) {
    lines.push(
      `Round ${view.combat.round} · ${view.combat.phase === 'player' ? 'Action' : 'Réaction'}`,
      `${view.combat.player.name} ${view.combat.player.hp}/${view.combat.player.maxHp} PV · ${view.combat.player.spellUses}/${view.combat.player.maxSpellUses} charges`,
      `Actions ${view.combat.player.actionsPlayed}/${view.combat.player.actionLimit} · Main ${view.combat.hand.length} · Pioche ${view.combat.drawPile.length} · Défausse ${view.combat.discardPile.length}`,
      `${view.combat.enemy.name} ${view.combat.enemy.hp}/${view.combat.enemy.maxHp} PV`,
      `Ennemi · Actions ${view.combat.enemy.hand.length} · Pioche ${view.combat.enemy.drawPile.length} · Défausse ${view.combat.enemy.discardPile.length}`,
      view.combat.enemy.statuses.length
        ? view.combat.enemy.statuses.map((status) => `${status.name} ${status.stacks} (${status.description})`).join(' · ')
        : 'Aucun état ennemi',
      view.combat.pendingAttack
        ? `Intention : ${view.combat.pendingAttack.name} · ${view.combat.pendingAttack.damage} dégâts`
        : '',
      '',
    );
    view.combat.cards.forEach((card, index) => lines.push(`${index + 1}. ${card.name} — ${card.description}${card.available ? '' : ' [indisponible]'}`));
    if (view.combat.phase === 'reaction') lines.push('[p] Ne pas réagir');
    else lines.push('[e] Terminer le tour');
    lines.push('', '[n] Recommencer · [q] Quitter');
  } else {
    view.node.choices.forEach((choice, index) => {
      const unmet = (choice.requirements || []).filter((requirement) => view.hero.stats[requirement.stat] < requirement.min);
      lines.push(`${index + 1}. ${choice.label}${unmet.length ? ` [verrouillé : ${unmet.map((item) => `${item.stat} ${item.min}`).join(', ')}]` : ''}`);
    });
    lines.push('', '[n] Recommencer · [q] Quitter');
  }
  write(`${lines.join('\n')}\n`);
}

async function play({ file = DEFAULT_BOOK, input = process.stdin, output = process.stdout } = {}) {
  const loaded = loadBook(file);
  const runtime = new BranchingBookRuntime(loaded.tree, { validate: loaded.validate });
  const write = (text) => output.write(text);
  const prompt = readline.createInterface({ input, output, terminal: Boolean(output.isTTY) });
  write(`\n${runtime.tree.title.toUpperCase()}\n`);
  if (loaded.showChapterSummary) write(`${runtime.tree.chapterSummary}\n`);
  renderScene(runtime.read(), write);
  for await (const rawAnswer of prompt) {
    const answer = rawAnswer.trim().toLowerCase();
    if (answer === 'q' || answer === 'quit') break;
    try {
      let view;
      if (answer === 'n' || answer === 'restart') view = runtime.start();
      else if (answer === 'r' || answer === 'retry') view = runtime.retryAct();
      else if (runtime.read().inCombat && answer === 'p') view = runtime.passReaction();
      else if (runtime.read().inCombat && answer === 'e') view = runtime.endCombatTurn();
      else {
        const number = Number(answer);
        if (!Number.isInteger(number) || number < 1) throw new Error('Entre le numéro d’un choix, r, n ou q.');
        if (runtime.read().inCombat) {
          const card = runtime.read().combat.cards[number - 1];
          if (!card) throw new Error('Cette carte n’existe pas.');
          view = runtime.playCard(card.instanceId);
        } else {
          const result = runtime.choose(number - 1);
          write(`\nVOUS\n${result.choice.playerText}\n`);
          view = result;
        }
      }
      renderScene(view, write);
    } catch (error) { write(`\n${error.message}\n`); }
  }
  prompt.close();
  write('\nPartie terminée.\n');
}

if (require.main === module) {
  play({ file: process.argv[2] || DEFAULT_BOOK }).catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { DEFAULT_BOOK, loadBook, normalizeBook, play, renderScene };
