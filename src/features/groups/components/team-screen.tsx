import { useRouter } from 'expo-router'
import { useState, type ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button, ErrorState, Icon, ListSkeleton, Notice, Sheet } from '@/shared/components/ui'
import { autoTone, type AutoTone } from '@/shared/domain/auto-tone'
import { firstName, initials } from '@/shared/domain/initials'
import { groupPermissions } from '@/shared/domain/permissions'
import { plural } from '@/shared/domain/plural'
import { ApiError } from '@/shared/lib/api-error'
import { fonts, palette, spacing, textStyles, useTheme } from '@/shared/theme'

import type { GroupMember, Team } from '../api'
import { useGroupById } from '../hooks/use-current-group'
import { useGroupMembers, useGroupTeams } from '../hooks/use-group-people'
import {
  canEditTeamMembers,
  useDeleteTeam,
  useRenameTeam,
  useTeamMembership,
} from '../hooks/use-team-writes'
import { teamPeople } from '../people-and-teams'
import { TeamNameSheet } from './team-name-sheet'

type Props = { groupId: number; teamId: number }

/** A refused write, as the screen says it: the API's message (a Viewer's 403 too). */
const messageOf = (error: unknown) =>
  error instanceof ApiError ? error.message : 'Não foi possível concluir. Tente de novo.'

/**
 * A Team of the Group (D-Team, PROJ-219): its header in the Team's automatic color, how many are
 * in it and who. To who manages Teams: "Renomear", adding people of the Group and taking them out
 * (where the repository can, PROJ-183), and "Apagar Team" after a confirmation. A Viewer sees the
 * same Team without those actions.
 */
export function TeamScreen({ groupId, teamId }: Props) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const teams = useGroupTeams(groupId)
  const team = teams.data?.find((t) => t.id === teamId)

  const back = (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      style={styles.back}
    >
      <Icon name="back" color="#FFFFFF" size={20} />
    </Pressable>
  )

  if (team) return <Details groupId={groupId} team={team} back={back} />

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundImage: `linear-gradient(160deg, ${palette.blue[900]}, ${palette.blue[500]})`,
          },
        ]}
      >
        {back}
      </View>
      <View style={styles.padded}>
        {teams.isPending ? (
          <ListSkeleton />
        ) : teams.error && !teams.data ? (
          <ErrorState message={teams.error.message} onRetry={() => teams.refetch()} />
        ) : (
          <Text style={[textStyles.body, styles.empty, { color: colors.textMuted }]}>
            Este Team não existe mais.
          </Text>
        )}
      </View>
    </View>
  )
}

function Details({ groupId, team, back }: { groupId: number; team: Team; back: ReactNode }) {
  const { colors, cover } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const group = useGroupById(groupId)
  const members = useGroupMembers(groupId)
  const rename = useRenameTeam(groupId, team.id)
  const remove = useDeleteTeam(groupId, team.id)
  const membership = useTeamMembership(groupId, team.id)
  const [sheet, setSheet] = useState<'rename' | 'add' | 'delete' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const managesTeams = group ? groupPermissions(group.role).managesTeams : false
  const editsMembers = managesTeams && canEditTeamMembers()
  const { inTeam, outside } = teamPeople(members.data ?? [], team)
  const tone = autoTone(team.id)
  const [from, to] = cover(tone)
  const close = () => setSheet(null)

  const changeMembership = (change: 'add' | 'remove', userId: number) => {
    setError(null)
    membership[change].mutate(userId, { onError: (failure) => setError(messageOf(failure)) })
  }

  const confirmDelete = async () => {
    setError(null)
    try {
      await remove.mutateAsync()
      close()
      router.back()
    } catch (failure) {
      close()
      setError(messageOf(failure))
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundImage: `linear-gradient(160deg, ${from}, ${to})`,
          },
        ]}
      >
        <View style={styles.topRow}>
          {back}
          {managesTeams && (
            <Pressable
              onPress={() => setSheet('rename')}
              accessibilityRole="button"
              accessibilityLabel="Renomear"
              style={styles.rename}
            >
              <Text style={styles.renameLabel}>Renomear</Text>
            </Pressable>
          )}
        </View>
        <Text style={[styles.overline, { color: palette[tone][100] }]}>
          Team · {group?.name ?? ''}
        </Text>
        <Text accessibilityRole="header" accessibilityLabel={team.name} style={styles.title}>
          {team.name}
          <Text style={{ color: palette.coral[100] }}>·</Text>
        </Text>
        {members.data && (
          <Text style={[styles.count, { color: palette[tone][100] }]}>
            {plural(inTeam.length, 'pessoa', 'pessoas')}
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.body,
          { paddingBottom: Math.max(insets.bottom, 16) + (managesTeams ? 120 : 16) },
        ]}
      >
        {error && <Notice message={error} />}
        {editsMembers && (
          <Pressable
            onPress={() => setSheet('add')}
            accessibilityRole="button"
            accessibilityLabel="+ Adicionar pessoas do Group"
            style={[
              styles.addPeople,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.addPeopleLabel, { color: colors.link }]}>
              + Adicionar pessoas do Group
            </Text>
          </Pressable>
        )}
        {members.isPending ? (
          <ListSkeleton />
        ) : members.error && !members.data ? (
          <ErrorState message={members.error.message} onRetry={() => members.refetch()} />
        ) : inTeam.length === 0 ? (
          <Text style={[textStyles.body, styles.empty, { color: colors.textMuted }]}>
            Ninguém neste Team ainda.
          </Text>
        ) : (
          <View
            accessibilityLabel="Pessoas do Team"
            style={[styles.card, { backgroundColor: colors.surface }]}
          >
            {inTeam.map((member, index) => (
              <View
                key={member.userId}
                style={[
                  styles.row,
                  index > 0 && { borderTopWidth: 1, borderTopColor: colors.divider },
                ]}
              >
                <TeamAvatar tone={tone} name={member.name} />
                <Text style={[styles.name, { color: colors.text }]}>{member.name}</Text>
                {editsMembers && (
                  <Pressable
                    onPress={() => changeMembership('remove', member.userId)}
                    disabled={membership.remove.isPending}
                    accessibilityRole="button"
                    accessibilityLabel={`Tirar ${firstName(member.name)} do Team`}
                    style={[styles.removeOne, { backgroundColor: colors.bg }]}
                  >
                    <Icon name="close" color={colors.textMuted} size={16} strokeWidth={2.2} />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {managesTeams && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
          <Button label="Apagar Team" variant="danger" onPress={() => setSheet('delete')} />
          <Text style={[textStyles.caption, styles.footnote, { color: colors.textMuted }]}>
            Os Events e itens já montados não mudam.
          </Text>
        </View>
      )}

      <TeamNameSheet
        visible={sheet === 'rename'}
        title="Renomear Team"
        initialName={team.name}
        submitLabel="Salvar"
        onSubmit={async (name) => {
          await rename.mutateAsync(name)
          close()
        }}
        onClose={close}
      />

      <Sheet visible={sheet === 'add'} title="Adicionar ao Team" onClose={close}>
        <AddPeople
          tone={tone}
          people={outside}
          adding={membership.add.isPending}
          onAdd={(userId) => changeMembership('add', userId)}
        />
        {error && <Notice message={error} />}
        <Button label="Concluir" variant="secondary" onPress={close} />
      </Sheet>

      <Sheet visible={sheet === 'delete'} title={`Apagar o Team ${team.name}?`} onClose={close}>
        <Text style={[textStyles.body, { color: colors.textMuted }]}>
          As pessoas continuam no {group?.name ?? 'Group'}. Os Events e itens já montados não mudam.
        </Text>
        <Button
          label="Apagar"
          variant="danger"
          loading={remove.isPending}
          onPress={confirmDelete}
        />
        <Button label="Cancelar" variant="link" onPress={close} />
      </Sheet>
    </View>
  )
}

/** The Group members not in the Team yet: tapping one puts them in it. */
function AddPeople({
  tone,
  people,
  adding,
  onAdd,
}: {
  tone: AutoTone
  people: GroupMember[]
  adding: boolean
  onAdd: (userId: number) => void
}) {
  const { colors } = useTheme()
  if (people.length === 0) {
    return (
      <Text style={[textStyles.body, { color: colors.textMuted }]}>
        Todas as pessoas do Group já estão neste Team.
      </Text>
    )
  }
  return (
    <ScrollView style={styles.addList}>
      {people.map((person) => (
        <Pressable
          key={person.userId}
          onPress={() => onAdd(person.userId)}
          disabled={adding}
          accessibilityRole="button"
          accessibilityLabel={`Adicionar ${person.name}`}
          style={styles.row}
        >
          <TeamAvatar tone={tone} name={person.name} />
          <Text style={[styles.name, { color: colors.text }]}>{person.name}</Text>
          <Icon name="plus" color={colors.link} size={20} />
        </Pressable>
      ))}
    </ScrollView>
  )
}

/** Initials on the Team's chip colors (100 and 700 in light mode). */
function TeamAvatar({ tone, name }: { tone: AutoTone; name: string }) {
  const { teamChip } = useTheme()
  const chip = teamChip(tone)
  return (
    <View style={[styles.avatar, { backgroundColor: chip.bg }]}>
      <Text style={[styles.initials, { color: chip.text }]}>{initials(name)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 20,
    paddingBottom: 22,
    gap: 10,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    borderRadius: spacing.touchTarget / 2,
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rename: {
    height: spacing.touchTarget,
    paddingHorizontal: 14,
    borderRadius: spacing.touchTarget / 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
  },
  renameLabel: { fontFamily: fonts.sans600, fontSize: 14, color: '#FFFFFF' },
  overline: { fontFamily: fonts.sans400, fontSize: 13 },
  title: { fontFamily: fonts.sans700, fontSize: 32, color: '#FFFFFF' },
  count: { fontFamily: fonts.sans400, fontSize: 14 },
  padded: { paddingTop: 18, paddingHorizontal: 20 },
  body: { paddingTop: 16, paddingHorizontal: 20, gap: 10 },
  addPeople: {
    height: 50,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPeopleLabel: { fontFamily: fonts.sans600, fontSize: 15 },
  card: { borderRadius: 20, paddingVertical: 4, paddingHorizontal: 14 },
  row: { paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontFamily: fonts.sans700, fontSize: 13 },
  name: { flex: 1, fontFamily: fonts.sans600, fontSize: 16 },
  removeOne: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    borderRadius: spacing.touchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addList: { maxHeight: 360 },
  empty: { paddingVertical: 24, textAlign: 'center' },
  footer: { position: 'absolute', left: 20, right: 20, bottom: 0, gap: 6 },
  footnote: { textAlign: 'center' },
})
