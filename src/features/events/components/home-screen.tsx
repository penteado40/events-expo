import { useRouter } from 'expo-router'
import { useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { QueryError } from '@/shared/components/ui'
import { isSuperAdmin } from '@/shared/domain/roles'
import { useSession } from '@/shared/session'
import { colors, fonts, spacing } from '@/shared/theme'

import { firstName, formatToday } from '../greeting'
import { homeSummary } from '../home-summary'
import { useEvents, useRefetchEventsOnFocus } from '../hooks/use-events'
import { HomeGrid, HomeGridSkeleton } from './home-grid'
import { NoEvents } from './no-events'

/**
 * Início, the tabs' first screen: the greeting and the numbers of the viewer's active Events, from
 * the same Events list as Eventos (ADR-0003).
 */
export function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const user = useSession((state) => state.session?.user)
  const events = useEvents()
  // Only a pull shows the spinner; background refetches (focus, remount) stay silent.
  const [pulling, setPulling] = useState(false)

  useRefetchEventsOnFocus()

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
        <HomeGrid summary={homeSummary(events.data)} onOpen={openEvents} />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { paddingHorizontal: spacing.screen, paddingBottom: spacing.tabBarClearance, gap: 14 },
  greeting: { paddingHorizontal: 6, gap: 4 },
  date: { fontFamily: fonts.mono400, fontSize: 13, color: colors.textMuted },
  hello: { fontFamily: fonts.sans600, fontSize: 32, color: colors.text },
})
