import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ErrorState, Icon, ListSkeleton, Notice } from '@/shared/components/ui'
import { autoTone } from '@/shared/domain/auto-tone'
import { canEditEvent, roleIn } from '@/shared/domain/group-role'
import { initials } from '@/shared/domain/initials'
import { errorMessage } from '@/shared/lib/api-error'
import { useSession } from '@/shared/session'
import { fonts, palette, spacing, textStyles, useTheme } from '@/shared/theme'

import type { Event } from '../api'
import { useEvent } from '../hooks/use-event'
import {
  participantsAvailable,
  useGroupMembers,
  useGroupTeams,
  useParticipants,
  useParticipantWrites,
} from '../hooks/use-participants'
import { participantsList, type ParticipantRow, type TeamShortcut } from '../participants-list'
import { CheckRow } from './check-row'
import { TeamChip } from './team-chip'

/**
 * "Quem vai" (D-Participants, PROJ-222): an Event's Participants, for any Group member. Who edits
 * the Event (an Owner, the Super admin; not while it is Cancelled) sees the whole Group and marks
 * or unmarks each person, or a whole Team at once, warned of what leaving means. Everyone else
 * sees who goes.
 */
export function ParticipantsScreen({ eventId }: { eventId: number }) {
  const { colors } = useTheme()
  const event = useEvent(eventId)

  if (event.data && participantsAvailable()) return <Participants event={event.data} />
  return (
    <View style={[styles.screen, styles.padded, { backgroundColor: colors.bg }]}>
      {event.data ? (
        <Notice message="Os Participants ainda não estão disponíveis aqui." alert={false} />
      ) : event.error ? (
        <ErrorState message={event.error.message} onRetry={() => event.refetch()} />
      ) : (
        <ListSkeleton />
      )}
    </View>
  )
}

function Participants({ event }: { event: Event }) {
  const { colors, cover } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const user = useSession((state) => state.session?.user)
  const editable = !!user && canEditEvent(roleIn(user, event.groupId), event)
  const participants = useParticipants(event.id)
  const members = useGroupMembers(event.groupId)
  const teams = useGroupTeams(event.groupId)
  const writes = useParticipantWrites(event.groupId, event.id)
  const [error, setError] = useState<string | null>(null)
  const tone = autoTone(event.id)
  const [from, to] = cover(tone)
  const writing = writes.add.isPending || writes.remove.isPending

  const list =
    participants.data && members.data && teams.data
      ? participantsList(members.data, teams.data, participants.data, { editable })
      : null
  const failed = participants.error ?? members.error ?? teams.error
  const retry = () => {
    void participants.refetch()
    void members.refetch()
    void teams.refetch()
  }

  const onError = (failure: unknown) => setError(errorMessage(failure))
  const toggle = (row: ParticipantRow) => {
    setError(null)
    if (row.going) writes.remove.mutate(row.userId, { onError })
    else writes.add.mutate([row.userId], { onError })
  }
  const markTeam = (shortcut: TeamShortcut) => {
    setError(null)
    writes.add.mutate(shortcut.missing, { onError })
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }}>
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
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              style={styles.back}
            >
              <Icon name="back" color="#FFFFFF" size={20} strokeWidth={2} />
            </Pressable>
            <Text numberOfLines={1} style={[styles.eventName, { color: palette[tone][100] }]}>
              {event.name}
            </Text>
          </View>
          <View style={styles.titleRow}>
            <Text accessibilityRole="header" accessibilityLabel="Quem vai" style={styles.title}>
              Quem vai<Text style={{ color: palette.coral[100] }}>·</Text>
            </Text>
            {list && (
              <Text style={styles.count}>
                {list.count.going} de {list.count.group}
              </Text>
            )}
          </View>
          {editable && list && list.shortcuts.length > 0 && (
            <View style={styles.shortcuts}>
              <Text style={[styles.shortcutsLabel, { color: palette[tone][100] }]}>
                Marcar Team:
              </Text>
              {list.shortcuts.map((shortcut) => (
                <TeamChip
                  key={shortcut.id}
                  teamId={shortcut.id}
                  label={shortcut.name}
                  kind="button"
                  // Once all of its people go, a check and nothing to do.
                  checked={shortcut.missing.length === 0}
                  accessibilityLabel={
                    shortcut.missing.length === 0
                      ? `${shortcut.name}, todos vão`
                      : `Marcar Team ${shortcut.name}`
                  }
                  disabled={shortcut.missing.length === 0 || writing}
                  onPress={() => markTeam(shortcut)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.body}>
          {error && <Notice message={error} />}
          {failed && !list ? (
            <ErrorState message={failed.message} onRetry={retry} />
          ) : !list ? (
            <ListSkeleton />
          ) : (
            <>
              {editable && (
                <Text style={[textStyles.caption, { color: colors.textMuted }]}>
                  A lista nasceu copiada do Group ou dos Teams. Marque quem vai e desmarque quem não
                  vai.
                </Text>
              )}
              {list.rows.length === 0 ? (
                <Text style={[textStyles.body, styles.empty, { color: colors.textMuted }]}>
                  Ninguém vai a este Event ainda.
                </Text>
              ) : (
                <View
                  accessibilityLabel="Participants"
                  style={[styles.card, { backgroundColor: colors.surface }]}
                >
                  {list.rows.map((row, index) => (
                    <PersonRow
                      key={row.userId}
                      row={row}
                      first={index === 0}
                      editable={editable}
                      disabled={writing}
                      onPress={() => toggle(row)}
                    />
                  ))}
                </View>
              )}
              {editable && (
                <Text style={[textStyles.caption, styles.footnote, { color: colors.textMuted }]}>
                  Quem sai deixa de ver os itens; nos Fields de pessoas fica marcado como fora do
                  Event.
                </Text>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

/** A person: the avatar ringed in their first Team's color, name and detail; a box to mark. */
function PersonRow({
  row,
  first,
  editable,
  disabled,
  onPress,
}: {
  row: ParticipantRow
  first: boolean
  editable: boolean
  disabled: boolean
  onPress: () => void
}) {
  const { colors } = useTheme()
  const ring = row.firstTeamId === null ? null : palette[autoTone(row.firstTeamId)][500]
  const content = (
    <>
      <View
        style={[
          styles.avatar,
          { backgroundColor: palette.gray[100] },
          ring && { boxShadow: `0 0 0 2.5px ${ring}` },
        ]}
      >
        <Text style={[styles.initials, { color: palette.gray[900] }]}>{initials(row.name)}</Text>
      </View>
      <View style={styles.names}>
        <Text style={[styles.name, { color: colors.text }]}>{row.name}</Text>
        {row.detail !== '' && (
          <Text style={[textStyles.caption, { color: colors.textMuted }]}>{row.detail}</Text>
        )}
      </View>
    </>
  )
  if (!editable) {
    return (
      <View style={[styles.row, !first && { borderTopWidth: 1, borderTopColor: colors.divider }]}>
        {content}
      </View>
    )
  }
  return (
    <CheckRow
      label={row.name}
      checked={row.going}
      disabled={disabled}
      first={first}
      onPress={onPress}
      style={[styles.row, !row.going && styles.notGoing]}
    >
      {content}
    </CheckRow>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  padded: { padding: 20, paddingTop: 80 },
  header: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  back: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    borderRadius: spacing.touchTarget / 2,
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventName: { flexShrink: 1, fontFamily: fonts.sans400, fontSize: 14 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { fontFamily: fonts.sans700, fontSize: 28, color: '#FFFFFF' },
  count: { fontFamily: fonts.sans600, fontSize: 16, color: '#FFFFFF' },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  shortcutsLabel: { fontFamily: fonts.sans400, fontSize: 13 },
  body: { paddingTop: 14, paddingHorizontal: 20, gap: 8 },
  card: { borderRadius: 20, paddingVertical: 4, paddingHorizontal: 14 },
  row: { minHeight: 60, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  notGoing: { opacity: 0.55 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontFamily: fonts.sans700, fontSize: 13 },
  names: { flex: 1 },
  name: { fontFamily: fonts.sans600, fontSize: 15 },
  empty: { paddingVertical: 24, textAlign: 'center' },
  footnote: { textAlign: 'center' },
})
