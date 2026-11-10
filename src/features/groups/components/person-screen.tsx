import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  Badge,
  Button,
  ErrorState,
  Icon,
  ListSkeleton,
  Notice,
  Sheet,
} from '@/shared/components/ui'
import { autoTone } from '@/shared/domain/auto-tone'
import { firstName as firstNameOf, initials } from '@/shared/domain/initials'
import { groupPermissions } from '@/shared/domain/permissions'
import { formatPhone } from '@/shared/domain/phone'
import { ApiError } from '@/shared/lib/api-error'
import { useSession } from '@/shared/session'
import { fonts, palette, spacing, textStyles, useTheme } from '@/shared/theme'

import type { ActivationLink } from '../api'
import { useGroupById } from '../hooks/use-current-group'
import { useGroupMembers, useGroupTeams } from '../hooks/use-group-people'
import { useReissueActivationLink, useRemoveViewer } from '../hooks/use-people-writes'
import { joinPeopleAndTeams, type Person } from '../people-and-teams'
import { ActivationLinkCard } from './activation-link-card'

type Props = { groupId: number; userId: number }

/** A refused write, as the screen says it: the API's message (a Viewer's 403 too). */
const messageOf = (error: unknown) =>
  error instanceof ApiError ? error.message : 'Não foi possível concluir. Tente de novo.'

/**
 * A person of the Group (D-Pessoa, PROJ-218): who they are, their Teams and, to who manages people,
 * "Gerar novo link" while the invitation is pending and "Remover do Group" for a Viewer (with a
 * confirmation). A Viewer sees the same person without those actions.
 */
export function PersonScreen({ groupId, userId }: Props) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const members = useGroupMembers(groupId)
  const teams = useGroupTeams(groupId)
  const person = joinPeopleAndTeams(members.data ?? [], teams.data ?? []).people.find(
    (p) => p.userId === userId,
  )

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
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={styles.back}
        >
          <Icon name="back" color="#FFFFFF" size={20} />
        </Pressable>
      </View>
      {members.isPending ? (
        <View style={styles.padded}>
          <ListSkeleton />
        </View>
      ) : members.error && !members.data ? (
        <View style={styles.padded}>
          <ErrorState message={members.error.message} onRetry={() => members.refetch()} />
        </View>
      ) : person ? (
        <Details groupId={groupId} person={person} />
      ) : (
        <Text style={[textStyles.body, styles.gone, { color: colors.textMuted }]}>
          Esta pessoa não está mais no Group.
        </Text>
      )}
    </View>
  )
}

function Details({ groupId, person }: { groupId: number; person: Person }) {
  const { colors, badge, teamChip } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const group = useGroupById(groupId)
  const myId = useSession((state) => state.session?.user.id)
  const reissue = useReissueActivationLink(groupId)
  const remove = useRemoveViewer(groupId)
  const [link, setLink] = useState<ActivationLink | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const { name, email, phone, role, isPending, teams, userId } = person
  const managesPeople = group ? groupPermissions(group.role).managesPeople : false
  // The API takes out only Viewers here; an Owner leaves by the Super admin's Owner routes.
  const removable = managesPeople && role === 'VIEWER' && userId !== myId
  const gold = badge('gold')
  const firstName = firstNameOf(name)

  const generate = () => reissue.mutate(userId, { onSuccess: setLink })

  const confirmRemove = async () => {
    setRemoveError(null)
    try {
      await remove.mutateAsync(userId)
      setConfirming(false)
      router.back()
    } catch (error) {
      setConfirming(false)
      setRemoveError(messageOf(error))
    }
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: Math.max(insets.bottom, 16) + 96 }]}
      >
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: palette.gray[100] },
              isPending && [styles.pendingAvatar, { borderColor: colors.border }],
            ]}
          >
            <Text style={[styles.initials, { color: palette.gray[700] }]}>{initials(name)}</Text>
          </View>
          <Text accessibilityRole="header" style={[styles.name, { color: colors.text }]}>
            {name}
          </Text>
          <View style={styles.badges}>
            <Badge
              label={role === 'OWNER' ? 'Owner' : 'Viewer'}
              tone={role === 'OWNER' ? 'blue' : 'gray'}
            />
            {isPending && <Badge label="Convite pendente" tone="gold" />}
          </View>
          <Text style={[textStyles.caption, styles.contact, { color: colors.textMuted }]}>
            {[email, phone && formatPhone(phone)].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {removeError && <Notice message={removeError} />}

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Teams</Text>
          {teams.length === 0 ? (
            <Text style={[textStyles.caption, { color: colors.textMuted }]}>Em nenhum Team.</Text>
          ) : (
            <View style={styles.chips}>
              {teams.map((team) => {
                const chip = teamChip(autoTone(team.id))
                return (
                  <Text
                    key={team.id}
                    style={[styles.chip, { backgroundColor: chip.bg, color: chip.text }]}
                  >
                    {team.name}
                  </Text>
                )
              })}
            </View>
          )}
        </View>

        {managesPeople && isPending && (
          <>
            {link ? (
              <ActivationLinkCard
                link={link}
                name={name}
                phone={phone}
                groupName={group?.name ?? ''}
                note="Link novo gerado: o anterior não vale mais."
              />
            ) : (
              <View style={[styles.section, { backgroundColor: gold.bg }]}>
                <Text style={[styles.sectionTitle, { color: gold.text }]}>Ainda não entrou</Text>
                <Text style={[styles.pendingText, { color: gold.text }]}>
                  Um link novo desativa o anterior e chega por e-mail para {firstName}.
                </Text>
                <Button label="Gerar novo link" loading={reissue.isPending} onPress={generate} />
              </View>
            )}
            {reissue.error ? <Notice message={messageOf(reissue.error)} /> : null}
          </>
        )}
      </ScrollView>

      {removable && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
          <Button label="Remover do Group" variant="danger" onPress={() => setConfirming(true)} />
        </View>
      )}

      <Sheet
        visible={confirming}
        title={`Remover ${firstName} do Group?`}
        onClose={() => setConfirming(false)}
      >
        <Text style={[textStyles.body, { color: colors.textMuted }]}>
          {firstName} deixa de ver o {group?.name ?? 'Group'} e sai dos Teams.
          {isPending ? ' O convite pendente deixa de valer.' : ''}
        </Text>
        <Button
          label="Remover"
          variant="danger"
          loading={remove.isPending}
          onPress={confirmRemove}
        />
        <Button label="Cancelar" variant="link" onPress={() => setConfirming(false)} />
      </Sheet>
    </>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    height: 200,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  back: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    borderRadius: spacing.touchTarget / 2,
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  padded: { paddingTop: 18, paddingHorizontal: 20 },
  gone: { paddingVertical: 24, textAlign: 'center' },
  body: { marginTop: -90, paddingHorizontal: 16, gap: 12 },
  card: {
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 18px 32px -18px rgba(16,32,74,0.45)',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingAvatar: { borderWidth: 2.5, borderStyle: 'dashed' },
  initials: { fontFamily: fonts.sans700, fontSize: 24 },
  name: { fontFamily: fonts.sans700, fontSize: 22 },
  badges: { flexDirection: 'row', gap: 6 },
  contact: { textAlign: 'center' },
  section: { borderRadius: 20, padding: 14, gap: 10 },
  sectionTitle: { fontFamily: fonts.sans700, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    fontFamily: fonts.sans600,
    fontSize: 13,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  pendingText: { fontFamily: fonts.sans400, fontSize: 13, lineHeight: 19 },
  footer: { position: 'absolute', left: 20, right: 20, bottom: 0 },
})
