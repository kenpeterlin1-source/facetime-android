// The abstract topographic map behind every screen, matching peterlin.com - pre-rendered PNGs, one per theme
// (tools/make_topo_png.mjs), used as the screen's ImageBackground in ui.js. Drawing it as an absolutely-positioned
// sibling (live react-native-svg, or an Image) hid all screen content on Android's new renderer (v0.1.0 bug).
const LIGHT = require('../assets/topo-light.png');
const DARK = require('../assets/topo-dark.png');

export function topoImage(colorScheme) {
  return colorScheme === 'dark' ? DARK : LIGHT;
}
