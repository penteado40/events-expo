import { StyleSheet, Text, View } from 'react-native'

import { Badge } from '@/shared/components/ui'
import { longDate } from '@/shared/domain/local-dates'
import { fonts, palette, textStyles, useTheme, type Tone } from '@/shared/theme'

import type { HomeBadge, HomeLine } from '../home-lines'

const BADGES: Record<Exclude<HomeBadge, null>, { label: string; tone: Tone }> = {
  cancelled: { label: 'CANCELADO', tone: 'red' },
  draft: { label: 'RASCUNHO', tone: 'gold' },
  going: { label: 'VOCÊ VAI', tone: 'green' },
}

/** What a screen reader hears for a line: name, state, when and where. */
function describe(line: HomeLine) {
  const { event, badge, endDay, start } = line
  const when = endDay
    ? `de ${start.day} a ${endDay} de ${start.month.toLowerCase()}.`
    : longDate(event.period.startDate)
  return [event.name, badge && BADGES[badge].label.toLowerCase(), when, line.subtitle]
    .filter(Boolean)
    .join(', ')
}

/**
 * One Event of the Início (D-Início, Media kit: Cartões): the date column, and the row with the
 * stripe in the Event's color, or the cover card for the next Event the person goes to.
 */
export function EventLine({ line }: { line: HomeLine }) {
  const theme = useTheme()
  const { colors } = theme
  const { tone, faded } = line
  const accent = theme.badge(tone).text

  return (
    <View accessible accessibilityLabel={describe(line)} style={styles.line}>
      <View style={styles.dates}>
        <Text style={[styles.day, { color: faded ? palette.gray[500] : accent }]}>
          {line.start.day}
        </Text>
        <Text style={[styles.month, { color: faded ? palette.gray[500] : colors.textMuted }]}>
          {line.start.month}
        </Text>
        {line.endDay && (
          <>
            <View style={[styles.span, { borderColor: theme.teamChip(tone).bg }]} />
            <Text style={[styles.month, { color: colors.textMuted }]}>{line.endDay}</Text>
          </>
        )}
      </View>
      {line.featured ? <Cover line={line} /> : <Row line={line} />}
    </View>
  )
}

function Row({ line }: { line: HomeLine }) {
  const theme = useTheme()
  const { colors } = theme
  const { tone, faded, struck, badge } = line

  return (
    <View style={[styles.row, { backgroundColor: colors.surface }]}>
      <View
        style={[
          styles.stripe,
          { backgroundColor: faded ? theme.teamChip(tone).bg : palette[tone][500] },
        ]}
      />
      <View style={styles.rowText}>
        <Text
          numberOfLines={2}
          style={[
            textStyles.cardTitle,
            { color: faded ? colors.textMuted : colors.text },
            struck && styles.struck,
          ]}
        >
          {line.event.name}
        </Text>
        <Text numberOfLines={1} style={[textStyles.caption, { color: colors.textMuted }]}>
          {line.subtitle}
        </Text>
      </View>
      {badge && <Badge {...BADGES[badge]} />}
    </View>
  )
}

function Cover({ line }: { line: HomeLine }) {
  const theme = useTheme()
  const { colors } = theme
  const { tone, badge, event, days } = line
  const [from, to] = theme.cover(tone)

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          boxShadow: `0 16px 30px -18px ${palette[tone][900]}99`,
        },
      ]}
    >
      <View style={[styles.cover, { backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }]}>
        {badge && (
          <View style={styles.coverBadge}>
            <Badge {...BADGES[badge]} />
          </View>
        )}
        <Text numberOfLines={2} style={styles.coverName}>
          {event.name}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardPlace, { color: theme.badge(tone).text }]}>{event.place}</Text>
        <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
          {days > 1 ? `${days} dias` : longDate(event.period.startDate)}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', gap: 12 },
  dates: { width: 46, alignItems: 'center', paddingTop: 6, gap: 2 },
  day: { fontFamily: fonts.sans700, fontSize: 20, lineHeight: 22 },
  month: { fontFamily: fonts.sans600, fontSize: 12 },
  span: { flex: 1, minHeight: 16, borderLeftWidth: 2, borderStyle: 'dashed', marginVertical: 4 },
  row: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stripe: { width: 8, alignSelf: 'stretch', borderRadius: 4 },
  rowText: { flex: 1, gap: 2 },
  struck: { textDecorationLine: 'line-through' },
  card: { flex: 1, borderRadius: 22, overflow: 'hidden' },
  cover: { height: 118, padding: 12, justifyContent: 'space-between' },
  coverBadge: { flexDirection: 'row' },
  coverName: { fontFamily: fonts.sans700, fontSize: 22, lineHeight: 26, color: '#FFFFFF' },
  cardBody: { paddingVertical: 12, paddingHorizontal: 14, gap: 2 },
  cardPlace: { fontFamily: fonts.sans600, fontSize: 14 },
  cardMeta: { fontFamily: fonts.sans400, fontSize: 12 },
})
