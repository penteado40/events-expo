import { BlurTargetView } from 'expo-blur'
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native'
import Svg, { Defs, Path, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg'

import { colors } from '@/shared/theme'

import { useBlurTarget } from './blur-target'

type Orb = { id: string; color: string; size: number; opacity: number; x: number; y: number }

/**
 * The fixed backdrop behind all glass: three radial orbs and a 32 pt grid on #07080a.
 * Rendered once at the root, so it never scrolls with the content.
 */
export function Background() {
  const { width, height } = useWindowDimensions()
  const blurTarget = useBlurTarget()

  // Positions from the 390 pt design frame (README "Fundo").
  const orbs: Orb[] = [
    { id: 'lime', color: '#b5e35a', size: 420, opacity: 0.55, x: -140, y: -80 },
    { id: 'blue', color: '#4f7dff', size: 460, opacity: 0.6, x: width + 200 - 460, y: 260 },
    { id: 'violet', color: '#b36bff', size: 380, opacity: 0.45, x: -60, y: height + 140 - 380 },
  ]

  const content = (
    <Svg width={width} height={height}>
      <Defs>
        {orbs.map((orb) => (
          // CSS `radial-gradient(circle, c 0%, transparent 65%)` fades out at ~92% of the SVG radius.
          <RadialGradient key={orb.id} id={orb.id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={orb.color} stopOpacity={orb.opacity} />
            <Stop offset="0.92" stopColor={orb.color} stopOpacity={0} />
          </RadialGradient>
        ))}
        <Pattern id="grid" width={32} height={32} patternUnits="userSpaceOnUse">
          <Path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={1} />
        </Pattern>
      </Defs>
      {orbs.map((orb) => (
        <Rect
          key={orb.id}
          x={orb.x}
          y={orb.y}
          width={orb.size}
          height={orb.size}
          fill={`url(#${orb.id})`}
        />
      ))}
      <Rect width={width} height={height} fill="url(#grid)" />
    </Svg>
  )

  if (Platform.OS === 'android' && blurTarget) {
    return (
      <BlurTargetView ref={blurTarget} style={styles.fill} pointerEvents="none">
        {content}
      </BlurTargetView>
    )
  }
  return (
    <View style={styles.fill} pointerEvents="none">
      {content}
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.bg },
})
