const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.join(__dirname, '..');
const output = path.join(root, 'dist', 'pwa');

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

esbuild.buildSync({
  entryPoints: [path.join(root, 'src', 'pwa', 'entry.js')],
  outfile: path.join(output, 'pwa.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome110', 'safari16'],
  minify: true,
  sourcemap: false,
});

copy(path.join(root, 'src', 'renderer', 'styles.css'), path.join(output, 'styles.css'));
copyDirectory(path.join(root, 'src', 'renderer', 'assets'), path.join(output, 'assets'));
copyDirectory(path.join(root, 'src', 'pwa', 'icons'), path.join(output, 'icons'));
copy(path.join(root, 'src', 'pwa', 'manifest.webmanifest'), path.join(output, 'manifest.webmanifest'));

const html = fs.readFileSync(path.join(root, 'src', 'renderer', 'index.html'), 'utf8')
  .replace('<meta name="viewport" content="width=device-width, initial-scale=1.0" />', '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />\n    <meta name="theme-color" content="#171817" />\n    <meta name="apple-mobile-web-app-capable" content="yes" />\n    <link rel="manifest" href="manifest.webmanifest" />')
  .replace('<title>Fantasy Story</title>', '<title>Fantasy Story</title>\n    <link rel="apple-touch-icon" href="icons/sorcerer-sigil-180.png" />')
  .replace('<script src="app.js"></script>', '<script src="pwa.js"></script>');
fs.writeFileSync(path.join(output, 'index.html'), html);

const assets = listFiles(output)
  .map((file) => `./${path.relative(output, file).replaceAll('\\', '/')}`)
  .filter((file) => file !== './service-worker.js');
const workerSource = fs.readFileSync(path.join(root, 'src', 'pwa', 'service-worker.js'), 'utf8')
  .replace('self.__FANTASY_STORY_ASSETS__ || []', JSON.stringify(assets));
fs.writeFileSync(path.join(output, 'service-worker.js'), workerSource);

console.log(`PWA construite : ${output}`);

function copy(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyDirectory(source, target) {
  fs.cpSync(source, target, { recursive: true });
}

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(file) : [file];
  });
}
