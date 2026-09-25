// Renders the topo background (src/topoPaths.js) to transparent PNGs, one per theme, for use as an image on
// Android - drawing it live with react-native-svg put the map on top of the screen content there.
// Run after tools/gen_topo.py: node tools/make_topo_png.mjs
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOPO_PATHS, TOPO_VIEWBOX } from '../src/topoPaths.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WIDTH = 1440;                       // ~phone width in pixels; height follows the 1:2 viewBox
const SCALE = WIDTH / 1000;               // viewBox units → pixels, so strokes are the same pixel width as before
const THEMES = { light: 'rgba(176,74,47,0.20)', dark: 'rgba(232,138,107,0.22)' };

for (const [name, color] of Object.entries(THEMES)) {
  const paths = TOPO_PATHS.map((p) => `<path d="${p.d}" stroke-width="${(p.major ? 1.6 : 0.8) * 2.2 / SCALE}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${TOPO_VIEWBOX}">` +
    `<g fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`;
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
  writeFileSync(join(ROOT, 'assets', `topo-${name}.png`), png);
  console.log(`assets/topo-${name}.png`, Math.round(png.length / 1024), 'KB');
}
