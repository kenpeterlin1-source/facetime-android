// Personal palette, shared with peterlin.com (see ~/personal/peterlin-com-website/brand/BRAND.md).
import { useColorScheme } from 'react-native';

const light = {
  paper: '#FBF7F2', card: '#FFFFFF', ink: '#2B2522', muted: '#6F645D', line: '#E9E1D8',
  clay: '#B04A2F', claySoft: '#F6E4DA', onClay: '#FBF7F2',
  sage: '#5E7F64', sageSoft: '#E4ECE3',
  sky: '#3F6E8C', skySoft: '#E1ECF2',
  sand: '#9A6B1F', sandSoft: '#F6EAD2',
  plum: '#7A5C8C', plumSoft: '#EEE6F2',
  slate: '#4F5B66', slateSoft: '#E6EAEE',
  scrim: 'rgba(43, 37, 34, 0.35)',
  topo: 'rgba(176, 74, 47, 0.20)',      // contour lines: clay at low strength
};

const dark = {
  paper: '#1C1816', card: '#25201D', ink: '#F3ECE4', muted: '#B5A99F', line: '#3A322D',
  clay: '#E88A6B', claySoft: '#3A2821', onClay: '#1C1816',
  sage: '#9DBEA2', sageSoft: '#243029',
  sky: '#8DB8D3', skySoft: '#1F2C35',
  sand: '#E2B665', sandSoft: '#362C1D',
  plum: '#C6A8D6', plumSoft: '#2E2533',
  slate: '#AAB6C2', slateSoft: '#262C31',
  scrim: 'rgba(0, 0, 0, 0.55)',
  topo: 'rgba(232, 138, 107, 0.22)',
};

export function useTheme() {
  return useColorScheme() === 'dark' ? dark : light;
}
