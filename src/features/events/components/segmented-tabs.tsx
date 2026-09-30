import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated'

import { Glass } from '@/shared/components/ui'
import { colors, fonts, radii } from '@/shared/theme'

export type SegmentedTab<K extends string> = { key: K; label: string; dot?: boolean }

type Props<K extends string> = {
  tabs: readonly SegmentedTab<K>[]
  active: K
  onChange: (key: K) => void
}

const PADDING = 5
const GAP = 2

/** The Event detail's tabs (README "Abas segmentadas"): four columns, the active pill slides. */
export function SegmentedTabs<K extends string>({ tabs, active, onChange }: Props<K>) {
  // The row inside the padding; each item is an equal column of it.
  const [width, setWidth] = useState(0)
  const itemWidth = width > 0 ? (width - GAP * (tabs.length - 1)) / tabs.length : 0
  const index = Math.max(
    0,
    tabs.findIndex((tab) => tab.key === active),
  )

  const pill = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(index * (itemWidth + GAP), {
          duration: 250,
          easing: Easing.out(Easing.cubic),
        }),
      },
    ],
  }))

  return (
    <Glass
      variant="pill"
      radius={radii.segmentedTabs}
      contentStyle={styles.content}
      style={styles.bar}
    >
      <View style={styles.row} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {itemWidth > 0 && <Animated.View style={[styles.activePill, { width: itemWidth }, pill]} />}
        {tabs.map((tab) => {
          const selected = tab.key === active
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={tab.dot ? `${tab.label}, com pendentes` : tab.label}
              style={styles.item}
            >
              <Text style={[styles.label, selected && styles.labelActive]}>{tab.label}</Text>
              {tab.dot && <View style={styles.dot} />}
            </Pressable>
          )
        })}
      </View>
    </Glass>
  )
}

const styles = StyleSheet.create({
  bar: { alignSelf: 'stretch' },
  content: { padding: PADDING },
  row: { flexDirection: 'row', gap: GAP },
  activePill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 38,
    borderRadius: radii.segmentedTab,
    backgroundColor: colors.activePill,
  },
  item: {
    flex: 1,
    height: 38,
    borderRadius: radii.segmentedTab,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: { fontFamily: fonts.sans500, fontSize: 13, color: colors.textMuted },
  labelActive: { color: colors.onAccent },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    boxShadow: `0 0 6px ${colors.accent}`,
  },
})
