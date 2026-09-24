// Full-screen abstract topographic map behind the app, matching peterlin.com.
import { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { TOPO_PATHS, TOPO_VIEWBOX } from './topoPaths';

function TopoBackground({ color }) {
  return (
    <Svg style={styles.fill} viewBox={TOPO_VIEWBOX} preserveAspectRatio="xMidYMid slice">
      <G fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
        {TOPO_PATHS.map((p, i) => (
          <Path key={i} d={p.d} strokeWidth={p.major ? 1.6 : 0.8} vectorEffect="non-scaling-stroke" />
        ))}
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({ fill: { ...StyleSheet.absoluteFillObject, pointerEvents: 'none' } });

export default memo(TopoBackground);
