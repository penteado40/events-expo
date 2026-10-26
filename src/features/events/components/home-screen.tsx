import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { QueryError } from '@/shared/components/ui'
import { isSuperAdmin } from '@/shared/domain/roles'
import { useSession } from '@/shared/session'
import { colors, fonts, spacing } from '@/shared/theme'

import { detailHref } from '../detail-tab'
import { firstName, formatToday } from '../greeting'
import { homeSummary, pendingByEvent, pendingTotal } from '../home-summary'
import { useEvents, useRefetchEventsOnFocus } from '../hooks/use-events'
import type { Event } from '../schemas'
import { HomeGrid, HomeGridSkeleton } from './home-grid'
import { HappeningNow, NextEvents } from './home-events'
import { PendingByEvent, PendingHero } from './home-pending'
import { NoEvents } from './no-events'

/**
 * Início, the tabs' first screen: the greeting, then the viewer's active Events happening now, their
 * numbers and the next ones, from the same Events list as Eventos (ADR-0003), and the Verification
 * work waiting for them.
 */
export function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const user = useSession((state) => state.session?.user)
  const events = useEvents()
  // Only a pull shows the spinner; background refetches (focus, remount) stay silent.
  const [pulling, setPulling] = useState(false)
  // "Próximos eventos" expanded; closed whenever Início loses focus (another tab, an Event).
  const [upcomingExpanded, setUpcomingExpanded] = useState(false)

  useRefetchEventsOnFocus()
  useFocusEffect(useCallback(() => () => setUpcomingExpanded(false), []))

  const refresh = async () => {
    setPulling(true)
    await events.refetch()
    setPulling(false)
  }

  if (!user) return null
  const openEvents = () => router.navigate('/events')
  const openSummary = (id: number) => router.push(detailHref(id, 'summary'))
  const openContributions = (id: number) => router.push(detailHref(id, 'contributions'))

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.screen, { paddingTop: insets.top + 16 }]}
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
      <View style={styles.greeting}>
        <Text style={styles.date}>{formatToday(new Date())}</Text>
        <Text style={styles.hello} numberOfLines={1} adjustsFontSizeToFit>
          Olá, {firstName(user.name)}
        </Text>
      </View>

      {events.isPending ? (
        <HomeGridSkeleton />
      ) : events.isError && !events.data ? (
        <QueryError message={events.error.message} onRetry={() => events.refetch()} />
      ) : events.data.length === 0 ? (
        <NoEvents superAdmin={isSuperAdmin(user)} />
      ) : (
        <HomeContent
          events={events.data}
          now={new Date()}
          onOpenEvents={openEvents}
          onOpenSummary={openSummary}
          onOpenContributions={openContributions}
          upcomingExpanded={upcomingExpanded}
          onUpcomingExpandedChange={setUpcomingExpanded}
        />
      )}
    </ScrollView>
  )
}

/**
 * What's happening, the grid and what's next, as of `now`; then the pending work where the viewer
 * does the Verification: the hero (hidden when they verify no Event) and "Conferir por evento".
 */
function HomeContent({
  events,
  now,
  onOpenEvents,
  onOpenSummary,
  onOpenContributions,
  upcomingExpanded,
  onUpcomingExpandedChange,
}: {
  events: Event[]
  now: Date
  onOpenEvents: () => void
  onOpenSummary: (id: number) => void
  onOpenContributions: (id: number) => void
  upcomingExpanded: boolean
  onUpcomingExpandedChange: (expanded: boolean) => void
}) {
  const summary = homeSummary(events, now)
  const total = pendingTotal(events)
  return (
    <>
      <HappeningNow events={summary.happening} onOpen={onOpenSummary} />
      <HomeGrid summary={summary} onOpen={onOpenEvents} />
      <NextEvents
        next={summary.next}
        upcoming={summary.upcoming}
        onOpen={onOpenSummary}
        expanded={upcomingExpanded}
        onExpandedChange={onUpcomingExpandedChange}
      />
      {total !== null && <PendingHero total={total} onOpen={onOpenEvents} />}
      <PendingByEvent rows={pendingByEvent(events)} onOpen={onOpenContributions} />
    </>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { paddingHorizontal: spacing.screen, paddingBottom: spacing.tabBarClearance, gap: 14 },
  greeting: { paddingHorizontal: 6, gap: 4 },
  date: { fontFamily: fonts.mono400, fontSize: 13, color: colors.textMuted },
  hello: { fontFamily: fonts.sans600, fontSize: 32, color: colors.text },
})
