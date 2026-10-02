import { useQueryClient } from '@tanstack/react-query'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Glass, QueryError } from '@/shared/components/ui'
import { isSuperAdmin } from '@/shared/domain/roles'
import { eventsKey } from '@/shared/lib/query-keys'
import { useSession } from '@/shared/session'
import { colors, fonts, radii, spacing } from '@/shared/theme'

import { homeSummary } from '../home-summary'
import { useEvents } from '../hooks/use-events'
import { HomeGrid, HomeGridSkeleton } from './home-grid'

/** Today in the device's timezone, e.g. "qui., 1 de out.". */
const today = () =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).format(
    new Date(),
  )

const firstName = (name: string) => name.trim().split(/\s+/)[0]

/**
 * Início, the tabs' first screen: the greeting and the numbers of the viewer's active Events, from
 * the same Events list as Eventos (ADR-0003).
 */
export function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const client = useQueryClient()
  const user = useSession((state) => state.session?.user)
  const events = useEvents()
  // Only a pull shows the spinner; background refetches (focus, remount) stay silent.
  const [pulling, setPulling] = useState(false)

  // Coming back to Início refetches stale data; a fetch already on its way is kept.
  useFocusEffect(
    useCallback(() => {
      const stale = { queryKey: eventsKey, exact: true, stale: true }
      void client.refetchQueries(stale, { cancelRefetch: false })
    }, [client]),
  )

  const refresh = async () => {
    setPulling(true)
    await events.refetch()
    setPulling(false)
  }

  if (!user) return null
  const openEvents = () => router.navigate('/events')

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
        <Text style={styles.date}>{today()}</Text>
        <Text style={styles.hello} numberOfLines={1} adjustsFontSizeToFit>
          Olá, {firstName(user.name)}
        </Text>
      </View>

      {events.isPending ? (
        <HomeGridSkeleton />
      ) : events.isError && !events.data ? (
        <QueryError message={events.error.message} onRetry={() => events.refetch()} />
      ) : events.data.length === 0 ? (
        <EmptyState superAdmin={isSuperAdmin(user)} />
      ) : (
        <HomeGrid summary={homeSummary(events.data)} onOpen={openEvents} />
      )}
    </ScrollView>
  )
}

/** No Event to sum up: a member of none, or a Super admin before any Event exists. */
function EmptyState({ superAdmin }: { superAdmin: boolean }) {
  return (
    <Glass variant="card" radius={radii.eventCard} contentStyle={styles.empty}>
      <Text style={styles.emptyTitle}>Nenhum evento ainda.</Text>
      <Text style={styles.emptyText}>
        {superAdmin
          ? 'Nenhum evento foi criado.'
          : 'Um Super admin precisa te adicionar como membro.'}
      </Text>
    </Glass>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { paddingHorizontal: spacing.screen, paddingBottom: spacing.tabBarClearance, gap: 14 },
  greeting: { paddingHorizontal: 6, gap: 4 },
  date: { fontFamily: fonts.mono400, fontSize: 13, color: colors.textMuted },
  hello: { fontFamily: fonts.sans600, fontSize: 32, color: colors.text },
  empty: { paddingVertical: 20, paddingHorizontal: 18, gap: 6 },
  emptyTitle: { fontFamily: fonts.sans500, fontSize: 17, color: colors.text },
  emptyText: { fontFamily: fonts.sans400, fontSize: 14, lineHeight: 20, color: colors.textMuted },
})
