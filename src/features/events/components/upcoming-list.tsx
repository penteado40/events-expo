import { useEffect, useRef, type ReactNode } from 'react'
import {
  AccessibilityInfo,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { scheduleOnRN } from 'react-native-worklets'

import { Veil } from '@/shared/components/ui'
import { spacing } from '@/shared/theme'

import { UPCOMING_DAYS } from '../home-summary'
import { sectionStyles } from './home-section'

/** Where the collapsed "Próximos eventos" sits on screen (title included) and its card's height. */
export type Origin = { x: number; y: number; width: number; cardHeight: number }

/** How the collapsed stack is drawn: each edge's peek, side inset and fade, and how many show. */
export type StackShape = { peek: number; inset: number; fade: number; layers: number }

const SPRING = { damping: 20, stiffness: 220, mass: 1 }

/**
 * "Próximos eventos" expanded in place, while mounted: over a blurred and dimmed screen (tab bar
 * included), the stack fans out into the list from where the collapsed section sits (`origin`),
 * with a spring. A tap outside the list ("Fechar") folds it back, then `onClose`. Scrolls when
 * taller than the screen. `origin` is null until measured: the list then starts below the top.
 */
export function UpcomingList({
  origin,
  shape,
  onClose,
  children,
}: {
  origin: Origin | null
  shape: StackShape
  onClose: () => void
  /** The Events' cards, nearest first. */
  children: ReactNode[]
}) {
  const insets = useSafeAreaInsets()
  const { height: screenHeight } = useWindowDimensions()
  const progress = useSharedValue(0)
  const title = useRef<Text>(null)

  useEffect(() => {
    progress.set(withSpring(1, SPRING))
    if (title.current) AccessibilityInfo.sendAccessibilityEvent(title.current, 'focus')
  }, [progress])

  const fold = () =>
    progress.set(
      withSpring(0, { ...SPRING, overshootClamping: true }, (finished) => {
        if (finished) scheduleOnRN(onClose)
      }),
    )
  const fadeIn = useAnimatedStyle(() => ({ opacity: progress.get() }))
  const side = origin?.x ?? spacing.screen

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={fold}
    >
      <Veil progress={progress} />
      <ScrollView
        style={StyleSheet.absoluteFill}
        contentContainerStyle={{
          minHeight: screenHeight,
          paddingTop: origin?.y ?? insets.top + 16,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: side,
        }}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={fold}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        />
        <View style={sectionStyles.section}>
          <Animated.View style={fadeIn}>
            <Text ref={title} style={sectionStyles.title}>
              {`PRÓXIMOS ${UPCOMING_DAYS} DIAS`}
            </Text>
          </Animated.View>
          {children.map((card, index) => (
            <FanCard
              key={index}
              index={index}
              count={children.length}
              cardHeight={origin?.cardHeight ?? 0}
              width={origin?.width ?? 0}
              shape={shape}
              progress={progress}
            >
              {card}
            </FanCard>
          ))}
        </View>
      </ScrollView>
    </Modal>
  )
}

/**
 * One card of the list: at progress 0 where its edge peeks out of the stack (behind the ones above
 * it, narrower and fainter; past the drawn edges, hidden); at 1, in its place in the list. Cards are
 * taken as tall as the top one.
 */
function FanCard({
  index,
  count,
  cardHeight,
  width,
  shape,
  progress,
  children,
}: {
  index: number
  count: number
  cardHeight: number
  width: number
  shape: StackShape
  progress: SharedValue<number>
  children: ReactNode
}) {
  const depth = Math.min(index, shape.layers)
  const scale = width > 0 ? (width - 2 * depth * shape.inset) / width : 1
  // Its bottom `depth` peeks below the top card's; scaling from the middle lifts it, so add that.
  const gap = sectionStyles.section.gap
  const folded = depth * shape.peek - index * (cardHeight + gap) + (cardHeight * (1 - scale)) / 2
  const faded = index > shape.layers ? 0 : 1 - depth * shape.fade

  const style = useAnimatedStyle(() => {
    const p = progress.get()
    return {
      opacity: interpolate(p, [0, 1], [faded, 1], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(p, [0, 1], [folded, 0]) },
        { scale: interpolate(p, [0, 1], [scale, 1], Extrapolation.CLAMP) },
      ],
    }
  })

  return <Animated.View style={[{ zIndex: count - index }, style]}>{children}</Animated.View>
}
