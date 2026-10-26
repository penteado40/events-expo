import { useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { Glass } from '@/shared/components/ui'
import { radii } from '@/shared/theme'

import { distanceLabel, UPCOMING_DAYS, type Upcoming } from '../home-summary'
import type { Event } from '../schemas'
import { HomeEventCard } from './home-event-card'
import { HomeSection } from './home-section'
import { UpcomingList, type Origin, type StackShape } from './upcoming-list'

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
          onPress={() => onOpen(event.id)}
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
 * start within UPCOMING_DAYS too, glass edges peek below it, like a stack of notifications, and
 * tapping it expands them in place (`expanded`, kept by Início) instead.
 */
export function NextEvents({
  next,
  upcoming,
  onOpen,
  expanded,
  onExpandedChange,
}: {
  next: Upcoming<Event> | null
  /** The Events starting within UPCOMING_DAYS, the nearest (`next`) first. */
  upcoming: Upcoming<Event>[]
  onOpen: (id: number) => void
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
}) {
  const section = useRef<View>(null)
  const [origin, setOrigin] = useState<Origin | null>(null)
  const [cardHeight, setCardHeight] = useState(0)
  const others = Math.max(upcoming.length - 1, 0)
  const expandable = next !== null && others > 0

  // A refetch can leave nothing to expand: close, so the list doesn't reopen by itself later.
  useEffect(() => {
    if (expanded && !expandable) onExpandedChange(false)
  }, [expanded, expandable, onExpandedChange])

  if (!next) return null
  const layers = Math.min(others, MAX_LAYERS)
  const distance = distanceLabel(next.days)
  const label = [
    `Próximo evento: ${next.event.name}, ${distance}`,
    others > 0 && `Mais ${others} nos próximos ${UPCOMING_DAYS} dias`,
  ]
    .filter(Boolean)
    .join('. ')
  const shape: StackShape = {
    peek: STACK_PEEK,
    inset: STACK_INSET,
    fade: STACK_FADE,
    layers,
  }

  const expand = () => {
    // Synchronous on the new architecture, so the list opens already in place.
    section.current?.measureInWindow?.((x, y, width) => setOrigin({ x, y, width, cardHeight }))
    onExpandedChange(true)
  }
  const openFromList = (id: number) => {
    onExpandedChange(false)
    onOpen(id)
  }

  return (
    <View ref={section}>
      {/* Hidden while expanded: the list's cards are the stack, fanned out. */}
      <View style={expanded && styles.hidden}>
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
            <View onLayout={(event) => setCardHeight(event.nativeEvent.layout.height)}>
              <HomeEventCard
                event={next.event}
                when={distance}
                accessibilityLabel={label}
                accessibilityHint={
                  expandable ? `Abre a lista dos próximos ${UPCOMING_DAYS} dias` : undefined
                }
                onPress={expandable ? expand : () => onOpen(next.event.id)}
              />
            </View>
          </View>
        </HomeSection>
      </View>
      {expanded && expandable && (
        <UpcomingList origin={origin} shape={shape} onClose={() => onExpandedChange(false)}>
          {upcoming.map(({ event, days }) => {
            const when = distanceLabel(days)
            return (
              <HomeEventCard
                key={event.id}
                event={event}
                when={when}
                accessibilityLabel={`${event.name}, ${when}`}
                onPress={() => openFromList(event.id)}
              />
            )
          })}
        </UpcomingList>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  hidden: { opacity: 0 },
  layer: { position: 'absolute', height: STACK_LAYER_HEIGHT },
  layerGlass: { flex: 1 },
})
