import { useState } from 'react'
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { ErrorState, GroupHeader, Icon, ListSkeleton } from '@/shared/components/ui'
import { groupPermissions } from '@/shared/domain/permissions'
import { useSession } from '@/shared/session'
import { fonts, palette, spacing, textStyles, useTheme } from '@/shared/theme'

import type { CurrentGroup } from '../current-group'
import { useGroupMembers, useGroupTeams } from '../hooks/use-group-people'
import { peopleSections } from '../people-sections'
import { MemberRow } from './member-row'
import { TeamsList } from './teams-list'

type Tab = 'people' | 'teams'

const TABS: { tab: Tab; label: string }[] = [
  { tab: 'people', label: 'Pessoas' },
  { tab: 'teams', label: 'Teams' },
]

type Props = {
  group: CurrentGroup
  /** Pulling down also refreshes what is around the list: the Groups and the User's role. */
  onRefresh?: () => Promise<unknown>
}

/**
 * The Group's people and Teams (D-Pessoas, D-Teams, PROJ-216), to read. "+ Pessoa" and "+ Team"
 * show only to who manages them; what they open comes with PROJ-218 and PROJ-219.
 */
export function GroupPeople({ group, onRefresh }: Props) {
  const { colors } = useTheme()
  const myId = useSession((state) => state.session?.user.id)
  const [tab, setTab] = useState<Tab>('people')
  const [query, setQuery] = useState('')
  const [pulling, setPulling] = useState(false)
  const members = useGroupMembers(group.id)
  const teams = useGroupTeams(group.id)
  const permissions = groupPermissions(group.role)

  const current = tab === 'people' ? members : teams
  const count =
    tab === 'people'
      ? members.data && plural(members.data.length, 'pessoa', 'pessoas')
      : teams.data && plural(teams.data.length, 'Team', 'Teams')
  const canAdd = tab === 'people' ? permissions.managesPeople : permissions.managesTeams
  const sections = members.data ? peopleSections(members.data, query) : []

  const refresh = async () => {
    setPulling(true)
    try {
      await Promise.all([members.refetch(), teams.refetch(), onRefresh?.()])
    } finally {
      setPulling(false)
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <GroupHeader>
        <View style={styles.topRow}>
          <Text style={styles.count}>{count ? `${group.name} · ${count}` : group.name}</Text>
          {canAdd && (
            <Pressable
              disabled
              accessibilityRole="button"
              accessibilityLabel={tab === 'people' ? '+ Pessoa' : '+ Team'}
              accessibilityState={{ disabled: true }}
              style={styles.add}
            >
              <Text style={styles.addLabel}>{tab === 'people' ? '+ Pessoa' : '+ Team'}</Text>
            </Pressable>
          )}
        </View>
        <View accessibilityRole="tablist" style={styles.tabs}>
          {TABS.map(({ tab: id, label }) => {
            const selected = id === tab
            return (
              <Pressable
                key={id}
                onPress={() => setTab(id)}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected }}
                hitSlop={8}
              >
                <Text style={selected ? styles.tabSelected : styles.tab}>
                  {label}
                  {selected && <Text style={{ color: palette.coral[100] }}>·</Text>}
                </Text>
              </Pressable>
            )
          })}
        </View>
        {tab === 'people' && (
          <View style={styles.search}>
            <Icon name="search" color={palette.blue[100]} size={18} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar pessoa"
              accessibilityLabel="Buscar pessoa"
              placeholderTextColor={palette.blue[100]}
              returnKeyType="search"
              clearButtonMode="while-editing"
              autoCorrect={false}
              style={styles.searchInput}
            />
          </View>
        )}
      </GroupHeader>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={pulling} onRefresh={refresh} tintColor={colors.action} />
        }
      >
        {current.isPending ? (
          <ListSkeleton />
        ) : current.error && !current.data ? (
          <ErrorState message={current.error.message} onRetry={() => current.refetch()} />
        ) : tab === 'teams' ? (
          <TeamsList teams={teams.data ?? []} />
        ) : sections.length === 0 ? (
          <Text style={[textStyles.body, styles.empty, { color: colors.textMuted }]}>
            {`Ninguém encontrado para “${query.trim()}”.`}
          </Text>
        ) : (
          sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                {section.title}
              </Text>
              {section.members.map((member) => (
                <MemberRow key={member.userId} member={member} isMe={member.userId === myId} />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    minHeight: 40,
  },
  count: { flexShrink: 1, fontFamily: fonts.sans400, fontSize: 14, color: palette.blue[100] },
  add: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    opacity: 0.6,
  },
  addLabel: { fontFamily: fonts.sans700, fontSize: 14, color: palette.blue[700] },
  tabs: { flexDirection: 'row', alignItems: 'baseline', gap: 18 },
  tab: { fontFamily: fonts.sans500, fontSize: 22, color: palette.blue[100] },
  tabSelected: { fontFamily: fonts.sans700, fontSize: 28, color: '#FFFFFF' },
  search: {
    height: 44,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  searchInput: { flex: 1, fontFamily: fonts.sans400, fontSize: 15, color: '#FFFFFF', padding: 0 },
  list: { paddingTop: 14, paddingHorizontal: 20, gap: 14, paddingBottom: spacing.tabBarClearance },
  section: { gap: 8 },
  sectionTitle: { fontFamily: fonts.sans700, fontSize: 13, letterSpacing: 0.5 },
  empty: { paddingVertical: 24, textAlign: 'center' },
})
