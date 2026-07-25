let state;
let inputMode = 'speech';
let currentStory = null;
let selectedLevelStat = null;
let menuView = null;
let pendingMenuConfirmation = null;
let terminalMenuSignature = null;
let booting = true;
const $ = (selector) => document.querySelector(selector);
const STAT_PRESENTATION = {
  strength: { short: 'FOR', name: 'Force', effect: (value) => `${value} dégâts par point de dégâts d’arme` },
  constitution: { short: 'CON', name: 'Constitution', effect: (value) => `${value * 5} points de vie au début du combat` },
  agility: { short: 'AGI', name: 'Agilité', effect: (value) => `${value} cartes Action jouables par round` },
  wisdom: { short: 'SAG', name: 'Sagesse', effect: (value) => `${value} cartes piochées par round` },
  intelligence: { short: 'INT', name: 'Intelligence', effect: (value) => `${value} charges de sort par combat` },
};
const ROUTE_SCENES = {
  depart: {
    src: 'assets/visuals/route-des-ronces/route-etranglee.jpg',
    alt: 'Le Sorcier, Toma et leur mule avancent sur une route étroite entre des collines couvertes de ronces',
    label: 'Route de Brumepont · Fin d’après-midi',
  },
  charrette: {
    src: 'assets/visuals/route-des-ronces/route-etranglee.jpg',
    alt: 'La route étranglée par les ronces avant le convoi brisé',
    label: 'Route de Brumepont · Le passage se resserre',
  },
  pillard: {
    src: 'assets/visuals/route-des-ronces/route-etranglee.jpg',
    alt: 'Les ronces et les talus sombres autour de la route de Brumepont',
    label: 'Sous le talus · Embuscade',
  },
  'fin-victoire': {
    src: 'assets/visuals/route-des-ronces/route-etranglee.jpg',
    alt: 'La route de Brumepont se poursuit au-delà des ronces',
    label: 'Route de Brumepont · Passage rouvert',
  },
  'fin-collet': {
    src: 'assets/visuals/route-des-ronces/route-etranglee.jpg',
    alt: 'La route sombre disparaît entre les ronces',
    label: 'Route de Brumepont · Le collet',
  },
  'fin-combat': {
    src: 'assets/visuals/route-des-ronces/route-etranglee.jpg',
    alt: 'La route hostile sous les ronces après le combat',
    label: 'Route de Brumepont · Dernière étincelle',
  },
};
const BRUMEPONT_SCENES = {
  'relais-arrivee': {
    src: 'assets/visuals/brumepont/relais-nuit.png',
    alt: 'L’intérieur du relais de Brumepont, éclairé par l’âtre sous la pluie',
    label: 'Relais de Brumepont · Nuit',
  },
  'offres-du-relais': {
    src: 'assets/visuals/brumepont/relais-nuit.png',
    alt: 'Le comptoir du relais, une potion et un vieux carrier près de la fenêtre',
    label: 'Relais de Brumepont · Douze pièces en poche',
  },
  'route-surveillee': {
    src: 'assets/visuals/brumepont/route-carrieres.png',
    alt: 'La route nocturne des carrières barrée par un guetteur',
    label: 'Vieilles carrières · Route du nord',
  },
  'fin-guetteur': {
    src: 'assets/visuals/brumepont/route-carrieres.png',
    alt: 'La route nocturne des carrières après le combat',
    label: 'Vieilles carrières · Passage dégagé',
  },
  'fin-passage-oublie': {
    src: 'assets/visuals/brumepont/route-carrieres.png',
    alt: 'Les carrières nocturnes atteintes par un passage oublié',
    label: 'Vieilles carrières · Passage oublié',
  },
  'echec-guetteur': {
    src: 'assets/visuals/brumepont/route-carrieres.png',
    alt: 'La route hostile des carrières sous la lune',
    label: 'Vieilles carrières · Retraite',
  },
};

const CAGE_PROVENANCE = {
  'carriere-par-passage': { label: 'Passage oublié', className: 'cage-from-passage' },
  'carriere-par-la-route': { label: 'Route surveillée', className: 'cage-from-road' },
};
const CAGE_OUTCOMES = {
  'captive-sauvee': { label: 'Mira sauvée', className: 'cage-outcome-saved' },
  'ordres-recuperes': { label: 'Ordres récupérés', className: 'cage-outcome-orders' },
};
const CAGE_SCENES = {
  'arrivee-carrieres': {
    src: 'assets/visuals/cage-du-treuil/treuil-et-puits.png',
    alt: 'Le treuil des vieilles carrières au-dessus du puits où attend la cage',
    label: 'Vieilles carrières · Treuil central',
  },
  'cage-du-treuil': {
    src: 'assets/visuals/cage-du-treuil/treuil-et-puits.png',
    alt: 'La cage suspendue sous le treuil des vieilles carrières',
    label: 'Vieilles carrières · Une intervention',
  },
  'combat-varek': {
    src: 'assets/visuals/cage-du-treuil/treuil-et-puits.png',
    alt: 'Le puits du treuil après la descente de la cage',
    label: 'Vieilles carrières · La cage a disparu',
  },
  'fin-mira-sauvee': {
    src: 'assets/visuals/cage-du-treuil/ravin-evasion.png',
    alt: 'Le ravin derrière les carrières où Mira et le Sorcier ont émergé',
    label: 'Ravin des carrières · Mira hors du puits',
  },
  'fin-ordres-recuperes': {
    src: 'assets/visuals/cage-du-treuil/registre-et-puits.png',
    alt: 'La gaine d’ordres ouverte au bord du puits où la cage a disparu',
    label: 'Treuil abandonné · Les ordres en main',
  },
  'echec-varek': {
    src: 'assets/visuals/cage-du-treuil/treuil-et-puits.png',
    alt: 'Le treuil des carrières après le départ de Varek',
    label: 'Vieilles carrières · Transfert poursuivi',
  },
};
const THIRD_LEVEL_PROVENANCE = {
  'captive-sauvee': { label: 'Mira sauvée', className: 'third-from-mira' },
  'ordres-recuperes': { label: 'Ordres récupérés', className: 'third-from-orders' },
};
const THIRD_LEVEL_OUTCOMES = {
  'passage-condamne': { label: 'Passage condamné', className: 'third-outcome-closed' },
  'passage-maintenu': { label: 'Passage maintenu', className: 'third-outcome-open' },
};
const THIRD_LEVEL_SCENES = {
  'conduit-du-ravin': {
    src: 'assets/visuals/troisieme-palier/conduit-du-ravin.png',
    alt: 'Le conduit instable qui descend du ravin vers le troisième palier',
    label: 'Ravin des carrières · Conduit des sondeurs',
  },
  'cage-de-service': {
    src: 'assets/visuals/troisieme-palier/cage-de-service.png',
    alt: 'La cage de service suspendue dans le puits des carrières',
    label: 'Puits des carrières · Entre deux cloches',
  },
  'passage-ancien': {
    src: 'assets/visuals/troisieme-palier/passage-maintenu.png',
    alt: 'L’ouvrage ancien découvert au troisième palier',
    label: 'Troisième palier · Ouvrage ancien',
  },
  'fin-passage-condamne': {
    src: 'assets/visuals/troisieme-palier/passage-condamne.png',
    alt: 'L’arche ancienne entièrement condamnée par un éboulement de schiste',
    label: 'Troisième palier · Passage condamné',
  },
  'fin-passage-maintenu': {
    src: 'assets/visuals/troisieme-palier/passage-maintenu.png',
    alt: 'L’arche ancienne consolidée et laissée ouverte vers les profondeurs',
    label: 'Troisième palier · Passage maintenu',
  },
  'echec-eboulis': {
    src: 'assets/visuals/troisieme-palier/conduit-du-ravin.png',
    alt: 'Le conduit instable après l’effondrement du raccourci',
    label: 'Conduit du ravin · Accès perdu',
  },
  'echec-interception': {
    src: 'assets/visuals/troisieme-palier/cage-de-service.png',
    alt: 'La cage de service immobilisée au-dessus du troisième palier',
    label: 'Puits des carrières · Cage interceptée',
  },
};

function setText(selector, value) { $(selector).textContent = value; }
function renderProfile() {
  const c = state.character;
  setText('#name', c.identity.name); setText('#header-name', c.identity.name);
  setText('#age', c.identity.age);
  setText('#occupation', c.identity.occupation);
  setText('#scene-location', c.scene.location); setText('#scene-time', `${c.scene.time} · ${c.scene.outfit}`);
  setText('#relation-mood', `Niveau ${c.progression.level}`);
  setText('#hero-gold', `${c.progression.gold} or`);
  const potionCount = c.progression.inventory?.['healing-potion'] || 0;
  $('#hero-potions').hidden = potionCount < 1;
  $('#hero-potions b').textContent = potionCount;
  $('.relationship-card').title = 'Statistiques utilisées par les cartes et les choix narratifs';
  for (const stat of Object.keys(STAT_PRESENTATION)) setText(`#stat-${stat}`, c.progression.stats[stat]);
  $('#traits').replaceChildren(...c.personality.traits.map((trait) => { const node = document.createElement('span'); node.className = 'trait'; node.textContent = trait; return node; }));
}
function parseMessageParts(content, role) {
  if (role === 'assistant' && !content.includes('*') && /^\s*—/m.test(content)) {
    return content.split(/\n\s*\n/).map((text) => text.trim()).filter(Boolean).map((text) => ({
      type: /^—/.test(text) ? 'speech' : 'action',
      text,
    }));
  }
  const parts = []; let last = 0; const actionPattern = /\*([^*]+)\*/g; let match;
  while ((match = actionPattern.exec(content))) {
    if (content.slice(last, match.index).trim()) parts.push({ type: 'speech', text: content.slice(last, match.index).trim() });
    if (match[1].trim()) parts.push({ type: 'action', text: match[1].trim() });
    last = actionPattern.lastIndex;
  }
  const tail = content.slice(last).trim();
  if (tail) parts.push(tail.startsWith('*') ? { type: 'action', text: tail.slice(1).trim() } : { type: 'speech', text: tail });
  if (!parts.length && content) parts.push({ type: 'speech', text: content });
  return parts;
}
function renderMessageContent(body, content, role = body.dataset.role) {
  body.replaceChildren();
  body.dataset.role = role;
  const parts = parseMessageParts(content, role);
  body.classList.toggle('action-only', parts.length > 0 && parts.every((part) => part.type === 'action'));
  for (const part of parts) {
    const block = document.createElement('span'); block.className = `message-part ${part.type}`;
    if (part.type === 'action') {
      const marker = document.createElement('small');
      const symbol = document.createElement('b'); symbol.textContent = role === 'user' ? '→' : '✦';
      const actor = document.createElement('span'); actor.textContent = role === 'user' ? 'Vous agissez' : 'Le monde réagit';
      marker.append(symbol, actor); block.append(marker);
    }
    const text = document.createElement(part.type === 'action' ? 'i' : 'span');
    text.className = part.type === 'speech' ? 'speech-text' : '';
    text.textContent = part.type === 'speech' ? part.text.replace(/^—\s*/, '') : part.text;
    block.append(text); body.append(block);
  }
}
function queueTypewriter(body, addition, { replace = false } = {}) {
  body.classList.add('is-typing');
  if (replace) {
    body.dataset.typewriterTarget = addition;
    body.dataset.typewriterShown = '';
  } else {
    body.dataset.typewriterTarget = `${body.dataset.typewriterTarget || ''}${addition}`;
  }
  if (body.typewriterTimer) return;
  const tick = () => {
    const target = body.dataset.typewriterTarget || '';
    let shown = body.dataset.typewriterShown || '';
    if (shown.length >= target.length) { body.typewriterTimer = null; body.classList.remove('is-typing'); return; }
    const next = target.slice(shown.length, shown.length + (target.length - shown.length > 32 ? 4 : 2));
    shown += next; body.dataset.typewriterShown = shown;
    renderMessageContent(body, shown);
    $('#messages').scrollTop = $('#messages').scrollHeight;
    const pause = /[.!?…]\s?$/.test(shown) ? 70 : /[,;:]\s?$/.test(shown) ? 34 : 12;
    body.typewriterTimer = setTimeout(tick, pause);
  };
  tick();
}
function finishTypewriter(body) {
  if (!body?.classList.contains('is-typing')) return;
  clearTimeout(body.typewriterTimer); body.typewriterTimer = null;
  body.dataset.typewriterShown = body.dataset.typewriterTarget || '';
  body.classList.remove('is-typing');
  renderMessageContent(body, body.dataset.typewriterShown);
}
function appendMessage(role, content) {
  $('#empty-state')?.remove();
  const node = document.createElement('article'); node.className = `message ${role}`;
  const label = document.createElement('span'); label.className = 'label'; label.textContent = role === 'user' ? 'SORCIER' : 'NARRATEUR';
  const body = document.createElement('div'); body.className = 'message-content'; body.dataset.raw = content; body.dataset.role = role; renderMessageContent(body, content, role);
  node.append(label, body); node.addEventListener('click',()=>finishTypewriter(body)); $('#messages').append(node); $('#messages').scrollTop = $('#messages').scrollHeight;
  return body;
}
function resetConversationView() {
  $('#messages').replaceChildren();
  window.liveReply = null;
}
function setConnection(kind, text) { $('#connection-dot').parentElement.className = `connection ${kind}`; setText('#connection-text', text); }

async function boot() {
  state = await window.candy.readCharacter(); renderProfile();
  const story = await window.candy.readStory();
  state.conversation.messages.forEach((message) => appendMessage(message.role, message.content));
  renderStory(story);
  try {
    const status = await window.candy.status();
    setConnection('online', status.connected ? 'Moteur local et narrateur prêts' : 'Moteur de jeu local prêt');
  } catch {
    setConnection('online', 'Moteur de jeu local prêt');
  }
  booting = false;
  if (sessionStorage.getItem('fantasy-story-entered') !== '1') showGameMenu('home');
  else syncGameMenuWithStory(story);
}

function renderStory(story) {
  currentStory = story;
  renderHero(story.hero);
  renderLevelUp(story.progression);
  const resolvingLevelUp = Boolean(story.canResolveLevelUp);
  $('#scene-visual').hidden = !story.active;
  renderSceneArt(story);
  renderStoryMarkers(story);
  document.body.classList.toggle('narrative-mode', Boolean(story.active));
  $('.conversation').classList.toggle('narrative-active', Boolean(story.active));
  $('.relationship-card').hidden = false;
  $('#narrative-bar').dataset.active = story.active ? 'true' : 'false';
  setText('#chapter-title', story.title || 'La Route des Ronces');
  setText('#scene-title', story.active ? resolvingLevelUp ? `Progression · Niveau ${story.progression.level}` : story.terminal ? story.status === 'success' ? 'Victoire' : 'Fin de route' : story.inCombat ? `Combat · Round ${story.combat?.round}` : `Acte ${story.act?.index} · ${story.act?.title}` : 'Aventure');
  setText('#chapter-summary', story.ending?.outcomeSummary || story.node?.title || story.chapterSummary || '');
  $('#chapter-action').hidden = story.active;
  $('#chapter-menu').hidden = !story.active || resolvingLevelUp;
  $('#act-retry').hidden = !story.canRetryAct;
  $('#chapter-continue').hidden = !story.canContinueFreeChat && !story.canContinueAdventure;
  $('#chapter-continue').textContent = story.continueLabel || 'Revenir à l’accueil';
  setText('#scene-dialogue-text', story.active ? story.node?.text || story.ending?.outcomeSummary || '' : '');
  const choices = story.choices || []; $('#choices').hidden = !choices.length;
  document.documentElement.classList.toggle(
    'choice-running',
    Boolean(story.active && choices.length && !story.combat && !resolvingLevelUp),
  );
  renderCombat(story.combat, story.combatItems || []);
  $('.composer-wrap').classList.toggle('narrative-active', story.active);
  $('#story-options').replaceChildren(...choices.map((choice,index)=>{
    const button=document.createElement('button');
    button.type='button';
    button.disabled=choice.available === false;
    button.classList.toggle('locked', choice.available === false);
    button.innerHTML='<kbd></kbd><span class="choice-copy"></span>';
    button.querySelector('kbd').textContent=index+1;
    const copy=button.querySelector('.choice-copy');
    const label=document.createElement('strong');label.textContent=choice.label;copy.append(label);
    if (choice.transaction || choice.requirements?.length) {
      const requirement=document.createElement('small');
      requirement.textContent=formatChoiceDetail(choice);
      copy.append(requirement);
    }
    button.addEventListener('click',()=>playStoryChoice(choice.id));
    return button;
  }));
  syncGameMenuWithStory(story);
}

function syncGameMenuWithStory(story) {
  if (booting) return;
  if (!story.active || !story.terminal || story.canResolveLevelUp) {
    terminalMenuSignature = null;
    return;
  }
  const signature = `${story.storyId}:${story.status}:${story.node?.id || ''}`;
  if (terminalMenuSignature === signature) return;
  terminalMenuSignature = signature;
  requestAnimationFrame(() => {
    const conclusion = $('#scene-dialogue-text');
    conclusion.scrollTop = 0;
    conclusion.closest('.scene-dialogue')?.scrollIntoView({ block: 'nearest' });
  });
}

function showGameMenu(view) {
  if (!currentStory) return;
  menuView = view;
  const menu = $('#game-menu');
  const active = Boolean(currentStory.active);
  const failed = currentStory.status === 'failure';
  const terminal = Boolean(currentStory.terminal);
  const endReady = terminal && !currentStory.canResolveLevelUp;
  const primary = $('#game-menu-primary');
  const restart = $('#game-menu-restart');
  const home = $('#game-menu-home');
  const abandon = $('#game-menu-abandon');
  const progress = $('#game-menu-progress');

  menu.dataset.view = view;
  progress.hidden = !active;
  setText('#game-menu-chapter', currentStory.title || 'La Route des Ronces');
  setText('#game-menu-location', currentStory.node?.title || currentStory.chapterSummary || '');
  restart.hidden = !active;
  home.hidden = view === 'home';
  abandon.hidden = !active || view === 'end';
  $('#game-menu-resume-hint').hidden = view !== 'pause';

  if (view === 'pause') {
    setText('#game-menu-eyebrow', 'Partie suspendue');
    setText('#game-menu-title', 'Le monde attend');
    setText('#game-menu-description', 'Votre position et vos choix sont conservés sur cet appareil.');
    primary.textContent = 'Reprendre';
    primary.dataset.action = 'resume';
    setText('#game-menu-hint', 'Entrée ou Échap pour reprendre');
  } else if (view === 'end') {
    setText('#game-menu-eyebrow', failed ? 'Fin de route' : 'Chapitre accompli');
    setText('#game-menu-title', failed ? 'La route vous repousse' : currentStory.title);
    setText(
      '#game-menu-description',
      currentStory.ending?.outcomeSummary
        || (failed ? 'Cette issue n’est pas définitive. Reprenez l’acte et tentez une autre voie.' : 'Vos choix demeurent dans la chronique.'),
    );
    primary.textContent = failed
      ? 'Reprendre l’acte'
      : currentStory.canContinueAdventure
        ? currentStory.continueLabel || 'Poursuivre l’aventure'
        : 'Revenir à l’accueil';
    primary.dataset.action = failed ? 'retry' : currentStory.canContinueAdventure || currentStory.canContinueFreeChat ? 'continue' : 'home';
    restart.hidden = false;
    setText('#game-menu-hint', failed ? 'Entrée pour reprendre' : 'Entrée pour continuer');
  } else {
    setText('#game-menu-eyebrow', active ? 'Chronique en cours' : 'Chroniques du Sorcier');
    setText('#game-menu-title', 'Fantasy Story');
    setText(
      '#game-menu-description',
      active
        ? endReady ? 'Une conclusion vous attend avant de reprendre la route.' : 'Votre aventure est conservée exactement là où vous l’avez laissée.'
        : 'Une route, quelques charges de magie, et des choix qui demeurent.',
    );
    primary.textContent = active ? endReady ? 'Voir la conclusion' : 'Reprendre la partie' : 'Commencer l’aventure';
    primary.dataset.action = active ? endReady ? 'end' : 'resume' : 'start';
    setText('#game-menu-hint', 'Entrée pour jouer');
  }

  menu.hidden = false;
  $('.app-shell').setAttribute('inert', '');
  $('.app-shell').setAttribute('aria-hidden', 'true');
  if (view === 'home') sessionStorage.removeItem('fantasy-story-entered');
  requestAnimationFrame(() => primary.focus());
}

function closeGameMenu() {
  $('#game-menu').hidden = true;
  $('.app-shell').removeAttribute('inert');
  $('.app-shell').removeAttribute('aria-hidden');
  menuView = null;
  sessionStorage.setItem('fantasy-story-entered', '1');
}

async function beginStory() {
  const story = await window.candy.startStory();
  if (story.requiresAdultConfirmation) {
    closeGameMenu();
    $('#adult-warnings').textContent = (story.warnings || []).join(' · ');
    $('#adult-gate').showModal();
    return;
  }
  resetConversationView();
  if (story.opening) appendMessage('assistant', story.opening);
  renderStory(story);
  state = await window.candy.readCharacter();
  renderProfile();
  closeGameMenu();
}

async function restartCurrentStory() {
  const story = await window.candy.restartStory();
  resetConversationView();
  if (story.opening) appendMessage('assistant', story.opening);
  terminalMenuSignature = null;
  renderStory(story);
  state = await window.candy.readCharacter();
  renderProfile();
  closeGameMenu();
  $('#chapter-menu').open = false;
}

async function continueCurrentStory() {
  const story = await window.candy.continueAfterSuccess();
  if (story.opening) {
    resetConversationView();
    appendMessage('assistant', story.opening);
  }
  terminalMenuSignature = null;
  renderStory(story);
  state = await window.candy.readCharacter();
  renderProfile();
  closeGameMenu();
  $('#prompt').focus();
}

function formatChoiceDetail(choice) {
  if (choice.arcaneChargeCost) {
    const charges = currentStory?.arcaneCharges || 0;
    return `${charges} charge${charges > 1 ? 's' : ''} disponible${charges > 1 ? 's' : ''} · coûte ${choice.arcaneChargeCost}`;
  }
  if (choice.transaction) {
    const gold = currentStory?.progression?.gold || 0;
    const difference = gold - choice.transaction.gold;
    if (difference < 0) return `${Math.abs(difference)} or manquant${Math.abs(difference) > 1 ? 's' : ''}`;
    const item = choice.transaction.item;
    return `${difference} or resteront${item ? ` · +${item.quantity} potion` : ''}`;
  }
  return choice.requirements.map(formatRequirement).join(' · ');
}

function cageSceneFor(story) {
  const scene = CAGE_SCENES[story.node?.id];
  if (!scene) return null;
  const provenance = CAGE_PROVENANCE[story.sourceEndingId];
  const outcome = CAGE_OUTCOMES[story.cageOutcome];
  return {
    ...scene,
    classNames: ['cage-scene', provenance?.className, outcome?.className].filter(Boolean),
  };
}

function thirdLevelSceneFor(story) {
  const inheritedScene = story.sourceEndingId === 'ordres-recuperes'
    ? THIRD_LEVEL_SCENES['cage-de-service']
    : THIRD_LEVEL_SCENES['conduit-du-ravin'];
  const scene = story.node?.id === 'seuil-du-palier'
    ? inheritedScene
    : THIRD_LEVEL_SCENES[story.node?.id];
  if (!scene) return null;
  const provenance = THIRD_LEVEL_PROVENANCE[story.sourceEndingId];
  const outcome = THIRD_LEVEL_OUTCOMES[story.thirdLevelOutcome];
  return {
    ...scene,
    classNames: ['third-scene', provenance?.className, outcome?.className].filter(Boolean),
  };
}

function renderStoryMarkers(story) {
  const markers = $('#scene-state');
  markers.replaceChildren();
  const provenance = story.storyId === 'la-cage-du-treuil'
    ? CAGE_PROVENANCE[story.sourceEndingId]
    : null;
  const outcome = story.storyId === 'la-cage-du-treuil'
    ? CAGE_OUTCOMES[story.cageOutcome]
    : null;
  const thirdProvenance = story.storyId === 'le-troisieme-palier'
    ? THIRD_LEVEL_PROVENANCE[story.sourceEndingId]
    : null;
  const thirdOutcome = story.storyId === 'le-troisieme-palier'
    ? THIRD_LEVEL_OUTCOMES[story.thirdLevelOutcome]
    : null;
  markers.hidden = !provenance && !outcome && !thirdProvenance && !thirdOutcome;
  if (provenance) markers.append(makeSceneMarker('Origine', provenance.label, 'source'));
  if (outcome) markers.append(makeSceneMarker('Issue', outcome.label, 'outcome'));
  if (thirdProvenance) markers.append(makeSceneMarker('Héritage', thirdProvenance.label, 'source'));
  if (thirdOutcome) markers.append(makeSceneMarker('Issue', thirdOutcome.label, 'outcome'));
}

function makeSceneMarker(label, value, kind) {
  const marker = document.createElement('span');
  marker.className = 'scene-marker ' + kind;
  const prefix = document.createElement('small');
  prefix.textContent = label;
  const copy = document.createElement('strong');
  copy.textContent = value;
  marker.append(prefix, copy);
  return marker;
}

function renderSceneArt(story) {
  const scene = story.storyId === 'la-route-des-ronces'
    ? ROUTE_SCENES[story.node?.id]
    : story.storyId === 'la-nuit-a-brumepont'
      ? BRUMEPONT_SCENES[story.node?.id]
      : story.storyId === 'la-cage-du-treuil'
        ? cageSceneFor(story)
        : story.storyId === 'le-troisieme-palier'
          ? thirdLevelSceneFor(story)
          : null;
  const image = $('#scene-art');
  const visual = $('#scene-visual');
  visual.classList.remove(
    'cage-scene', 'cage-from-passage', 'cage-from-road', 'cage-outcome-saved', 'cage-outcome-orders',
    'third-scene', 'third-from-mira', 'third-from-orders', 'third-outcome-closed', 'third-outcome-open',
  );
  image.hidden = !scene;
  if (!scene) {
    image.removeAttribute('src');
    image.alt = '';
    setText('#scene-visual-label', '');
    return;
  }
  for (const className of scene.classNames || []) visual.classList.add(className);
  image.src = scene.src;
  image.alt = scene.alt;
  setText('#scene-visual-label', scene.label);
}

function renderLevelUp(progression) {
  const panel = $('#level-up-panel');
  const available = Boolean(progression?.unspentStatPoints > 0);
  panel.hidden = !available;
  $('#scene-visual').classList.toggle('level-up-active', available);
  if (!available) {
    selectedLevelStat = null;
    $('#level-stat-options').replaceChildren();
    return;
  }
  setText('#level-up-title', `Niveau ${progression.level}`);
  setText('#level-reward-gold', `+${progression.rewardHistory.at(-1)?.gold || 0}`);
  const buttons = Object.entries(STAT_PRESENTATION).map(([stat, presentation]) => {
    const current = progression.stats[stat];
    const next = current + 1;
    const atMaximum = current >= 3;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'level-stat-option';
    button.disabled = atMaximum;
    button.classList.toggle('selected', selectedLevelStat === stat);
    button.setAttribute('aria-pressed', selectedLevelStat === stat ? 'true' : 'false');
    button.innerHTML = '<span class="level-stat-name"><b></b><strong></strong></span><span class="level-stat-value"></span><small></small>';
    button.querySelector('.level-stat-name b').textContent = presentation.short;
    button.querySelector('.level-stat-name strong').textContent = presentation.name;
    button.querySelector('.level-stat-value').textContent = atMaximum ? `${current} · MAX` : `${current} → ${next}`;
    button.querySelector('small').textContent = atMaximum ? presentation.effect(current) : presentation.effect(next);
    button.addEventListener('click', () => {
      selectedLevelStat = stat;
      renderLevelUp(progression);
    });
    return button;
  });
  $('#level-stat-options').replaceChildren(...buttons);
  const selected = selectedLevelStat ? STAT_PRESENTATION[selectedLevelStat] : null;
  const current = selectedLevelStat ? progression.stats[selectedLevelStat] : null;
  setText('#level-preview-title', selected ? `${selected.name} ${current} → ${current + 1}` : 'Sélectionnez une statistique');
  setText('#level-preview-text', selected ? selected.effect(current + 1) : 'L’effet exact sera affiché avant confirmation.');
  $('#level-confirm').disabled = !selected;
  $('#level-confirm').textContent = selected ? `Attribuer à ${selected.name}` : 'Confirmer le point';
}

function renderHero(hero) {
  if (!hero?.stats) return;
  setText('#relation-mood', `Niveau ${hero.level}`);
  for (const stat of ['strength', 'constitution', 'agility', 'wisdom', 'intelligence']) {
    setText(`#stat-${stat}`, hero.stats[stat]);
  }
}

function formatRequirement(requirement) {
  if (Number.isInteger(requirement.gold)) {
    const met = (currentStory?.progression?.gold || 0) >= requirement.gold;
    return `${requirement.gold} or${met ? ' ✓' : ' requis'}`;
  }
  if (Number.isInteger(requirement.arcaneCharges)) {
    const charges = currentStory?.arcaneCharges || 0;
    return `${requirement.arcaneCharges} charge${requirement.arcaneCharges > 1 ? 's' : ''}${charges >= requirement.arcaneCharges ? ' ✓' : ' requise'}`;
  }
  const labels = {
    strength: 'Force',
    constitution: 'Constitution',
    agility: 'Agilité',
    wisdom: 'Sagesse',
    intelligence: 'Intelligence',
  };
  const met = currentStory?.hero?.stats?.[requirement.stat] >= requirement.min;
  return `${labels[requirement.stat] || requirement.stat} ${requirement.min}${met ? ' ✓' : ' requis'}`;
}

const CARD_FAMILY_LABELS = {
  weapon: 'Arme',
  cantrip: 'Sort mineur',
  spell: 'Sort niveau 1',
  item: 'Objet',
};
const CARD_ROLE_LABELS = {
  attack: 'Attaque',
  protection: 'Protection',
  control: 'Contrôle',
  preparation: 'Préparation',
  recovery: 'Soin',
};

function cardEffectLabel(card, resolvedDamage = card.effect?.damage) {
  const effects = [];
  if (card.effect?.concentration) {
    effects.push(`${resolvedDamage} dégâts`);
    effects.push(`puis ${card.effect.concentration.damage} si protégé`);
  } else if (resolvedDamage) {
    effects.push(`${resolvedDamage} dégâts`);
  }
  if (card.effect?.block) effects.push(`Bloque ${card.effect.block}`);
  if (card.effect?.status?.id === 'slowed') {
    effects.push(`Pioche ennemie −${card.effect.status.stacks}`);
  }
  if (card.effect?.status?.id === 'advantage') effects.push('Prochaine Action gratuite');
  return effects.join(' · ');
}

function chargeCostLabel(card) {
  return card.chargeCost > 0
    ? `✦ ${card.chargeCost} charge${card.chargeCost > 1 ? 's' : ''}`
    : 'Sans charge';
}

function renderCombat(combat, combatItems = []) {
  const panel = $('#combat-panel');
  panel.hidden = !combat;
  document.documentElement.classList.toggle('combat-running', Boolean(combat));
  $('#scene-visual').classList.toggle('combat-active', Boolean(combat));
  if (!combat) {
    if ($('#combat-grimoire').open) $('#combat-grimoire').close();
    $('#combat-cards').replaceChildren();
    $('#combat-log').replaceChildren();
    $('#combat-potion').hidden = true;
    return;
  }
  renderCombatGrimoire(combat);
  $('#combat-deck-open').disabled = false;
  $('#combat-discard-open').disabled = false;
  setText('#combat-round', `Round ${combat.round}`);
  setText(
    '#combat-phase',
    combat.phase === 'player'
      ? 'À vous d’agir'
      : `Réaction · ${combat.enemy.hand.length} action${combat.enemy.hand.length > 1 ? 's' : ''} ennemie${combat.enemy.hand.length > 1 ? 's' : ''}`,
  );
  const actionsRemaining = combat.player.actionLimit - combat.player.actionsPlayed;
  setText('#combat-actions', `${actionsRemaining} disponible${actionsRemaining > 1 ? 's' : ''}`);
  $('#combat-action-pips').replaceChildren(...Array.from(
    { length: combat.player.actionLimit },
    (_, index) => {
      const pip = document.createElement('i');
      pip.className = index < combat.player.actionsPlayed ? 'spent' : 'ready';
      return pip;
    },
  ));
  setText('#combat-charges', `✦ ${combat.player.spellUses} / ${combat.player.maxSpellUses} charges`);
  setText('#combat-player-name', combat.player.name);
  setText('#combat-player-hp', `${combat.player.hp} / ${combat.player.maxHp} PV`);
  setText('#combat-enemy-name', combat.enemy.name);
  setText('#combat-enemy-hp', `${combat.enemy.hp} / ${combat.enemy.maxHp} PV`);
  const renderFighterPortrait = (selector, fighter) => {
    const image = $(selector);
    const frame = image.closest('.fighter-portrait');
    frame.hidden = !fighter.portrait;
    image.src = fighter.portrait || '';
    image.alt = fighter.portrait ? `Portrait de ${fighter.name}` : '';
  };
  renderFighterPortrait('#combat-player-portrait', combat.player);
  renderFighterPortrait('#combat-enemy-portrait', combat.enemy);
  $('#combat-player-meter').style.width = `${(combat.player.hp / combat.player.maxHp) * 100}%`;
  $('#combat-enemy-meter').style.width = `${(combat.enemy.hp / combat.enemy.maxHp) * 100}%`;
  const pendingDisadvantage = combat.pendingAttack?.effect?.status?.id === 'disadvantage';
  setText('#combat-intent-title', combat.pendingAttack?.name || 'Initiative');
  setText(
    '#combat-intent-text',
    combat.pendingAttack
      ? `${combat.pendingAttack.damage} dégât${combat.pendingAttack.damage > 1 ? 's' : ''} annoncé${combat.pendingAttack.damage > 1 ? 's' : ''}. Choisissez votre Réaction.`
      : `Jouez vos cartes Action ou terminez votre tour.`,
  );
  setText(
    '#combat-enemy-hand-count',
    combat.pendingAttack
      ? `${combat.enemy.hand.length} carte${combat.enemy.hand.length > 1 ? 's' : ''} en attente`
      : 'Aucune carte en attente',
  );
  $('#combat-intent-effects').replaceChildren(...(
    pendingDisadvantage
      ? [Object.assign(document.createElement('span'), { textContent: 'Désavantage' })]
      : []
  ));
  $('#combat-intent').classList.toggle('threatens-disadvantage', pendingDisadvantage);
  setText('#combat-draw-count', combat.drawPile.length);
  setText('#combat-hand-count', `${combat.hand.length} carte${combat.hand.length > 1 ? 's' : ''}`);
  setText('#combat-discard-count', combat.discardPile.length);
  setText('#combat-enemy-draw-count', combat.enemy.drawPile.length);
  setText('#combat-enemy-discard-count', combat.enemy.discardPile.length);
  const tempo = combat.player.statuses.find(
    (status) => ['advantage', 'disadvantage'].includes(status.id),
  ) || null;
  const concentration = combat.player.statuses.find(
    (status) => status.id === 'concentration',
  ) || null;
  const tempoCost = tempo?.id === 'advantage' ? 0 : tempo?.id === 'disadvantage' ? 2 : 1;
  setText('#combat-tempo-state', tempo?.name || 'Neutre');
  setText('#combat-tempo-cost', `Prochaine Action · coût ${tempoCost}`);
  $('#combat-tempo').className = `combat-tempo ${tempo?.id || 'neutral'}`;
  panel.classList.toggle('has-advantage', tempo?.id === 'advantage');
  panel.classList.toggle('has-disadvantage', tempo?.id === 'disadvantage');
  panel.classList.toggle('has-concentration', Boolean(concentration));
  panel.classList.toggle('is-reaction', combat.phase === 'reaction');
  const concentrationEvents = combat.log
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => [
      'concentration_broken',
      'concentration_triggered',
    ].includes(entry.type));
  const lastConcentrationEvent = concentrationEvents.at(-1) || null;
  const actedAfterConcentrationEvent = lastConcentrationEvent
    ? combat.log.slice(lastConcentrationEvent.index + 1).some(
      (entry) => entry.type === 'card' && entry.round === combat.round,
    )
    : false;
  const concentrationAftermath = !concentration
    && lastConcentrationEvent
    && !actedAfterConcentrationEvent
    ? lastConcentrationEvent.entry
    : null;
  const concentrationPanel = $('#combat-concentration');
  concentrationPanel.hidden = !concentration && !concentrationAftermath;
  concentrationPanel.className = `combat-concentration ${
    concentration
      ? 'active'
      : concentrationAftermath?.type === 'concentration_broken'
        ? 'broken'
        : 'triggered'
  }`;
  setText(
    '#combat-concentration-label',
    concentration
      ? 'Sort concentré'
      : concentrationAftermath?.type === 'concentration_broken'
        ? 'Fil rompu'
        : 'Sort déclenché',
  );
  setText(
    '#combat-concentration-name',
    concentration?.sourceCardName || 'Orbe suspendu',
  );
  setText(
    '#combat-concentration-effect',
    concentration
      ? `${concentration.damage} dégâts au début du prochain tour`
      : concentrationAftermath?.type === 'concentration_broken'
        ? 'Les dégâts différés sont perdus'
        : '5 dégâts infligés avant la pioche',
  );
  $('#combat-player-statuses').replaceChildren(...combat.player.statuses.map((status) => {
    const badge = document.createElement('span');
    badge.className = `combat-status ${status.id}`;
    badge.textContent = status.id === 'concentration'
      ? `${status.name} · ${status.damage} dégâts différés`
      : `${status.name} · Action ${status.id === 'advantage' ? '0' : '2'}`;
    badge.title = status.description;
    return badge;
  }));
  $('#combat-enemy-statuses').replaceChildren(...combat.enemy.statuses.map((status) => {
    const badge = document.createElement('span');
    badge.className = `combat-status ${status.id}`;
    badge.textContent = `${status.name} ${status.stacks} · prochaine pioche −${status.stacks}`;
    badge.title = status.description;
    return badge;
  }));
  $('#combat-cards').replaceChildren(...combat.cards.map((card) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `combat-card family-${card.family} role-${card.role} timing-${card.timing}${card.timing === 'action' ? ` action-cost-${card.actionCost}` : ''}`;
    button.disabled = !card.available;
    button.innerHTML = '<div class="card-topline"><span class="card-family"></span><span class="card-role"></span><em class="card-action-cost"></em></div><strong></strong><b class="card-effect"></b><div class="card-footer"><small class="card-timing"></small><span class="card-charge-cost"></span></div>';
    button.querySelector('.card-family').textContent = CARD_FAMILY_LABELS[card.family];
    button.querySelector('.card-role').textContent = CARD_ROLE_LABELS[card.role];
    const actionCostBadge = button.querySelector('.card-action-cost');
    actionCostBadge.hidden = card.timing !== 'action';
    actionCostBadge.textContent = `${card.actionCost} Action${card.actionCost > 1 ? 's' : ''}`;
    button.querySelector('strong').textContent = card.name;
    button.querySelector('.card-effect').textContent = cardEffectLabel(card, card.resolvedDamage);
    button.querySelector('.card-timing').textContent = card.timing === 'reaction'
      ? 'Réaction à une attaque'
      : card.family === 'weapon'
        ? `Action · Force × ${combat.player.stats.strength}`
        : 'Action';
    button.querySelector('.card-charge-cost').textContent = chargeCostLabel(card);
    if (!card.available && card.timing === 'action' && card.actionCost > actionsRemaining) {
      button.title = `Cette carte exige ${card.actionCost} Actions ; ${actionsRemaining} seulement disponible${actionsRemaining > 1 ? 's' : ''}.`;
    } else if (!card.available && card.effect.concentration && concentration) {
      button.title = 'Un Orbe est déjà suspendu.';
    }
    button.addEventListener('click', () => playCombatCard(card.instanceId));
    return button;
  }));
  const potion = combatItems.find((item) => item.id === 'healing-potion');
  $('#combat-potion').hidden = !potion || potion.count < 1;
  $('#combat-potion').disabled = !potion?.available;
  $('#combat-potion').className = `combat-item family-${potion?.family || 'item'} role-${potion?.role || 'recovery'} timing-${potion?.timing || 'action'}`;
  setText('#combat-potion-family', CARD_FAMILY_LABELS[potion?.family] || 'Objet');
  setText('#combat-potion-role', CARD_ROLE_LABELS[potion?.role] || 'Soin');
  setText('#combat-potion-cost', `+${potion?.heal || 5} PV · ${potion?.actionCost || 1} Action`);
  $('#combat-potion').title = !potion
    ? ''
    : potion.available
      ? `Soigne jusqu’à ${potion.heal} PV et consomme ${potion.actionCost} Action`
      : combat.player.hp >= combat.player.maxHp
        ? 'Vos points de vie sont déjà au maximum'
        : combat.phase !== 'player'
          ? 'Utilisable pendant votre phase d’action'
          : 'Vous n’avez plus d’Action ce round';
  $('#combat-potion b').textContent = `×${potion?.count || 0}`;
  $('#combat-end-turn').hidden = combat.phase !== 'player';
  $('#combat-end-turn').disabled = false;
  $('#combat-end-turn').textContent = 'Terminer le tour';
  $('#combat-pass').hidden = combat.phase !== 'reaction';
  $('#combat-pass').disabled = false;
  $('#combat-log').replaceChildren(...combat.log.slice(-4).reverse().map((entry) => {
    const item = document.createElement('li');
    item.textContent = entry.text;
    return item;
  }));
}

function renderCombatGrimoire(combat) {
  const cards = combat.deckCards || [];
  setText(
    '#combat-grimoire-description',
    `${cards.length} cartes. La défausse reforme la pioche quand elle est vide.`,
  );
  const zones = {
    draw: { label: 'Pioche', order: 0 },
    hand: { label: 'Main', order: 1 },
    discard: { label: 'Défausse', order: 2 },
  };
  $('#combat-grimoire-zones').replaceChildren(...Object.entries(zones).map(
    ([zone, presentation]) => {
      const marker = document.createElement('span');
      marker.className = `grimoire-zone ${zone}`;
      marker.innerHTML = '<i></i><strong></strong><small></small>';
      marker.querySelector('strong').textContent = cards.filter(
        (card) => card.zone === zone,
      ).length;
      marker.querySelector('small').textContent = presentation.label;
      return marker;
    },
  ));
  const orderedCards = [...cards].sort((left, right) => (
    zones[left.zone].order - zones[right.zone].order
    || left.instanceId.localeCompare(right.instanceId, 'fr')
  ));
  $('#combat-grimoire-cards').replaceChildren(...orderedCards.map((card) => {
    const item = document.createElement('article');
    item.className = `grimoire-card family-${card.family} role-${card.role} timing-${card.timing} zone-${card.zone}`;
    item.innerHTML = '<div class="grimoire-card-topline"><span class="card-family"></span><span class="card-role"></span><em></em></div><strong></strong><p></p><div class="grimoire-card-footer"><b></b><small></small></div>';
    item.querySelector('.card-family').textContent = CARD_FAMILY_LABELS[card.family];
    item.querySelector('.card-role').textContent = CARD_ROLE_LABELS[card.role];
    item.querySelector('em').textContent = zones[card.zone].label;
    item.querySelector('strong').textContent = card.name;
    item.querySelector('p').textContent = cardEffectLabel(card);
    item.querySelector('b').textContent = card.timing === 'reaction' ? 'Réaction' : 'Action';
    item.querySelector('small').textContent = chargeCostLabel(card);
    return item;
  }));
}

$('#chapter-action').addEventListener('click', beginStory);
$('#chapter-restart').addEventListener('click', restartCurrentStory);
$('#act-retry').addEventListener('click',async()=>{const story=await window.candy.retryStoryAct();await reloadConversation();renderStory(story);});
$('#chapter-continue').addEventListener('click', continueCurrentStory);
$('#chapter-quit').addEventListener('click',async()=>{renderStory(await window.candy.quitStory());$('#chapter-menu').open=false;});

$('#game-menu-primary').addEventListener('click', async () => {
  const action = $('#game-menu-primary').dataset.action;
  if (action === 'start') await beginStory();
  else if (action === 'resume') closeGameMenu();
  else if (action === 'end') closeGameMenu();
  else if (action === 'retry') {
    const story = await window.candy.retryStoryAct();
    await reloadConversation();
    terminalMenuSignature = null;
    renderStory(story);
    closeGameMenu();
  } else if (action === 'continue') await continueCurrentStory();
  else showGameMenu('home');
});
$('#game-menu-home').addEventListener('click', () => showGameMenu('home'));
$('#game-menu-settings').addEventListener('click', () => $('#edit-character').click());
$('#game-menu-restart').addEventListener('click', () => openMenuConfirmation('restart'));
$('#game-menu-abandon').addEventListener('click', () => openMenuConfirmation('abandon'));

function openMenuConfirmation(action) {
  pendingMenuConfirmation = action;
  const abandoning = action === 'abandon';
  setText('#game-menu-confirm-title', abandoning ? 'Abandonner la partie ?' : 'Recommencer l’aventure ?');
  setText(
    '#game-menu-confirm-copy',
    abandoning
      ? 'La partie en cours sera fermée. Les conséquences déjà acquises resteront enregistrées.'
      : 'La progression de cette aventure sera remplacée par son point de départ.',
  );
  $('#game-menu-confirm-action').textContent = abandoning ? 'Abandonner' : 'Recommencer';
  $('#game-menu-confirm-action').classList.toggle('danger', abandoning);
  $('#game-menu-confirm').showModal();
}

$('#game-menu-confirm-form').addEventListener('submit', async (event) => {
  if (event.submitter?.value === 'cancel') {
    pendingMenuConfirmation = null;
    return;
  }
  event.preventDefault();
  $('#game-menu-confirm').close();
  if (pendingMenuConfirmation === 'restart') await restartCurrentStory();
  else if (pendingMenuConfirmation === 'abandon') {
    const story = await window.candy.quitStory();
    terminalMenuSignature = null;
    renderStory(story);
    showGameMenu('home');
  }
  pendingMenuConfirmation = null;
});

async function playStoryChoice(choiceId) {
  const buttons=[...document.querySelectorAll('#story-options button')];buttons.forEach((button)=>button.disabled=true);
  try { const result=await window.candy.chooseStoryOption(choiceId);appendMessage('user',result.playerText);appendMessage('assistant',result.text);renderStory(result.story);state=await window.candy.readCharacter();renderProfile(); }
  catch(error){setConnection('error',error.message);buttons.forEach((button)=>button.disabled=false);}
}
async function playCombatCard(cardId) {
  setCombatBusy(true);
  try {
    const result = await window.candy.playCombatCard(cardId);
    if (result.outcome) await reloadConversation();
    renderStory(result.story);
    state = await window.candy.readCharacter();
    renderProfile();
  } catch (error) {
    setConnection('error', error.message);
  } finally {
    setCombatBusy(false);
  }
}
async function passCombatReaction() {
  setCombatBusy(true);
  try {
    const result = await window.candy.passCombatReaction();
    if (result.outcome) await reloadConversation();
    renderStory(result.story);
    state = await window.candy.readCharacter();
    renderProfile();
  } catch (error) {
    setConnection('error', error.message);
  } finally {
    setCombatBusy(false);
  }
}
async function endCombatTurn() {
  setCombatBusy(true);
  try {
    const result = await window.candy.endCombatTurn();
    renderStory(result.story);
    state = await window.candy.readCharacter();
    renderProfile();
  } catch (error) {
    setConnection('error', error.message);
  } finally {
    setCombatBusy(false);
  }
}
async function useCombatItem() {
  setCombatBusy(true);
  try {
    const result = await window.candy.useCombatItem('healing-potion');
    renderStory(result.story);
    state = await window.candy.readCharacter();
    renderProfile();
    setConnection('online', `Potion bue · +${result.healed} PV`);
  } catch (error) {
    setConnection('error', error.message);
  } finally {
    setCombatBusy(false);
  }
}
function setCombatBusy(busy) {
  if (busy) {
    document.querySelectorAll('#combat-panel button').forEach((button) => { button.disabled = true; });
  } else {
    renderCombat(currentStory?.combat || null, currentStory?.combatItems || []);
  }
}
$('#combat-pass').addEventListener('click', passCombatReaction);
$('#combat-end-turn').addEventListener('click', endCombatTurn);
$('#combat-potion').addEventListener('click', useCombatItem);
for (const selector of ['#combat-deck-open', '#combat-discard-open']) {
  $(selector).addEventListener('click', () => {
    renderCombatGrimoire(currentStory.combat);
    $('#combat-grimoire').showModal();
  });
}
$('#level-confirm').addEventListener('click', async () => {
  if (!selectedLevelStat) return;
  const button = $('#level-confirm');
  button.disabled = true;
  try {
    const result = await window.candy.allocateProgressionStat(selectedLevelStat);
    selectedLevelStat = null;
    state = await window.candy.readCharacter();
    renderProfile();
    renderStory(result.story);
    setConnection('online', 'Niveau 2 enregistré');
  } catch (error) {
    setConnection('error', error.message);
    renderLevelUp(currentStory?.progression);
  }
});
async function reloadConversation(){state=await window.candy.readCharacter();resetConversationView();state.conversation.messages.forEach((message)=>appendMessage(message.role,message.content));renderProfile();}

$('#adult-confirm').addEventListener('change',(event)=>{$('#adult-start').disabled=!event.target.checked;});
$('#adult-gate-form').addEventListener('submit',async(event)=>{if(event.submitter?.value==='cancel')return;event.preventDefault();if(!$('#adult-confirm').checked)return;await window.candy.confirmAdultAccess();$('#adult-gate').close();const story=await window.candy.startStory();resetConversationView();appendMessage('assistant',story.opening);renderStory(story);state=await window.candy.readCharacter();renderProfile();});

window.candy.onEvent((event) => {
  if (event.type === 'status') setConnection(event.state === 'connected' ? 'online' : 'error', event.state === 'connected' ? 'Narrateur prêt' : event.message || 'Narrateur indisponible');
  if (event.type === 'delta' && window.liveReply) { window.liveReply.dataset.raw += event.text; queueTypewriter(window.liveReply,event.text); }
  if (event.type === 'replace' && window.liveReply) { window.liveReply.dataset.raw = event.text; queueTypewriter(window.liveReply,event.text,{replace:true}); }
});

$('#composer').addEventListener('submit', async (event) => {
  event.preventDefault(); const input = $('#prompt'); const draft = input.value.trim(); if (!draft) return; const text = inputMode === 'action' && !/^\*[^*]+\*$/.test(draft) ? `*${draft}*` : draft;
  appendMessage('user', text); input.value = ''; input.disabled = true; $('#send').disabled = true;
  const typing = document.createElement('p'); typing.className = 'typing'; typing.textContent = `${state.character.identity.name} écrit…`; $('#messages').append(typing);
  window.liveReply = appendMessage('assistant', '');
  try { const result = await window.candy.send(text); window.liveReply.dataset.raw = result.text; if ((window.liveReply.dataset.typewriterTarget||'') !== result.text) queueTypewriter(window.liveReply,result.text,{replace:true}); state = await window.candy.readCharacter(); renderStory(result.story); }
  catch (error) { const message = `Connexion impossible : ${error.message}`; window.liveReply.dataset.raw = message; renderMessageContent(window.liveReply, message); setConnection('error', 'Narrateur indisponible'); }
  finally { typing.remove(); window.liveReply = null; input.disabled = false; $('#send').disabled = false; input.focus(); }
});

$('#prompt').addEventListener('input', (event) => {
  event.currentTarget.style.height = 'auto';
  event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 120)}px`;
});
$('#prompt').addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); $('#composer').requestSubmit(); }
});
function setInputMode(mode) {
  inputMode = mode;
  document.querySelectorAll('.input-mode').forEach((button) => { const active = button.dataset.mode === mode; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  $('#prompt').placeholder = mode === 'action' ? 'Décrivez ce que vous faites…' : 'Dites quelque chose ou décrivez votre action…';
}
document.querySelectorAll('.input-mode').forEach((button) => button.addEventListener('click', () => { setInputMode(button.dataset.mode); $('#prompt').focus(); }));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !document.querySelector('dialog[open]')) {
    if (menuView === 'pause') {
      event.preventDefault();
      closeGameMenu();
    } else if (!menuView && currentStory?.active && !currentStory.terminal) {
      event.preventDefault();
      showGameMenu('pause');
    }
    return;
  }
  if (event.key === 'Enter' && menuView && !document.querySelector('dialog[open]')) {
    event.preventDefault();
    $('#game-menu-primary').click();
    return;
  }
  if (!menuView && /^[1-4]$/.test(event.key) && !['INPUT','TEXTAREA'].includes(event.target.tagName)) {
    $('#story-options button:nth-child('+event.key+')')?.click();
  }
});

$('#edit-character').addEventListener('click', () => {
  const c = state.character; const form = $('#editor-form');
  form.elements.name.value = c.identity.name; form.elements.occupation.value = c.identity.occupation; form.elements.mood.value = c.scene.mood; form.elements.location.value = c.scene.location; form.elements.time.value = c.scene.time; form.elements.outfit.value = c.scene.outfit; form.elements.temperament.value = c.personality.traits.join(', '); $('#editor').showModal();
});
$('#profile-shortcut').addEventListener('click', () => $('#edit-character').click());
$('#header-profile').addEventListener('click', () => $('#edit-character').click());
$('#editor-form').addEventListener('submit', async (event) => {
  if (event.submitter.value === 'cancel') return; event.preventDefault(); const f = event.currentTarget.elements;
  state = await window.candy.updateCharacterProfile({ name: f.name.value.trim(), occupation: f.occupation.value.trim(), traits: f.temperament.value.split(',').map((x) => x.trim()).filter(Boolean), mood: f.mood.value.trim(), location: f.location.value.trim(), time: f.time.value.trim(), outfit: f.outfit.value.trim() });
  renderProfile(); $('#editor').close();
});

setInterval(async () => { try { renderStory(await window.candy.readStory()); } catch { /* fenêtre en fermeture */ } }, 1200);
boot();
