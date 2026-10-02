import { Pressable, StyleSheet, Text, View, type Insets } from 'react-native'

import { PressableGlass } from '@/shared/components/ui'
import { formatEventDate, isArchived } from '@/shared/domain/events'
import { roleLabel } from '@/shared/domain/roles'
import { colors, fonts, radii, textStyles } from '@/shared/theme'

import type { DetailTab } from '../detail-tab'
import { eventPlace } from '../event-place'
import type { Event } from '../schemas'

const confirmedText = (n: number) => (n === 1 ? '1 confirmado' : `${n} confirmados`)
const pendingText = (n: number) => (n === 1 ? '1 pendente' : `${n} pendentes`)

// The chips are ~24pt tall: reach 44pt outwards, but only 4pt (half the gap) towards the other.
const OUTER_SLOP = 10
const INNER_SLOP = 4
const SIDE_SLOP = 8

/**
 * An Event in the list (README "Eventos"): archived chip, date and role; name and city with, stacked
 * on their right, how many Guests confirmed and how many Contributions await Verification. The card
 * opens Resumo, each chip its tab. A screen reader hears one button with the counts in its label
 * and reaches the chips' tabs through its actions.
 */
export function EventCard({ event, onOpen }: { event: Event; onOpen: (tab: DetailTab) => void }) {
  const archived = isArchived(event)
  const pending = event.paidContributionCount
  const confirmed = event.summary.rsvpCount

  const label = [
    event.name,
    archived && 'arquivado',
    confirmedText(confirmed),
    pending > 0 && pendingText(pending),
  ]
    .filter(Boolean)
    .join(', ')
  const actions = [
    { name: 'rsvps', label: 'Ver RSVPs' },
    ...(pending > 0 ? [{ name: 'contributions', label: 'Ver Conferir' }] : []),
  ]

  return (
    <PressableGlass
      variant="card"
      radius={radii.eventCard}
      onPress={() => onOpen('summary')}
      accessibilityLabel={label}
      accessibilityActions={actions}
      onAccessibilityAction={({ nativeEvent }) => {
        if (nativeEvent.actionName === 'rsvps' || nativeEvent.actionName === 'contributions') {
          onOpen(nativeEvent.actionName)
        }
      }}
      style={archived && styles.archived}
      contentStyle={styles.card}
    >
      <View style={styles.row}>
        <View style={styles.top}>
          {archived && (
            <View style={[styles.chip, styles.chipArchived]}>
              <Text style={styles.chipText}>arquivado</Text>
            </View>
          )}
          <Text style={textStyles.monoCaption}>
            {formatEventDate(event.startsAt, event.timezone)}
          </Text>
        </View>
        <Text style={textStyles.monoCaption}>{roleLabel(event.membership)}</Text>
      </View>
      <View style={[styles.row, styles.body]}>
        <View style={styles.details}>
          <Text style={styles.name}>{event.name}</Text>
          <Text style={styles.place} numberOfLines={1}>
            {eventPlace(event)}
          </Text>
        </View>
        <View style={styles.chips}>
          <Chip
            testID="chip-confirmed"
            text={confirmedText(confirmed)}
            tone="neutral"
            hitSlop={{
              top: OUTER_SLOP,
              bottom: pending > 0 ? INNER_SLOP : OUTER_SLOP,
              left: SIDE_SLOP,
              right: SIDE_SLOP,
            }}
            onPress={() => onOpen('rsvps')}
          />
          {pending > 0 && (
            <Chip
              testID="chip-pending"
              text={pendingText(pending)}
              tone="accent"
              hitSlop={{ top: INNER_SLOP, bottom: OUTER_SLOP, left: SIDE_SLOP, right: SIDE_SLOP }}
              onPress={() => onOpen('contributions')}
            />
          )}
        </View>
      </View>
    </PressableGlass>
  )
}

/**
 * A tappable chip inside the card: as the touch's responder it keeps the card from also opening.
 * Not an accessibility element: the card's actions stand for it.
 */
function Chip({
  text,
  tone,
  hitSlop,
  onPress,
  testID,
}: {
  text: string
  tone: 'neutral' | 'accent'
  hitSlop: Insets
  onPress: () => void
  testID: string
}) {
  const accent = tone === 'accent'
  return (
    <Pressable
      testID={testID}
      accessible={false}
      hitSlop={hitSlop}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        accent ? styles.chipAccent : styles.chipNeutral,
        pressed && (accent ? styles.chipAccentPressed : styles.chipNeutralPressed),
      ]}
    >
      <Text style={[styles.chipText, accent ? styles.chipAccentText : styles.chipNeutralText]}>
        {text}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  archived: { opacity: 0.55 },
  card: { paddingVertical: 20, paddingHorizontal: 22, gap: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  body: { alignItems: 'flex-end' },
  details: { flex: 1, gap: 12 },
  name: { fontFamily: fonts.sans500, fontSize: 22, lineHeight: 26, color: colors.text },
  place: { fontFamily: fonts.sans400, fontSize: 13, color: colors.textMuted },
  chips: { alignItems: 'flex-end', gap: 8 },
  chip: { borderRadius: radii.chip, borderWidth: 1, paddingVertical: 3, paddingHorizontal: 9 },
  chipNeutral: { backgroundColor: colors.chipNeutralBg, borderColor: colors.chipNeutralBorder },
  chipNeutralPressed: { backgroundColor: colors.chipNeutralPressedBg },
  chipAccent: { backgroundColor: colors.chipAccentBg, borderColor: colors.chipAccentBorder },
  chipAccentPressed: { backgroundColor: colors.chipAccentPressedBg },
  chipArchived: { borderColor: colors.chipMutedBorder },
  chipText: { fontFamily: fonts.mono500, fontSize: 12, color: colors.textMuted },
  chipNeutralText: { color: colors.text },
  chipAccentText: { color: colors.accent },
})
