import { StyleSheet, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'

import { palette } from '@/shared/theme'

/**
 * The W2 icon (Media kit, Marca): the white card with the blue timeline, the coral dot of what
 * changed and the items in the palette's tones.
 */
export function BrandMark({ size = 64 }: { size?: number }) {
  return (
    <View
      accessible={false}
      style={[styles.card, { width: size, height: size, borderRadius: size * 0.31 }]}
    >
      <Svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <Path d="M6.5 4v16" stroke={palette.blue[700]} strokeWidth={2.3} strokeLinecap="round" />
        <Circle cx={6.5} cy={7} r={2.3} fill={palette.coral[500]} />
        <Circle cx={6.5} cy={13} r={2.3} fill={palette.blue[700]} />
        <Circle
          cx={6.5}
          cy={19}
          r={1.9}
          fill="#FFFFFF"
          stroke={palette.blue[700]}
          strokeWidth={1.6}
        />
        <Path d="M11 7h8" stroke={palette.purple[500]} strokeWidth={2.9} strokeLinecap="round" />
        <Path d="M11 13h5.5" stroke={palette.green[500]} strokeWidth={2.9} strokeLinecap="round" />
        <Path
          d="M11 19h7"
          stroke={palette.turquoise[500]}
          strokeWidth={2.9}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
})
