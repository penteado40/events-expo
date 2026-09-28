import type { ComponentProps } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Tabs from 'expo-router/js-tabs'
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated'

import { colors, fonts, radii } from '@/shared/theme'

import { Glass } from './glass'

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0]

const WIDTH = 220
const PADDING = 5
const GAP = 4

/** The centered floating tab bar (README "Tab bar flutuante") with the sliding active pill. */
export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const count = state.routes.length
  const itemWidth = (WIDTH - PADDING * 2 - GAP * (count - 1)) / count

  const pill = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(state.index * (itemWidth + GAP), {
          duration: 250,
          easing: Easing.out(Easing.cubic),
        }),
      },
    ],
  }))

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Glass
        variant="pill"
        radius={radii.tabBar}
        borderColor="rgba(255,255,255,.2)"
        highlight="rgba(255,255,255,.4)"
        shadow="0 18px 40px -12px rgba(0,0,0,.7)"
        style={styles.bar}
        contentStyle={styles.content}
      >
        <Animated.View style={[styles.activePill, { width: itemWidth }, pill]} />
        {state.routes.map((route, index) => {
          const focused = state.index === index
          const label = descriptors[route.key].options.title ?? route.name
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name)
          }
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              style={[styles.item, { width: itemWidth }]}
            >
              <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
            </Pressable>
          )
        })}
      </Glass>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: 0, right: 0, bottom: 28, alignItems: 'center' },
  bar: { width: WIDTH },
  content: { flexDirection: 'row', padding: PADDING, gap: GAP },
  activePill: {
    position: 'absolute',
    top: PADDING,
    left: PADDING,
    height: 48,
    borderRadius: radii.tabBarItem,
    backgroundColor: colors.activePill,
  },
  item: {
    height: 48,
    borderRadius: radii.tabBarItem,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: fonts.sans500, fontSize: 14, color: colors.tabInactive },
  labelActive: { color: colors.onAccent },
})
