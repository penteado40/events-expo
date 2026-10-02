import { useRouter } from 'expo-router'
import { useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { QueryError } from '@/shared/components/ui'
import { isSuperAdmin } from '@/shared/domain/roles'
import { useSession } from '@/shared/session'
import { colors, fonts, spacing, textStyles } from '@/shared/theme'

import { useEvents } from '../hooks/use-events'
import type { Event } from '../schemas'
import type { DetailTab } from '../detail-tab'
import { EventCard } from './event-card'
import { EventsSkeleton } from './events-skeleton'
import { NoEvents } from './no-events'

/** Eventos: the Events the viewer can see, a card per Event. */
export function EventsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const superAdmin = useSession((state) => !!state.session && isSuperAdmin(state.session.user))
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
        <NoEvents superAdmin={superAdmin} />
      ) : (
        <EventList
          events={events.data}
          onOpen={(id, tab) =>
            router.push({
              pathname: '/events/[id]',
              params: tab === 'summary' ? { id } : { id, tab },
            })
          }
        />
      )}
    </ScrollView>
  )
}

function EventList({
  events,
  onOpen,
}: {
  events: Event[]
  onOpen: (id: number, tab: DetailTab) => void
}) {
  return (
    <>
      {events.map((event) => (
        <EventCard key={event.id} event={event} onOpen={(tab) => onOpen(event.id, tab)} />
      ))}
    </>
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
})
