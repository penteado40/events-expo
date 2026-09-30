import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useRef, useState, type ReactNode } from 'react'
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Glass, PressableGlass, QueryError, SkeletonBlock, StatCard } from '@/shared/components/ui'
import { formatEventDate, isArchived } from '@/shared/domain/events'
import { roleLabel } from '@/shared/domain/roles'
import { eventKey } from '@/shared/lib/query-keys'
import { colors, fonts, radii, spacing, textStyles } from '@/shared/theme'

import { eventTypeLabel, eventVenue } from '../event-place'
import { useEvent } from '../hooks/use-events'
import type { Event } from '../schemas'
import { SegmentedTabs } from './segmented-tabs'

const BACK_SIZE = 44

type DetailTab = 'summary' | 'rsvps' | 'registry' | 'contributions'

/** A tab's content, built by the route from other features (ADR-0001) once the Event loads. */
type Slot = (event: Event) => ReactNode

type Props = { id: number } & { summary: Slot } & Partial<Record<DetailTab, Slot>>

/**
 * The Event detail: top bar, header and sticky segmented tabs over the active tab's content.
 * Pulling refreshes the Event and whatever of it is on screen.
 */
export function EventDetailScreen({ id, ...slots }: Props) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const client = useQueryClient()
  const event = useEvent(id)
  const [tab, setTab] = useState<DetailTab>('summary')
  // Only a pull shows the spinner; background refetches (focus, remount) stay silent.
  const [pulling, setPulling] = useState(false)

  const scroll = useRef<ScrollView>(null)
  const offset = useRef(0)
  // Where the tabs start (the header's bottom) and their height. The tabs' own onLayout can't
  // tell where they start: the sticky header wraps them, so their y is always 0.
  const [tabsY, setTabsY] = useState(0)
  const [tabsHeight, setTabsHeight] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  const refresh = async () => {
    setPulling(true)
    // Every query of this Event lives under its key; `active` keeps it to what's on screen.
    await client.refetchQueries({ queryKey: eventKey(id), type: 'active' })
    setPulling(false)
  }

  // Past the header, the tabs stay pinned and the new tab starts at its top.
  const selectTab = (next: DetailTab) => {
    if (next === tab) return
    setTab(next)
    if (offset.current > tabsY) scroll.current?.scrollTo({ y: tabsY, animated: false })
  }

  const failed = event.isError && !event.data
  const slot = slots[tab]

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <ScrollView
        ref={scroll}
        style={styles.flex}
        contentContainerStyle={{ paddingTop: 6, paddingBottom: insets.bottom + 32 }}
        stickyHeaderIndices={failed ? undefined : [1]}
        scrollEventThrottle={16}
        onScroll={(e) => {
          offset.current = e.nativeEvent.contentOffset.y
        }}
        onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}
        refreshControl={
          <RefreshControl
            refreshing={pulling}
            onRefresh={refresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.bg}
          />
        }
      >
        <View onLayout={({ nativeEvent: { layout } }) => setTabsY(layout.y + layout.height)}>
          <View style={styles.bar}>
            <PressableGlass
              variant="pill"
              radius={radii.backButton}
              onPress={() => router.back()}
              accessibilityLabel="Voltar"
              contentStyle={styles.back}
            >
              <Text style={styles.backArrow}>←</Text>
            </PressableGlass>
            <Text style={[textStyles.monoCaption, styles.barTitle]} numberOfLines={1}>
              {event.data ? `#${event.data.id} · ${roleLabel(event.data.membership)}` : `#${id}`}
            </Text>
          </View>

          <View style={styles.header}>
            {event.data ? (
              <Header event={event.data} />
            ) : failed ? (
              <QueryError message={event.error.message} onRetry={() => event.refetch()} />
            ) : (
              <HeaderSkeleton />
            )}
          </View>
        </View>

        {!failed && (
          <View style={styles.tabs} onLayout={(e) => setTabsHeight(e.nativeEvent.layout.height)}>
            <SegmentedTabs
              active={tab}
              onChange={selectTab}
              tabs={[
                { key: 'summary', label: 'Resumo' },
                { key: 'rsvps', label: 'RSVPs' },
                { key: 'registry', label: 'Presentes' },
                {
                  key: 'contributions',
                  label: 'Conferir',
                  dot: (event.data?.paidContributionCount ?? 0) > 0,
                },
              ]}
            />
          </View>
        )}

        {!failed && (
          // Tall enough for the tabs to pin even over a short tab.
          <View style={[styles.content, { minHeight: viewportHeight - tabsHeight }]}>
            {!event.data ? <ContentSkeleton /> : slot ? slot(event.data) : <ComingSoon />}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

function Header({ event }: { event: Event }) {
  const venue = eventVenue(event)
  const { mapsUrl } = event

  return (
    <>
      <Text style={styles.name}>{event.name}</Text>
      <Text style={styles.meta}>
        {formatEventDate(event.startsAt, event.timezone)} · {eventTypeLabel(event.type)}
      </Text>
      {venue &&
        (mapsUrl ? (
          <Pressable
            onPress={() => Linking.openURL(mapsUrl)}
            accessibilityRole="link"
            accessibilityLabel={`Abrir ${venue} no mapa`}
            hitSlop={8}
          >
            <Text style={styles.venue}>{venue} ↗</Text>
          </Pressable>
        ) : (
          <Text style={styles.venue}>{venue}</Text>
        ))}
      {isArchived(event) && (
        <Text style={styles.archived}>ARQUIVADO · site não aceita escritas</Text>
      )}
    </>
  )
}

function HeaderSkeleton() {
  return (
    <View style={styles.skeleton} accessibilityLabel="Carregando evento">
      <SkeletonBlock width="75%" height={32} radius={10} />
      <SkeletonBlock width={200} height={13} />
      <SkeletonBlock width={170} height={14} />
    </View>
  )
}

/** The first load of the Event: glass shaped like the Resumo, before its blocks can start. */
function ContentSkeleton() {
  return (
    <View style={styles.skeleton} accessibilityLabel="Carregando resumo">
      {[0, 1].map((row) => (
        <View key={row} style={styles.statRow}>
          <StatCard label=" " />
          <StatCard label=" " />
        </View>
      ))}
      <Glass variant="card" radius={radii.stat} contentStyle={styles.soon}>
        <SkeletonBlock width="60%" height={14} />
      </Glass>
    </View>
  )
}

/** A tab whose slice isn't built yet. */
function ComingSoon() {
  return (
    <Glass variant="card" radius={radii.stat} contentStyle={styles.soon}>
      <Text style={styles.soonText}>Em breve.</Text>
    </Glass>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14 },
  back: { width: BACK_SIZE, height: BACK_SIZE, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontFamily: fonts.sans400, fontSize: 18, color: colors.text },
  // Offsets the back button, so the caption sits in the middle of the screen.
  barTitle: { flex: 1, textAlign: 'center', paddingRight: BACK_SIZE + 6 },
  header: { paddingTop: 10, paddingBottom: 16, paddingHorizontal: spacing.eventHeader, gap: 6 },
  name: { fontFamily: fonts.sans600, fontSize: 30, lineHeight: 34, color: colors.text },
  meta: { fontFamily: fonts.mono400, fontSize: 13, color: colors.textMuted },
  venue: { fontFamily: fonts.sans400, fontSize: 14, color: colors.textSoft },
  archived: { marginTop: 4, fontFamily: fonts.mono400, fontSize: 12, color: colors.warning },
  skeleton: { gap: 10 },
  statRow: { flexDirection: 'row', gap: 10 },
  tabs: { paddingHorizontal: spacing.screen, paddingBottom: 14 },
  content: { paddingHorizontal: spacing.screen, gap: 10 },
  soon: { paddingVertical: 20, alignItems: 'center' },
  soonText: { fontFamily: fonts.sans400, fontSize: 14, color: colors.textMuted },
})
