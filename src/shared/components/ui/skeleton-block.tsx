import { useEffect } from 'react'
import type { DimensionValue } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { colors } from '@/shared/theme'

type Props = { width: DimensionValue; height: number; radius?: number }

/** A placeholder bar inside a glass skeleton, gently pulsing while data loads. */
export function SkeletonBlock({ width, height, radius = height / 2 }: Props) {
  const opacity = useSharedValue(1)
  useEffect(() => {
    opacity.set(
      withRepeat(withTiming(0.45, { duration: 800, easing: Easing.inOut(Easing.quad) }), -1, true),
    )
  }, [opacity])
  const pulse = useAnimatedStyle(() => ({ opacity: opacity.get() }))

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.skeleton }, pulse]}
    />
  )
}
