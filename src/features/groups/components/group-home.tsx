import { useState, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { ErrorState, GroupGreeting, GroupHeader, ListSkeleton } from '@/shared/components/ui'
import { useSession } from '@/shared/session'
import { spacing, useTheme } from '@/shared/theme'

import type { CurrentGroup } from '../current-group'
import { useCurrentGroup } from '../hooks/use-current-group'
import { GroupSwitcher } from './group-switcher'
import { NoGroup } from './no-group'

type Props = {
  /** Also re-read when "Atualizar" looks for a Group again, e.g. the User's Membership. */
  onRefresh?: () => Promise<unknown>
  /** The Início of the current Group, with the header's Group pill to place. */
  children: (props: { group: CurrentGroup; switcher: ReactNode }) => ReactNode
}

/**
 * The Group around the Início: waits for the person's Groups, then shows the chosen one (switched
 * in the "Seus Groups" sheet and remembered); "Você ainda não está em nenhum Group" when there is
 * none. Switching remounts the Início, so it loads the new Group from scratch.
 */
export function GroupHome({ onRefresh, children }: Props) {
  const { loading, error, group, options, choose, refetch } = useCurrentGroup()
  const [refreshing, setRefreshing] = useState(false)

  if (group) {
    const switcher = <GroupSwitcher current={group} options={options} onChoose={choose} />
    return (
      <View key={group.id} style={styles.screen}>
        {children({ group, switcher })}
      </View>
    )
  }

  const refresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([refetch(), onRefresh?.()])
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <Frame>
      {loading ? (
        <View style={styles.padded}>
          <ListSkeleton />
        </View>
      ) : error ? (
        <View style={styles.padded}>
          <ErrorState message={error.message} onRetry={() => refetch()} />
        </View>
      ) : (
        <NoGroup
          refreshing={refreshing}
          onRefresh={refresh}
          onSignOut={() => useSession.getState().signOut()}
        />
      )}
    </Frame>
  )
}

/** The header with only the date and the greeting, while there is no Group to show. */
function Frame({ children }: { children: ReactNode }) {
  const { colors } = useTheme()

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <GroupHeader>
        <GroupGreeting />
      </GroupHeader>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  padded: { paddingTop: 18, paddingHorizontal: 20, paddingBottom: spacing.tabBarClearance },
})
