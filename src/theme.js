// Personal palette, shared with peterlin.com (see ~/personal/peterlin-com-website/brand/BRAND.md).
import { useColorScheme } from 'react-native';

const light = {
  paper: '#FBF7F2', card: '#FFFFFF', ink: '#2B2522', muted: '#6F645D', line: '#E9E1D8',
  clay: '#B04A2F', claySoft: '#F6E4DA', onClay: '#FBF7F2',
  sage: '#5E7F64', sageSoft: '#E4ECE3',
  topo: 'rgba(176, 74, 47, 0.20)',      // contour lines: clay at low strength
};

const dark = {
  paper: '#1C1816', card: '#25201D', ink: '#F3ECE4', muted: '#B5A99F', line: '#3A322D',
  clay: '#E88A6B', claySoft: '#3A2821', onClay: '#1C1816',
  sage: '#9DBEA2', sageSoft: '#243029',
  topo: 'rgba(232, 138, 107, 0.22)',
};

export function useTheme() {
  return useColorScheme() === 'dark' ? dark : light;
}
