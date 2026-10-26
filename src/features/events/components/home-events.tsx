import { StyleSheet, Text, View } from 'react-native'

import { Glass, PressableGlass } from '@/shared/components/ui'
import { formatEventDayMonth } from '@/shared/domain/events'
import { colors, fonts, radii } from '@/shared/theme'

import { eventPlace } from '../event-place'
import { distanceLabel, UPCOMING_DAYS, type Upcoming } from '../home-summary'
import type { Event } from '../schemas'
import { HomeSection } from './home-section'

/** "Acontecendo agora": a card per active Event in progress, each opening it on Resumo. */
export function HappeningNow({
  events,
  onOpen,
}: {
  events: Event[]
  onOpen: (id: number) => void
}) {
  if (events.length === 0) return null
  return (
    <HomeSection title="ACONTECENDO AGORA">
      {events.map((event) => (
        <HomeEventCard
          key={event.id}
          event={event}
          when="agora"
          accessibilityLabel={`Acontecendo agora: ${event.name}`}
          onOpen={onOpen}
        />
      ))}
    </HomeSection>
  )
}

/** At most this many glass edges peek below the "Próximos eventos" card. */
const MAX_LAYERS = 2
/** How far each stacked edge peeks below the one above it, how much narrower and fainter it is. */
const STACK_PEEK = 8
const STACK_INSET = 12
const STACK_FADE = 0.3
/** Each edge's height: enough to round its bottom corners, the rest hidden behind the card. */
const STACK_LAYER_HEIGHT = 48

/**
 * "Próximos eventos": the nearest upcoming Event, however far, opening it on Resumo. When others
 * start within UPCOMING_DAYS too, glass edges peek below it, like a stack of notifications.
 */
export function NextEvents({
  next,
  upcoming,
  onOpen,
}: {
  next: Upcoming<Event> | null
  /** The Events starting within UPCOMING_DAYS, the nearest (`next`) first. */
  upcoming: Upcoming<Event>[]
  onOpen: (id: number) => void
}) {
  if (!next) return null
  const others = Math.max(upcoming.length - 1, 0)
  const layers = Math.min(others, MAX_LAYERS)
  const distance = distanceLabel(next.days)
  const label = [
    `Próximo evento: ${next.event.name}, ${distance}`,
    others > 0 && `Mais ${others} nos próximos ${UPCOMING_DAYS} dias`,
  ]
    .filter(Boolean)
    .join('. ')

  return (
    <HomeSection title="PRÓXIMOS EVENTOS">
      <View style={{ paddingBottom: layers * STACK_PEEK }}>
        {Array.from({ length: layers }, (_, index) => layers - index).map((depth) => (
          <View
            key={depth}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[
              styles.layer,
              {
                left: depth * STACK_INSET,
                right: depth * STACK_INSET,
                bottom: (layers - depth) * STACK_PEEK,
                opacity: 1 - depth * STACK_FADE,
              },
            ]}
          >
            <Glass variant="card" radius={radii.eventCard} style={styles.layerGlass} />
          </View>
        ))}
        <HomeEventCard
          event={next.event}
          when={distance}
          accessibilityLabel={label}
          onOpen={onOpen}
        />
      </View>
    </HomeSection>
  )
}

/**
 * An Event on Início (README "Início"): its day and month on the left, name and "tipo · local" in
 * the middle, and where it stands in lime on the right.
 */
function HomeEventCard({
  event,
  when,
  accessibilityLabel,
  onOpen,
}: {
  event: Event
  /** Where it stands, in lime: "agora", "hoje", "em N dias". */
  when: string
  accessibilityLabel: string
  onOpen: (id: number) => void
}) {
  const { day, month } = formatEventDayMonth(event.startsAt, event.timezone)
  return (
    <PressableGlass
      variant="card"
      radius={radii.eventCard}
      onPress={() => onOpen(event.id)}
      accessibilityLabel={accessibilityLabel}
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
  layer: { position: 'absolute', height: STACK_LAYER_HEIGHT },
  layerGlass: { flex: 1 },
})
