const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..', '..', '..');
const loopsDirectory = path.join(root, 'artifacts', 'loops');

function field(content, pattern, fallback = 'non renseigné') {
  return content.match(pattern)?.[1]?.replace(/\s+/gu, ' ').trim() || fallback;
}

function clean(value) {
  return value.replace(/\|/gu, '\\|');
}

if (!fs.existsSync(loopsDirectory)) {
  console.error('Journal introuvable : artifacts/loops/');
  process.exitCode = 1;
} else {
  const loops = fs.readdirSync(loopsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => {
      const content = fs.readFileSync(path.join(loopsDirectory, entry.name), 'utf8');
      const title = content.match(/^#\s+Boucle\s+\d+\s+[—-]\s+(.+)$/mu)?.[1];
      if (!title) return null;
      return {
        file: entry.name,
        id: entry.name.match(/^(\d+)/u)?.[1] || entry.name,
        title: title.replace(/\s+/gu, ' ').trim(),
        status: field(content, /\*\*Statut\s*:\*\*\s*`([^`]+)`/u, 'inconnu'),
        contribution: field(content, /^-\s+\*\*Nouveauté centrale\s*:\*\*\s*(.+)$/mu),
        uncertainty: field(content, /^-\s+\*\*Reste incertain\s*:\*\*\s*(.+)$/mu),
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.file.localeCompare(right.file, 'fr', { numeric: true }));

  const terminal = new Set(['garder', 'retirer']);
  const isDeclaredGap = (loop) => !/^aucun(?:\b| pour)/iu.test(loop.uncertainty);
  const open = loops.filter((loop) => !terminal.has(loop.status.toLowerCase()));
  const gaps = loops.filter(isDeclaredGap);

  console.log(`# Journal compact — ${loops.length} boucle(s)`);
  console.log(`Ouvertes : ${open.map((loop) => loop.id).join(', ') || 'aucune'}`);
  console.log('');
  console.log('## Contributions');
  for (const loop of loops) {
    console.log(`- ${loop.id} [${clean(loop.status)}] ${clean(loop.title)} — ${clean(loop.contribution)}`);
  }
  console.log('');
  console.log('## Coutures déjà signalées');
  if (gaps.length === 0) {
    console.log('- aucune');
  } else {
    for (const loop of gaps) {
      console.log(`- ${loop.id} ${clean(loop.title)} — ${clean(loop.uncertainty)}`);
    }
  }
}
