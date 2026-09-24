// Builds the app icon set from the "summit camera" logo (concept 3, chosen 2026-09-24).
// SVG sources go to assets/logo/, PNGs to assets/. Run: node tools/make_icons.mjs
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CLAY = '#B04A2F', PAPER = '#FBF7F2';

// topo rings + camera, centred on (60,60) in a 120 box
const art = (color, mono = false) => {
  const op = mono ? [1, 1, 1] : [0.35, 0.55, 0.8];
  const sw = mono ? [2.4, 2.6, 3] : [1.4, 1.6, 2];
  return `<g transform="translate(0,-3)"><g fill="none" stroke="${color}" stroke-linecap="round">
<path d="M14 64c4-26 26-44 50-42 26 2 44 22 42 46-2 22-22 38-46 36C34 102 11 88 14 64z" stroke-width="${sw[0]}" opacity="${op[0]}"/>
<path d="M24 64c3-19 20-32 38-31 19 1 33 17 32 35-1 17-17 29-35 28C40 95 22 82 24 64z" stroke-width="${sw[1]}" opacity="${op[1]}"/>
<path d="M34 64c2-12 13-21 26-20 13 1 23 11 22 24-1 12-12 20-25 19C44 86 32 76 34 64z" stroke-width="${sw[2]}" opacity="${op[2]}"/></g>
<g fill="${color}"><rect x="44" y="56" width="22" height="16" rx="4"/><path d="M67 61 76 56v16l-9-5z"/></g></g>`;
};
const svg = (body, bg = null, scale = 1) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${bg ? `<rect width="120" height="120" fill="${bg}"/>` : ''}` +
  `<g transform="translate(60 60) scale(${scale}) translate(-60 -60)">${body}</g></svg>`;

const SOURCES = {
  'icon': [svg(art(CLAY), PAPER, 1), 1024],                         // launcher masks the corners itself
  'android-icon-foreground': [svg(art(CLAY), null, 0.7), 1024],     // art inside the adaptive-icon safe zone
  'android-icon-background': [svg('', PAPER), 1024],
  'android-icon-monochrome': [svg(art('#000', true), null, 0.7), 1024],
  'splash-icon': [svg(art(CLAY), null, 1), 1024],
  'splash-icon-dark': [svg(art('#E88A6B'), null, 1), 1024],
  'favicon': [svg(art(CLAY), PAPER, 1.1), 48],
  'logo': [svg(art(CLAY), null, 1), 512],
};

mkdirSync(join(ROOT, 'assets/logo'), { recursive: true });
for (const [name, [src, px]] of Object.entries(SOURCES)) {
  writeFileSync(join(ROOT, 'assets/logo', `${name}.svg`), src);
  const png = new Resvg(src, { fitTo: { mode: 'width', value: px } }).render().asPng();
  writeFileSync(join(ROOT, 'assets', `${name}.png`), png);
  console.log(name, px);
}
