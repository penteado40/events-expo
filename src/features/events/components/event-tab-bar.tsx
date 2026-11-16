import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { fonts, useTheme } from '@/shared/theme'

export type EventTab = 'summary' | 'timeline'

const BOTTOM = 24

/** Room to leave under a screen's content so the bar does not cover its end. */
export const EVENT_TAB_BAR_SPACE = 64 + BOTTOM + 24

/**
 * Inside an Event the floating bar turns into its tabs (Media kit: Navegação): Resumo, Timeline
 * and Pessoas, still blue in an Event of any color, the current one on a white pill. Resumo and
 * Timeline take each other's place; Pessoas opens over them, back returning to the tab.
 */
export function EventTabBar({ eventId, current }: { eventId: number; current: EventTab }) {
  const { colors } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const tabs: { key: EventTab | 'people'; label: string; go: () => void }[] = [
    { key: 'summary', label: 'Resumo', go: () => router.replace(`/events/${eventId}`) },
    {
      key: 'timeline',
      label: 'Timeline',
      go: () => router.replace(`/events/${eventId}/timeline`),
    },
    { key: 'people', label: 'Pessoas', go: () => router.push(`/events/${eventId}/participants`) },
  ]

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          bottom: Math.max(insets.bottom, BOTTOM),
          backgroundColor: colors.action,
          boxShadow: `0 18px 30px -14px ${colors.action}B3`,
        },
      ]}
    >
      {tabs.map((tab) => {
        const selected = tab.key === current
        return (
          <Pressable
            key={tab.key}
            onPress={selected ? undefined : tab.go}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            style={[styles.tab, selected && { backgroundColor: colors.onAction }]}
          >
            <Text
              style={[
                styles.label,
                selected
                  ? { color: colors.action, fontFamily: fonts.sans600 }
                  : { color: colors.onActionMuted },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 64,
    borderRadius: 32,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: { flex: 1, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.sans400, fontSize: 14 },
})
