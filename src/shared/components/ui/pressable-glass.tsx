import { useState, type ComponentProps } from 'react'
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

import { Glass } from './glass'

type Props = Omit<ComponentProps<typeof Glass>, 'pressed' | 'style'> &
  Pick<PressableProps, 'accessibilityActions' | 'onAccessibilityAction'> & {
    onPress?: () => void
    accessibilityLabel?: string
    style?: StyleProp<ViewStyle>
  }

/** A tappable Glass: scales to 0.98 with a stronger top highlight while pressed. */
export function PressableGlass({
  onPress,
  accessibilityLabel,
  accessibilityActions,
  onAccessibilityAction,
  style,
  ...glass
}: Props) {
  const scale = useSharedValue(1)
  const [pressed, setPressed] = useState(false)
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }))

  return (
    <Animated.View style={[animated, style]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityActions={accessibilityActions}
        onAccessibilityAction={onAccessibilityAction}
        onPressIn={() => {
          setPressed(true)
          scale.set(withTiming(0.98, { duration: 90 }))
        }}
        onPressOut={() => {
          setPressed(false)
          scale.set(withTiming(1, { duration: 140 }))
        }}
      >
        <Glass {...glass} pressed={pressed} />
      </Pressable>
    </Animated.View>
  )
}
