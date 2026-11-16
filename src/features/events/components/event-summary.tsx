import { useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Badge, ErrorState, Icon, ListSkeleton } from '@/shared/components/ui'
import { autoTone } from '@/shared/domain/auto-tone'
import { dayAndMonth, periodLabel, weekday } from '@/shared/domain/local-dates'
import { timezoneCity } from '@/shared/domain/timezones'
import { fonts, palette, spacing, textStyles, useTheme } from '@/shared/theme'

import type { Event } from '../api'
import { useSchedule } from '../hooks/use-schedule'
import { summaryCards, type SummaryCard } from '../personal-schedule'
import { EVENT_TAB_BAR_SPACE, EventTabBar } from './event-tab-bar'

/**
 * The Event for who goes (D-Resumo, stories 24, 26, 27): the cover in its color, the card with
 * "VOCÊ VAI", the name, where in its timezone ("horário de Manaus") and the period; then the
 * Summary, a card per item with a Field in Highlight showing only those, the Fields of people as
 * the viewer's own ("Seu quarto: 101"). A card opens its item. The Event's bar below.
 */
export function EventSummaryScreen({ event, viewerId }: { event: Event; viewerId: number }) {
  const theme = useTheme()
  const { colors } = theme
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const schedule = useSchedule(event.id)
  const tone = autoTone(event.id)
  const [from, to] = theme.cover(tone)
  const cards = schedule.data && summaryCards(schedule.data, event.period, viewerId)
  const { period } = event

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: EVENT_TAB_BAR_SPACE }}>
        <View
          style={[
            styles.cover,
            {
              height: insets.top + 150,
              backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
            },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={[styles.back, { top: insets.top + 8 }]}
          >
            <Icon name="back" color="#FFFFFF" size={20} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                boxShadow: `0 18px 32px -18px ${palette[tone][900]}80`,
              },
            ]}
          >
            {event.cancelled ? (
              <Badge label="CANCELADO" tone="red" />
            ) : (
              <Badge label="VOCÊ VAI" tone="green" />
            )}
            <Text
              accessibilityRole="header"
              style={[styles.name, { color: colors.text }, event.cancelled && styles.struck]}
            >
              {event.name}
            </Text>
            <View style={[styles.facts, { borderColor: colors.divider }]}>
              <Fact
                tone={tone}
                icon="place"
                title={event.place}
                detail={`horário de ${timezoneCity(period.timezone)}`}
              />
              <Fact
                tone={tone}
                icon="calendar"
                title={periodLabel(period)}
                detail={
                  period.startDate === period.endDate
                    ? weekday(period.startDate)
                    : `${weekday(period.startDate)} a ${weekday(period.endDate)}`
                }
              />
            </View>
          </View>

          {schedule.error ? (
            <ErrorState message={schedule.error.message} onRetry={() => schedule.refetch()} />
          ) : !cards ? (
            <ListSkeleton />
          ) : cards.length === 0 ? (
            <Text style={[textStyles.body, { color: colors.textMuted }]}>
              Nada no Resumo por enquanto. A programação inteira está na Timeline.
            </Text>
          ) : (
            cards.map((card) => (
              <Card
                key={card.line.id}
                card={card}
                tone={tone}
                onPress={() => router.push(`/events/${event.id}/items/${card.line.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
      <EventTabBar eventId={event.id} current="summary" />
    </View>
  )
}

function Fact({
  tone,
  icon,
  title,
  detail,
}: {
  tone: ReturnType<typeof autoTone>
  icon: 'place' | 'calendar'
  title: string
  detail: string
}) {
  const theme = useTheme()
  const badge = theme.badge(tone)
  return (
    <View style={styles.fact}>
      <View style={[styles.factIcon, { backgroundColor: badge.bg }]}>
        <Icon name={icon} color={badge.text} size={18} />
      </View>
      <View style={styles.factText}>
        <Text style={[styles.factTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[textStyles.caption, { color: theme.colors.textMuted }]}>{detail}</Text>
      </View>
    </View>
  )
}

/** A card of the Summary: the day and the local time (or "INFO"), the name and its Highlights. */
function Card({
  card,
  tone,
  onPress,
}: {
  card: SummaryCard
  tone: ReturnType<typeof autoTone>
  onPress: () => void
}) {
  const { colors } = useTheme()
  const { line, date } = card
  const cancelled = line.state === 'CANCELLED'
  const day = date ? String(Number(dayAndMonth(date).day)) : null
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[
        day ? `dia ${day}` : 'Informações gerais',
        line.time,
        line.name,
        ...card.highlights,
        cancelled ? 'cancelado' : null,
      ]
        .filter(Boolean)
        .join(', ')}
      style={[styles.summaryCard, { backgroundColor: cancelled ? colors.divider : colors.surface }]}
    >
      <View style={styles.when}>
        {day ? (
          <>
            <Text style={[styles.day, { color: palette[tone][700] }]}>{day}</Text>
            <Text style={[styles.time, { color: colors.textMuted }]}>
              {line.time ?? 'a definir'}
            </Text>
          </>
        ) : (
          <Text style={[styles.info, { color: colors.textMuted }]}>INFO</Text>
        )}
      </View>
      <View style={styles.cardText}>
        <View style={styles.cardTop}>
          <Text
            style={[styles.itemName, { color: colors.text }, cancelled && styles.struck]}
            numberOfLines={2}
          >
            {line.name}
          </Text>
          {cancelled && <Badge label="CANCELADO" tone="red" />}
        </View>
        <Text style={[styles.highlights, { color: colors.textMuted }]}>
          {card.highlights.join(' · ')}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  cover: { borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' },
  back: {
    position: 'absolute',
    left: 16,
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    borderRadius: spacing.touchTarget / 2,
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { marginTop: -72, paddingHorizontal: 16, gap: 10 },
  card: { borderRadius: 24, padding: 16, gap: 12, marginBottom: 6 },
  name: { fontFamily: fonts.sans700, fontSize: 28, lineHeight: 30 },
  struck: { textDecorationLine: 'line-through' },
  facts: { borderTopWidth: 1, paddingTop: 12, flexDirection: 'row', gap: 8 },
  fact: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  factIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factText: { flex: 1 },
  factTitle: { fontFamily: fonts.sans600, fontSize: 14 },
  summaryCard: {
    minHeight: spacing.touchTarget,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  when: { width: 44, alignItems: 'center' },
  day: { fontFamily: fonts.sans700, fontSize: 17, lineHeight: 18 },
  time: { fontFamily: fonts.sans600, fontSize: 11 },
  info: { fontFamily: fonts.sans700, fontSize: 11 },
  cardText: { flex: 1, gap: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemName: { flexShrink: 1, fontFamily: fonts.sans600, fontSize: 15 },
  highlights: { fontFamily: fonts.sans400, fontSize: 13 },
})
