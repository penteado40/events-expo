import { BlurView } from 'expo-blur'
import { Platform, StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated'

import { colors } from '@/shared/theme'

import { useScreenBlurTarget } from './blur-target'

/**
 * The full-screen blur and dim under an overlay, fading in with `progress` (0 to 1). Follows the
 * Glass rules: a native blur on iOS; a real one on Android too, since it floats over everything.
 * It draws only: whatever closes the overlay goes on top of it.
 */
export function Veil({ progress }: { progress: SharedValue<number> }) {
  const screen = useScreenBlurTarget()
  const fade = useAnimatedStyle(() => ({ opacity: Math.min(Math.max(progress.get(), 0), 1) }))

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, fade]}>
      {Platform.OS === 'ios' ? (
        <BlurView tint="dark" intensity={30} style={StyleSheet.absoluteFill} />
      ) : (
        <BlurView
          tint="dark"
          intensity={30}
          blurMethod="dimezisBlurViewSdk31Plus"
          blurTarget={screen ?? undefined}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.veil }]} />
    </Animated.View>
  )
}
