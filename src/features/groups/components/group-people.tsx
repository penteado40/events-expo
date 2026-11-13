import { useRouter, type Href } from 'expo-router'
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
import { groupPermissions, type GroupPermissions } from '@/shared/domain/permissions'
import { plural } from '@/shared/domain/plural'
import { useSession } from '@/shared/session'
import { fonts, palette, spacing, textStyles, useTheme } from '@/shared/theme'

import type { CurrentGroup } from '../current-group'
import { useGroupMembers, useGroupTeams } from '../hooks/use-group-people'
import { joinPeopleAndTeams } from '../people-and-teams'
import { peopleSections } from '../people-sections'
import { MemberRow } from './member-row'
import { TeamsList } from './teams-list'

type Tab = 'people' | 'teams'

const TABS: {
  tab: Tab
  label: string
  /** The header's count: "5 pessoas", "4 Teams". */
  count: (n: number) => string
  add: string
  permission: keyof GroupPermissions
  /** Where "+" goes; none yet for Teams (PROJ-219). */
  addRoute?: (groupId: number) => Href
}[] = [
  {
    tab: 'people',
    label: 'Pessoas',
    count: (n) => plural(n, 'pessoa', 'pessoas'),
    add: '+ Pessoa',
    permission: 'managesPeople',
    addRoute: (groupId) => `/groups/${groupId}/people/add`,
  },
  {
    tab: 'teams',
    label: 'Teams',
    count: (n) => plural(n, 'Team', 'Teams'),
    add: '+ Team',
    permission: 'managesTeams',
  },
]

type Props = {
  group: CurrentGroup
  /** Pulling down also refreshes what is around the list: the Groups and the User's role. */
  onRefresh?: () => Promise<unknown>
}

/**
 * The Group's people and Teams (D-Pessoas, D-Teams, PROJ-216). "+ Pessoa" and "+ Team" show only
 * to who manages them: "+ Pessoa" adds a Viewer (PROJ-218); "+ Team" comes with PROJ-219. A person
 * opens their page.
 */
export function GroupPeople({ group, onRefresh }: Props) {
  const { colors } = useTheme()
  const router = useRouter()
  const myId = useSession((state) => state.session?.user.id)
  const [tab, setTab] = useState<Tab>('people')
  const [query, setQuery] = useState('')
  const [pulling, setPulling] = useState(false)
  const members = useGroupMembers(group.id)
  const teams = useGroupTeams(group.id)
  const permissions = groupPermissions(group.role)

  const shown = TABS.find((t) => t.tab === tab)!
  const shownQuery = tab === 'people' ? members : teams
  const countLabel = shownQuery.data && shown.count(shownQuery.data.length)
  const canAdd = permissions[shown.permission]
  const addRoute = shown.addRoute?.(group.id)
  // The Pessoas tab does not wait for the Teams: people show first, their Teams once they come.
  const joined = joinPeopleAndTeams(members.data ?? [], teams.data ?? [])
  const sections = peopleSections(joined.people, query)

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
          <Text style={styles.groupLine}>
            {countLabel ? `${group.name} · ${countLabel}` : group.name}
          </Text>
          {canAdd && (
            <Pressable
              disabled={!addRoute}
              onPress={() => addRoute && router.push(addRoute)}
              accessibilityRole="button"
              accessibilityLabel={shown.add}
              accessibilityState={{ disabled: !addRoute }}
              style={[styles.add, !addRoute && styles.addOff]}
            >
              <Text style={styles.addLabel}>{shown.add}</Text>
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
        {shownQuery.isPending ? (
          <ListSkeleton />
        ) : shownQuery.error && !shownQuery.data ? (
          <ErrorState message={shownQuery.error.message} onRetry={() => shownQuery.refetch()} />
        ) : tab === 'teams' ? (
          <TeamsList teams={joined.teams} />
        ) : sections.length === 0 ? (
          <Text style={[textStyles.body, styles.empty, { color: colors.textMuted }]}>
            {query.trim()
              ? `Ninguém encontrado para “${query.trim()}”.`
              : 'Ninguém neste Group ainda.'}
          </Text>
        ) : (
          sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                {section.title}
              </Text>
              {section.members.map((member) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  isMe={member.userId === myId}
                  onPress={() => router.push(`/groups/${group.id}/people/${member.userId}`)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    minHeight: 40,
  },
  groupLine: { flexShrink: 1, fontFamily: fonts.sans400, fontSize: 14, color: palette.blue[100] },
  add: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  addOff: { opacity: 0.6 },
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
