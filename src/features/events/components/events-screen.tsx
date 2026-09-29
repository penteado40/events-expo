import { useRouter } from 'expo-router'
import { useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Glass, QueryError } from '@/shared/components/ui'
import { pendingTotal } from '@/shared/domain/events'
import { useSession } from '@/shared/session'
import { colors, fonts, radii, spacing, textStyles } from '@/shared/theme'

import { useEvents } from '../hooks/use-events'
import type { Event } from '../schemas'
import { EventCard } from './event-card'
import { EventsSkeleton } from './events-skeleton'

/** Eventos: the Events the viewer can see, the "Para conferir" total and a card per Event. */
export function EventsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const superAdmin = useSession((state) => state.session?.user.role === 'SUPER_ADMIN')
  const events = useEvents()
  // Only a pull shows the spinner; background refetches (focus, remount) stay silent.
  const [pulling, setPulling] = useState(false)

  const refresh = async () => {
    setPulling(true)
    await events.refetch()
    setPulling(false)
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.screen, { paddingTop: insets.top + 14 }]}
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
      <View style={styles.header}>
        <Text style={textStyles.screenTitle}>Eventos</Text>
        {events.data && (
          <Text style={styles.scope}>
            {events.data.length} · {superAdmin ? 'super admin' : 'seus eventos'}
          </Text>
        )}
      </View>

      {events.isPending ? (
        <EventsSkeleton />
      ) : events.isError && !events.data ? (
        <QueryError message={events.error.message} onRetry={() => events.refetch()} />
      ) : events.data.length === 0 ? (
        <EmptyState />
      ) : (
        <EventList
          events={events.data}
          onOpen={(id) => router.push({ pathname: '/events/[id]', params: { id } })}
        />
      )}
    </ScrollView>
  )
}

function EventList({ events, onOpen }: { events: Event[]; onOpen: (id: number) => void }) {
  return (
    <>
      <Glass variant="accent" radius={radii.heroCard} contentStyle={styles.hero}>
        <View style={styles.heroText}>
          <Text style={styles.heroLabel}>PARA CONFERIR</Text>
          <Text style={styles.heroSubtitle}>contribuições marcadas como pagas</Text>
        </View>
        <Text style={styles.heroCount}>{pendingTotal(events)}</Text>
      </Glass>
      {events.map((event) => (
        <EventCard key={event.id} event={event} onPress={() => onOpen(event.id)} />
      ))}
    </>
  )
}

/** A User who is a member of no Event: why the list is empty, and no hero. */
function EmptyState() {
  return (
    <Glass variant="card" radius={radii.eventCard} contentStyle={styles.empty}>
      <Text style={styles.emptyTitle}>Nenhum evento ainda.</Text>
      <Text style={styles.emptyText}>Um Super admin precisa te adicionar como membro.</Text>
    </Glass>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { paddingHorizontal: spacing.screen, paddingBottom: spacing.tabBarClearance, gap: 14 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 6,
  },
  scope: { fontFamily: fonts.mono400, fontSize: 13, color: colors.textMuted },
  hero: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  heroText: { flexShrink: 1, gap: 4 },
  heroLabel: {
    fontFamily: fonts.mono500,
    fontSize: 12,
    letterSpacing: 0.72,
    color: colors.accent,
  },
  heroSubtitle: { fontFamily: fonts.sans400, fontSize: 14, color: colors.heroSubtitle },
  heroCount: { fontFamily: fonts.mono500, fontSize: 50, lineHeight: 50, color: colors.accent },
  empty: { paddingVertical: 20, paddingHorizontal: 18, gap: 6 },
  emptyTitle: { fontFamily: fonts.sans500, fontSize: 17, color: colors.text },
  emptyText: { fontFamily: fonts.sans400, fontSize: 14, lineHeight: 20, color: colors.textMuted },
})
