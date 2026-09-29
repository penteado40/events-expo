import { StyleSheet, Text, View } from 'react-native'

import { PressableGlass } from '@/shared/components/ui'
import { eventPlace, formatEventDate, isArchived } from '@/shared/domain/events'
import { roleLabel } from '@/shared/domain/roles'
import { colors, fonts, radii, textStyles } from '@/shared/theme'

import type { Event } from '../schemas'

/** An Event in the list (README "Eventos"): date, role, name, type and city, pending/archived chips. */
export function EventCard({ event, onPress }: { event: Event; onPress: () => void }) {
  const archived = isArchived(event)
  const pending = event.paidContributionCount

  return (
    <PressableGlass
      variant="card"
      radius={radii.eventCard}
      onPress={onPress}
      accessibilityLabel={event.name}
      style={archived && styles.archived}
      contentStyle={styles.card}
    >
      <View style={styles.row}>
        <Text style={textStyles.monoCaption}>
          {formatEventDate(event.startsAt, event.timezone)}
        </Text>
        <Text style={textStyles.monoCaption}>{roleLabel(event.membership)}</Text>
      </View>
      <Text style={styles.name}>{event.name}</Text>
      <View style={[styles.row, styles.bottom]}>
        <Text style={styles.place} numberOfLines={1}>
          {eventPlace(event)}
        </Text>
        {pending > 0 && (
          <View style={[styles.chip, styles.chipPending]}>
            <Text style={[styles.chipText, styles.chipPendingText]}>
              {pending === 1 ? '1 pendente' : `${pending} pendentes`}
            </Text>
          </View>
        )}
        {archived && (
          <View style={[styles.chip, styles.chipArchived]}>
            <Text style={styles.chipText}>arquivado</Text>
          </View>
        )}
      </View>
    </PressableGlass>
  )
}

const styles = StyleSheet.create({
  archived: { opacity: 0.55 },
  card: { paddingVertical: 16, paddingHorizontal: 18, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  bottom: { alignItems: 'center' },
  name: { fontFamily: fonts.sans500, fontSize: 20, lineHeight: 24, color: colors.text },
  place: { flex: 1, fontFamily: fonts.sans400, fontSize: 13, color: colors.textMuted },
  chip: { borderRadius: radii.chip, borderWidth: 1, paddingVertical: 3, paddingHorizontal: 9 },
  chipPending: { backgroundColor: colors.chipAccentBg, borderColor: colors.chipAccentBorder },
  chipArchived: { borderColor: colors.chipMutedBorder },
  chipText: { fontFamily: fonts.mono500, fontSize: 12, color: colors.textMuted },
  chipPendingText: { color: colors.accent },
})
