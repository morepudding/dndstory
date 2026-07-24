const $ = (selector) => document.querySelector(selector);
let graph;
let report;
let selectedNodeId;
let cy;
let saveTimer;
let play = null;

async function boot() {
  const loaded = await window.candyStudio.read();
  graph = loaded.graph;
  report = loaded.report;
  selectedNodeId = graph.entryNodeId;
  renderOverview();
  renderLibrary();
  renderInspector();
  buildCytoscape();
  setSaveStatus(loaded.source === 'draft' ? 'Brouillon restauré' : 'Brouillon chargé');
}

function showView(id) {
  document.querySelectorAll('.view,.main-tabs button').forEach((item) => item.classList.remove('active'));
  $(`#${id}`).classList.add('active');
  $(`.main-tabs button[data-view="${id}"]`).classList.add('active');
  if (id === 'tree') setTimeout(() => { cy.resize(); cy.fit(undefined, 36); }, 0);
  if (id === 'play' && !play) startPlay(graph.entryNodeId);
}

document.querySelectorAll('.main-tabs button').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));

function renderOverview() {
  const metrics = report.metrics;
  $('#story-title').textContent = graph.title;
  $('#story-summary').textContent = graph.chapterSummary;
  const values = [
    [graph.acts.length, 'actes'],
    [metrics.nodeCount, 'scènes écrites'],
    [metrics.successPathCount, 'routes gagnantes'],
    [metrics.failureEndingCount, 'fins d’échec'],
  ];
  $('#key-metrics').innerHTML = values.map(([value, label]) => `<div class="key-metric"><b>${value}</b><span>${label}</span></div>`).join('');
  $('#act-overview').replaceChildren(...graph.acts.map((act) => {
    const article = document.createElement('article');
    article.className = 'act-card';
    article.innerHTML = `<span class="act-number">${act.index}</span><h3>${escapeHtml(act.title)}</h3><div><p>${escapeHtml(act.summary)}</p><button>Tester cet acte</button></div>`;
    article.querySelector('button').addEventListener('click', () => startPlay(act.entryNodeId));
    return article;
  }));
  const valid = report.accepted;
  $('#quality-badge').className = `quality-badge ${valid ? 'ok' : 'bad'}`;
  $('#quality-badge').textContent = valid ? '✓ Structure valide' : `${report.errors.length} problème(s)`;
  $('#quality-summary').className = `summary-card quality-summary ${valid ? 'good' : 'bad'}`;
  $('#quality-summary').innerHTML = valid
    ? '<b>Prêt à jouer</b><span>La même arborescence alimente l’aperçu et l’application Electron.</span>'
    : `<b>${report.errors.length} erreur(s) à corriger</b><span>${escapeHtml(report.errors[0]?.message || '')}</span>`;
}

$('#start-story').addEventListener('click', () => startPlay(graph.entryNodeId));

function buildCytoscape() {
  cy = cytoscape({
    container: $('#graph'),
    elements: graphElements(),
    style: [
      { selector: 'node', style: { label: 'data(label)', color: '#eee9e1', 'font-size': 10, 'text-wrap': 'wrap', 'text-max-width': 105, width: 128, height: 42, shape: 'round-rectangle', 'background-color': '#3b5877', 'border-width': 1, 'border-color': '#6683a2' } },
      { selector: 'node[kind="success"]', style: { 'background-color': '#326644', 'border-color': '#72c68b' } },
      { selector: 'node[kind="failure"]', style: { 'background-color': '#67363a', 'border-color': '#e56b72' } },
      { selector: 'node:selected', style: { 'border-width': 3, 'border-color': '#ef786a' } },
      { selector: 'node:parent', style: { label: 'data(label)', 'text-valign': 'top', 'text-halign': 'left', 'font-size': 13, 'background-opacity': .12, 'border-style': 'dashed', padding: 22 } },
      { selector: 'edge', style: { label: 'data(label)', color: '#aaa49b', 'font-size': 8, width: 1.4, 'line-color': '#706a61', 'target-arrow-color': '#706a61', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'text-wrap': 'ellipsis', 'text-max-width': 95, 'text-background-color': '#171613', 'text-background-opacity': .85, 'text-background-padding': 2 } },
    ],
    layout: graphLayout(false),
  });
  cy.on('tap', 'node[kind]', (event) => {
    selectedNodeId = event.target.id();
    renderLibrary();
    renderInspector();
  });
}

function graphElements() {
  const acts = graph.acts.map((act) => ({ data: { id: `group-${act.id}`, label: `${act.index}. ${act.title}` } }));
  const nodes = graph.nodes.map((node) => ({ data: { id: node.id, label: node.title, kind: node.kind, parent: `group-${node.actId}` } }));
  const edges = graph.nodes.flatMap((node) => (node.choices || []).map((choice) => ({ data: { id: `${node.id}--${choice.id}`, source: node.id, target: choice.targetNodeId, label: choice.label } })));
  return [...acts, ...nodes, ...edges];
}

function graphLayout(animate) { return { name: 'breadthfirst', directed: true, padding: 34, spacingFactor: 1.35, roots: `#${graph.entryNodeId}`, animate }; }
function rebuildGraph() { cy.destroy(); buildCytoscape(); if ($('#tree').classList.contains('active')) setTimeout(() => cy.fit(undefined, 36), 0); }
$('#layout').addEventListener('click', () => cy.layout(graphLayout(true)).run());
$('#fit').addEventListener('click', () => cy.fit(undefined, 36));

function renderLibrary() {
  $('#node-list').replaceChildren(...graph.acts.map((act) => {
    const group = document.createElement('section');
    group.className = 'act-group';
    const heading = document.createElement('button');
    heading.innerHTML = `<span>${act.index}. ${escapeHtml(act.title)}</span><small>${graph.nodes.filter((node) => node.actId === act.id).length}</small>`;
    group.append(heading);
    for (const node of graph.nodes.filter((item) => item.actId === act.id)) {
      const button = document.createElement('button');
      button.className = `node-link ${node.id === selectedNodeId ? 'active' : ''}`;
      button.innerHTML = `<i class="node-dot ${node.kind}"></i><span>${escapeHtml(node.title)}</span>`;
      button.addEventListener('click', () => selectNode(node.id));
      group.append(button);
    }
    return group;
  }));
}

function selectNode(id) {
  selectedNodeId = id;
  renderLibrary();
  renderInspector();
}

function selectedNode() { return graph.nodes.find((node) => node.id === selectedNodeId); }

function renderInspector() {
  const node = selectedNode();
  if (!node) return;
  $('#selection-title').textContent = node.title;
  $('#selection-kind').textContent = kindLabel(node.kind);
  const form = $('#node-form');
  form.elements.actId.replaceChildren(...graph.acts.map((act) => option(act.id, `${act.index}. ${act.title}`)));
  for (const key of ['id', 'actId', 'kind', 'title', 'text']) form.elements[key].value = node[key] || '';

  const terminalEditor = $('#terminal-editor');
  terminalEditor.hidden = !['success', 'failure'].includes(node.kind);
  if (['success', 'failure'].includes(node.kind)) {
    const terminal = node.terminal || {};
    terminalEditor.querySelector('[name="endingId"]').value = terminal.endingId || '';
    terminalEditor.querySelector('[name="reason"]').value = terminal.reason || '';
    terminalEditor.querySelector('[name="outcomeSummary"]').value = terminal.outcomeSummary || '';
    const retry = terminalEditor.querySelector('[name="retryActId"]');
    retry.replaceChildren(...graph.acts.map((act) => option(act.id, `${act.index}. ${act.title}`)));
    retry.value = terminal.retryActId || node.actId;
    $('#retry-act-label').hidden = node.kind === 'success';
  }
  $('#choice-list').replaceChildren(...(node.choices || []).map((choice) => choiceCard(node, choice)));
  $('#choice-editor').hidden = node.kind !== 'choice';
  $('#add-choice').disabled = node.kind !== 'choice' || node.choices.length >= 4;
}

function choiceCard(node, choice) {
  const card = document.createElement('article');
  card.className = 'choice-card';
  card.innerHTML = `<div class="choice-head"><input data-field="id" aria-label="Identifiant du choix"/><button type="button" title="Supprimer">×</button></div><label>Libellé<input data-field="label"/></label><label>Texte exact du joueur<textarea data-field="playerText" rows="2"></textarea></label><label>Scène suivante<select data-field="targetNodeId"></select></label><div class="two"><label>Condition<select data-field="stat"><option value="">Aucune</option><option value="strength">Force</option><option value="constitution">Constitution</option><option value="agility">Agilité</option><option value="wisdom">Sagesse</option><option value="intelligence">Intelligence</option></select></label><label>Seuil<select data-field="min"><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></label></div>`;
  const targets = card.querySelector('[data-field="targetNodeId"]');
  targets.replaceChildren(...graph.nodes.filter((item) => validTarget(node, item) || item.id === choice.targetNodeId).map((item) => option(item.id, `${item.title} · ${kindLabel(item.kind)}`)));
  for (const field of ['id', 'label', 'playerText', 'targetNodeId']) card.querySelector(`[data-field="${field}"]`).value = choice[field] || '';
  card.querySelector('[data-field="stat"]').value = choice.requirements?.[0]?.stat || '';
  card.querySelector('[data-field="min"]').value = String(choice.requirements?.[0]?.min || 1);
  const update = () => {
    for (const field of ['id', 'label', 'playerText', 'targetNodeId']) choice[field] = card.querySelector(`[data-field="${field}"]`).value;
    const stat = card.querySelector('[data-field="stat"]').value;
    if (stat) choice.requirements = [{ stat, min: Number(card.querySelector('[data-field="min"]').value) }];
    else delete choice.requirements;
    changed(true);
  };
  card.addEventListener('input', update);
  card.addEventListener('change', update);
  card.querySelector('button').addEventListener('click', () => { node.choices = node.choices.filter((item) => item !== choice); renderInspector(); changed(true); });
  return card;
}

function validTarget(source, target) {
  if (target.id === source.id) return false;
  if (target.kind !== 'choice') return true;
  const from = graph.acts.find((act) => act.id === source.actId)?.index;
  const to = graph.acts.find((act) => act.id === target.actId)?.index;
  return to >= from && to <= from + 1;
}

$('#node-form').addEventListener('input', (event) => {
  const node = selectedNode();
  const field = event.target.name;
  if (!node || !field || field === 'id') return;
  const oldKind = node.kind;
  node[field] = event.target.value;
  if (field === 'kind' && oldKind !== node.kind) {
    if (node.kind === 'choice') { node.choices = []; delete node.terminal; delete node.combat; delete node.victoryTargetNodeId; delete node.defeatTargetNodeId; }
    else if (node.kind === 'combat') {
      node.choices = [];
      delete node.terminal;
      node.victoryTargetNodeId = graph.nodes.find((item) => item.kind === 'success')?.id || '';
      node.defeatTargetNodeId = graph.nodes.find((item) => item.kind === 'failure')?.id || '';
      const template = graph.nodes.find((item) => item !== node && item.kind === 'combat')?.combat;
      node.combat = structuredClone(template || {
        player: {
          name: 'Sorcier',
          cards: [
            { id: 'baton', name: 'Bâton', type: 'action', kind: 'weapon', cost: 0, description: 'Attaque d’arme.', effect: { damage: 2 } },
            { id: 'braise', name: 'Braise', type: 'action', kind: 'cantrip', cost: 0, description: 'Sort mineur.', effect: { damage: 3 } },
            { id: 'voile', name: 'Voile', type: 'reaction', kind: 'spell', cost: 1, description: 'Défense magique.', effect: { block: 3 } },
            {
              id: 'entrave',
              name: 'Entrave de givre',
              type: 'reaction',
              kind: 'spell',
              cost: 1,
              description: 'Défense qui ralentit la prochaine pioche ennemie.',
              effect: { block: 1, status: { id: 'slowed', target: 'enemy', stacks: 1 } },
            },
          ],
          deck: ['braise', 'voile', 'entrave', 'baton', 'braise'],
        },
        enemy: {
          name: 'Adversaire',
          maxHp: 10,
          drawCount: 2,
          cards: [
            { id: 'attaque', name: 'Attaque', damage: 2, description: 'Une attaque directe.' },
            { id: 'feinte', name: 'Feinte', damage: 1, description: 'Une attaque rapide.' },
          ],
          deck: ['attaque', 'feinte', 'attaque', 'feinte'],
        },
      });
    }
    else {
      node.choices = []; delete node.combat; delete node.victoryTargetNodeId; delete node.defeatTargetNodeId;
      node.terminal = { endingId: uniqueId(`ending-${node.id}`, graph.nodes.map((item) => item.terminal?.endingId).filter(Boolean)), reason: 'Raison narrative à écrire.', outcomeSummary: 'Résumé de cette fin à écrire.', ...(node.kind === 'failure' ? { retryActId: node.actId } : {}) };
    }
    renderInspector();
  }
  changed(['actId', 'kind', 'title'].includes(field));
});

$('#terminal-editor').addEventListener('input', (event) => {
  const node = selectedNode();
  if (!node || node.kind === 'choice' || !event.target.name) return;
  node.terminal ||= {};
  node.terminal[event.target.name] = event.target.value;
  if (node.kind === 'success') delete node.terminal.retryActId;
  changed(false);
});

$('#add-choice').addEventListener('click', () => {
  const node = selectedNode();
  if (node.kind !== 'choice' || node.choices.length >= 4) return;
  const target = graph.nodes.find((item) => validTarget(node, item));
  if (!target) return setSaveStatus('Ajoute d’abord une scène cible.', true);
  const id = uniqueId(`${node.id}-choice`, graph.nodes.flatMap((item) => item.choices.map((choice) => choice.id)));
  node.choices.push({ id, label: 'Nouveau choix', playerText: 'Texte exact du joueur.', targetNodeId: target.id });
  renderInspector();
  changed(true);
});

$('#add-node').addEventListener('click', () => {
  const act = graph.acts.find((item) => item.id === selectedNode()?.actId) || graph.acts[0];
  const id = uniqueId('nouveau-noeud', graph.nodes.map((item) => item.id));
  graph.nodes.push({ id, actId: act.id, kind: 'choice', title: 'Nouvelle scène', text: 'Texte narratif à écrire.', choices: [] });
  selectedNodeId = id;
  renderLibrary();
  renderInspector();
  changed(true);
});

async function changed(rebuild = false) {
  if (rebuild) rebuildGraph();
  clearTimeout(saveTimer);
  setSaveStatus('Modifications…');
  saveTimer = setTimeout(async () => {
    try {
      const saved = await window.candyStudio.save(graph);
      report = saved.report;
      renderOverview();
      setSaveStatus('Sauvegardé');
    } catch (error) { setSaveStatus(error.message, true); }
  }, 450);
}

$('#analyze').addEventListener('click', async () => {
  report = await window.candyStudio.analyze(graph);
  renderOverview();
  setSaveStatus(report.accepted ? 'Structure valide' : `${report.errors.length} erreur(s)`, !report.accepted);
});

$('#publish').addEventListener('click', async () => {
  try {
    await window.candyStudio.save(graph);
    const publicationReport = await window.candyStudio.analyze(graph);
    if (!publicationReport.accepted) throw new Error(`Publication bloquée : ${publicationReport.errors[0]?.message || 'structure invalide'}`);
    if (publicationReport.warnings.length && !window.confirm('La structure contient des avertissements éditoriaux. Les accepter et publier ?')) return;
    const result = await window.candyStudio.publish({ warningsAccepted: publicationReport.warnings.length > 0 });
    graph.status = 'approved';
    report = result.report;
    renderOverview();
    setSaveStatus('Publié dans Electron');
  } catch (error) {
    setSaveStatus(error.message, true);
  }
});

async function startPlay(nodeId) {
  try {
    const result = await window.candyStudio.preview({ graph, command: 'start', nodeId });
    play = { startNodeId: nodeId, session: result.session, view: result.view, choices: [] };
    showView('play');
    renderPlay();
  } catch (error) {
    setSaveStatus(error.message, true);
  }
}

$('#play-start').addEventListener('click', () => startPlay(graph.entryNodeId));
$('#play-back').addEventListener('click', async () => {
  if (!play?.choices.length) return;
  const choices = play.choices.slice(0, -1);
  const started = await window.candyStudio.preview({ graph, command: 'start', nodeId: play.startNodeId });
  play = { startNodeId: play.startNodeId, session: started.session, view: started.view, choices: [] };
  for (const choiceId of choices) await choosePreview(choiceId);
  renderPlay();
});
$('#play-retry').addEventListener('click', async () => {
  if (!play) return;
  try {
    const result = await window.candyStudio.preview({ graph, session: play.session, command: 'retry' });
    play = { startNodeId: result.session.activeNodeId, session: result.session, view: result.view, choices: [] };
    renderPlay();
  } catch (error) {
    setSaveStatus(error.message, true);
  }
});

function renderPlay() {
  const node = play?.view?.node;
  if (!node) return;
  const currentAct = play.view.act;
  $('#play-path').textContent = `Acte ${currentAct?.index} · ${play.choices.length} décision(s) · touches 1–4`;
  $('#play-acts').innerHTML = graph.acts.map((act) => `<div class="play-act ${act.index < currentAct.index ? 'passed' : act.id === currentAct.id ? 'current' : ''}"><i></i><span>${act.index}. ${escapeHtml(act.title)}</span></div>`).join('');
  const terminal = node.terminal ? `<div class="play-ending"><b>${node.kind === 'success' ? 'Réussite' : 'Fin de cette branche'}</b><span>${escapeHtml(node.terminal.reason)}</span></div>` : '';
  $('#play-card').innerHTML = `<h2>${escapeHtml(node.title)}</h2><p>${escapeHtml(node.text)}</p>${terminal}`;
  if (node.kind === 'combat') return renderPlayCombat();
  $('#play-choices').replaceChildren(...(node.choices || []).map((choice, index) => {
    const button = document.createElement('button');
    const available = (choice.requirements || []).every((requirement) => graph.hero.stats[requirement.stat] >= requirement.min);
    const requirement = (choice.requirements || []).map((item) => `${item.stat} ${item.min}`).join(' · ');
    button.disabled = !available;
    button.innerHTML = `<strong>${index + 1}. ${escapeHtml(choice.label)}</strong><span>« ${escapeHtml(choice.playerText)} »${requirement ? ` · ${escapeHtml(requirement)}` : ''}</span>`;
    button.addEventListener('click', async () => {
      try {
        await choosePreview(choice.id);
        renderPlay();
      } catch (error) {
        setSaveStatus(error.message, true);
      }
    });
    return button;
  }));
}

function renderPlayCombat() {
  const combat = play.view.combat;
  const buttons = combat.cards.map((card, index) => {
    const button = document.createElement('button');
    button.disabled = !card.available;
    button.innerHTML = `<strong>${index + 1}. ${escapeHtml(card.name)}</strong><span>${card.type} · ${card.cost} charge · ${card.resolvedDamage || card.effect.block}</span>`;
    button.addEventListener('click', () => runPreviewCombat('play_card', card.instanceId));
    return button;
  });
  const control = document.createElement('button');
  control.innerHTML = combat.phase === 'player'
    ? '<strong>Terminer le tour</strong><span>L’adversaire agit</span>'
    : '<strong>Ne pas réagir</strong><span>Subir l’attaque</span>';
  control.addEventListener('click', () => runPreviewCombat(combat.phase === 'player' ? 'end_turn' : 'pass_reaction'));
  $('#play-choices').replaceChildren(...buttons, control);
}

async function runPreviewCombat(command, cardId = null) {
  try {
    const result = await window.candyStudio.preview({ graph, session: play.session, command, cardId });
    play.session = result.session;
    play.view = result.view;
    renderPlay();
  } catch (error) {
    setSaveStatus(error.message, true);
  }
}

async function choosePreview(choiceId) {
  const result = await window.candyStudio.preview({ graph, session: play.session, command: 'choose', choiceId });
  play.session = result.session;
  play.view = result.view;
  play.choices.push(choiceId);
}

document.addEventListener('keydown', (event) => {
  if (!play || !$('#play').classList.contains('active') || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
  const button = document.querySelectorAll('#play-choices button')[Number(event.key) - 1];
  if (button) { event.preventDefault(); button.click(); }
});

function setSaveStatus(text, error = false) { $('#save-status').textContent = text; $('#save-status').style.color = error ? 'var(--bad)' : ''; }
function kindLabel(kind) { return kind === 'choice' ? 'décision' : kind === 'combat' ? 'combat' : kind === 'success' ? 'réussite' : 'échec'; }
function option(value, label) { const element = document.createElement('option'); element.value = value; element.textContent = label; return element; }
function uniqueId(base, values) { const used = new Set(values); let id = base; let index = 2; while (used.has(id)) id = `${base}-${index++}`; return id; }
function escapeHtml(value) { const span = document.createElement('span'); span.textContent = String(value ?? ''); return span.innerHTML; }

boot().catch((error) => setSaveStatus(error.message, true));
