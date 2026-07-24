const { app, BrowserWindow, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(async () => {
  const root = path.join(__dirname, '..');
  const source = path.join(root, 'src', 'renderer', 'assets', 'sorcerer-sigil.svg');
  const output = path.join(root, 'src', 'pwa', 'icons');
  const svg = fs.readFileSync(source, 'utf8');
  fs.mkdirSync(output, { recursive: true });
  const renderFile = path.join(output, '.pwa-icon-render.html');
  fs.writeFileSync(renderFile, `<style>*{box-sizing:border-box}html,body{width:100%;height:100%;margin:0;overflow:hidden}svg{display:block;width:100%;height:100%}</style>${svg}`);
  const window = new BrowserWindow({
    width: 512,
    height: 512,
    useContentSize: true,
    show: false,
    frame: false,
    transparent: true,
  });
  await window.loadFile(renderFile);
  await new Promise((resolve) => setTimeout(resolve, 80));
  const master = await window.capturePage();
  window.destroy();
  for (const size of [180, 192, 512]) {
    const image = size === 512
      ? master
      : nativeImage.createFromBuffer(master.toPNG()).resize({ width: size, height: size, quality: 'best' });
    fs.writeFileSync(path.join(output, `sorcerer-sigil-${size}.png`), image.toPNG());
  }
  fs.rmSync(renderFile);
  console.log(`Icônes PWA générées : ${output}`);
  app.quit();
}).catch((error) => {
  console.error(error);
  app.exit(1);
});
