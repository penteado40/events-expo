import { StyleSheet, Text, View } from 'react-native'

import { PressableGlass } from '@/shared/components/ui'
import { formatEventDayMonth } from '@/shared/domain/events'
import { colors, fonts, radii } from '@/shared/theme'

import { eventPlace } from '../event-place'
import type { Event } from '../schemas'

/**
 * An Event on Início (README "Início"): its day and month on the left, name and "tipo · local" in
 * the middle, and where it stands in lime on the right.
 */
export function HomeEventCard({
  event,
  when,
  accessibilityLabel,
  accessibilityHint,
  onPress,
}: {
  event: Event
  /** Where it stands, in lime: "agora", "hoje", "em N dias". */
  when: string
  accessibilityLabel: string
  accessibilityHint?: string
  onPress: () => void
}) {
  const { day, month } = formatEventDayMonth(event.startsAt, event.timezone)
  return (
    <PressableGlass
      variant="card"
      radius={radii.eventCard}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      contentStyle={styles.card}
    >
      <View style={styles.date}>
        <Text style={styles.day}>{day}</Text>
        <Text style={styles.month}>{month}</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>
          {event.name}
        </Text>
        <Text style={styles.place} numberOfLines={2}>
          {eventPlace(event)}
        </Text>
      </View>
      <Text style={styles.when}>{when}</Text>
    </PressableGlass>
  )
}

const styles = StyleSheet.create({
  card: {
    minHeight: 44,
    paddingVertical: 18,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  date: { minWidth: 44, alignItems: 'center' },
  day: { fontFamily: fonts.sans500, fontSize: 32, lineHeight: 36, color: colors.text },
  month: { fontFamily: fonts.mono400, fontSize: 12, color: colors.textMuted },
  details: { flex: 1, gap: 4 },
  name: { fontFamily: fonts.sans500, fontSize: 18, color: colors.text },
  place: { fontFamily: fonts.sans400, fontSize: 14, color: colors.textMuted },
  when: { fontFamily: fonts.mono500, fontSize: 13, color: colors.accent },
})
