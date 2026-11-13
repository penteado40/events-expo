import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button, Icon, Notice, TextField } from '@/shared/components/ui'
import { autoTone } from '@/shared/domain/auto-tone'
import { firstName as firstNameOf } from '@/shared/domain/initials'
import { groupPermissions } from '@/shared/domain/permissions'
import { fonts, palette, spacing, textStyles, useTheme } from '@/shared/theme'

import { useGroupById } from '../hooks/use-current-group'
import { useGroupTeams } from '../hooks/use-group-people'
import { canAddTeamMembers, useAddViewer, type AddViewerResult } from '../hooks/use-people-writes'
import {
  checkViewerForm,
  viewerErrorsFromApi,
  type ViewerErrors,
  type ViewerForm,
} from '../viewer-form'
import { ActivationLinkCard } from './activation-link-card'

type Props = { groupId: number }

/**
 * "Adicionar pessoa" (D-AddPessoa, PROJ-218): name, email, phone and optional Teams; the person
 * comes in as a Viewer. Then "está no Group" (D-Convite): with the Activation link to pass on when
 * the email had no account, or only the confirmation when it had.
 */
export function AddPersonScreen({ groupId }: Props) {
  const [added, setAdded] = useState<{ result: AddViewerResult; phone: string } | null>(null)
  const group = useGroupById(groupId)
  const groupName = group?.name ?? ''
  if (added) return <Added groupName={groupName} {...added} />
  // Opened by a deep link, a Viewer meets the refusal, not a form the API would refuse.
  if (group && !groupPermissions(group.role).managesPeople) return <NotAllowed />
  return <AddForm groupId={groupId} onAdded={setAdded} />
}

function AddForm({
  groupId,
  onAdded,
}: Props & { onAdded: (added: { result: AddViewerResult; phone: string }) => void }) {
  const { colors, teamChip } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const group = useGroupById(groupId)
  const groupName = group?.name ?? ''
  const teams = useGroupTeams(groupId)
  const add = useAddViewer(groupId)
  const [form, setForm] = useState<ViewerForm>({ name: '', email: '', phone: '' })
  const [teamIds, setTeamIds] = useState<number[]>([])
  const [errors, setErrors] = useState<ViewerErrors>({})
  // Putting someone in a Team is a Team write: only who manages Teams picks them, and only where
  // the repository can do it (not over the events-api until PROJ-183).
  const picksTeams =
    canAddTeamMembers() && (group ? groupPermissions(group.role).managesTeams : false)

  const edit = (field: keyof ViewerForm) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }))
  }

  const toggleTeam = (id: number) =>
    setTeamIds((current) =>
      current.includes(id) ? current.filter((t) => t !== id) : [...current, id],
    )

  const submit = () => {
    const checked = checkViewerForm(form)
    setErrors(checked.errors)
    if (!checked.viewer) return
    const { phone } = checked.viewer
    add.mutate(
      { viewer: checked.viewer, teamIds },
      {
        onSuccess: (result) => onAdded({ result, phone }),
        onError: (error) => setErrors(viewerErrorsFromApi(error)),
      },
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: colors.bg }]}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.body, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.bar}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Cancelar"
            style={styles.cancel}
          >
            <Text style={[styles.cancelLabel, { color: colors.textMuted }]}>Cancelar</Text>
          </Pressable>
          <Text style={[textStyles.caption, { color: colors.textMuted }]}>{groupName}</Text>
        </View>
        <Text accessibilityRole="header" style={[textStyles.display, { color: colors.text }]}>
          Adicionar pessoa<Text style={{ color: palette.coral[500] }}>·</Text>
        </Text>
        <Text style={[textStyles.body, styles.lead, { color: colors.textMuted }]}>
          Ela entra como Viewer e recebe um convite por e-mail.
        </Text>

        <View style={styles.fields}>
          <TextField
            label="Nome"
            value={form.name}
            onChangeText={edit('name')}
            error={errors.name}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
          />
          <TextField
            label="E-mail · é com ele que a pessoa entra"
            value={form.email}
            onChangeText={edit('email')}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
          />
          <TextField
            label="Telefone com DDI"
            value={form.phone}
            onChangeText={edit('phone')}
            error={errors.phone}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
          />
        </View>

        {picksTeams && teams.data && teams.data.length > 0 && (
          <View style={styles.teams}>
            <Text style={[styles.teamsTitle, { color: colors.text }]}>
              Teams <Text style={[styles.optional, { color: colors.textMuted }]}>· opcional</Text>
            </Text>
            <View style={styles.chips}>
              {teams.data.map((team) => {
                const selected = teamIds.includes(team.id)
                const tone = autoTone(team.id)
                const chip = teamChip(tone)
                return (
                  <Pressable
                    key={team.id}
                    onPress={() => toggleTeam(team.id)}
                    accessibilityRole="checkbox"
                    accessibilityLabel={team.name}
                    accessibilityState={{ checked: selected }}
                    style={[
                      styles.chip,
                      { backgroundColor: selected ? palette[tone][500] : chip.bg },
                    ]}
                  >
                    {selected && <Icon name="check" color="#FFFFFF" size={16} strokeWidth={2.4} />}
                    <Text
                      style={[
                        styles.chipLabel,
                        selected && styles.chipSelected,
                        { color: selected ? '#FFFFFF' : chip.text },
                      ]}
                    >
                      {team.name}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        )}

        <View style={[styles.info, { backgroundColor: colors.surfaceBrand }]}>
          <Text style={[styles.infoText, { color: colors.text }]}>
            Se o e-mail já tem conta, a pessoa só é avisada de que entrou no {groupName}. Os Events
            já criados não a incluem sozinhos.
          </Text>
        </View>
        {errors.form && <Notice message={errors.form} />}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        <Button label="Adicionar e convidar" loading={add.isPending} onPress={submit} />
      </View>
    </KeyboardAvoidingView>
  )
}

function Added({
  result,
  phone,
  groupName,
}: {
  result: AddViewerResult
  phone: string
  groupName: string
}) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const firstName = firstNameOf(result.name)

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.addedBody}>
        <View
          style={[
            styles.hero,
            {
              paddingTop: insets.top + 56,
              backgroundImage: `linear-gradient(160deg, ${palette.green[900]}, ${palette.green[500]})`,
            },
          ]}
        >
          <View style={styles.tick}>
            <Icon name="check" color={palette.green[700]} size={36} strokeWidth={2.4} />
          </View>
          <Text accessibilityRole="header" style={styles.heroTitle}>
            {firstName} está no Group
          </Text>
          <Text style={[styles.heroLine, { color: palette.green[100] }]}>
            {addedLine(result, firstName)}
          </Text>
        </View>
        <View style={styles.afterHero}>
          {result.activationLink && (
            <ActivationLinkCard
              link={result.activationLink}
              name={result.name}
              phone={phone}
              groupName={groupName}
            />
          )}
          {result.teamsFailed && (
            <Notice message="Não foi possível pôr a pessoa nos Teams escolhidos. Ela já está no Group." />
          )}
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        <Button label="Concluir" variant="link" onPress={() => router.back()} />
      </View>
    </View>
  )
}

/** A Viewer here (only by a deep link, "+ Pessoa" is hidden): the refusal and the way back. */
function NotAllowed() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg, paddingTop: insets.top + 24 }]}>
      <View style={styles.body}>
        <Notice message="Você não pode adicionar pessoas neste Group." />
      </View>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        <Button label="Voltar" variant="link" onPress={() => router.back()} />
      </View>
    </View>
  )
}

/**
 * Who was told what: a new email got the invitation (and the link is below); a Pending user who
 * already had a link got only the Group access email; an active User, only the notice.
 */
function addedLine({ activationLink, isPending, email }: AddViewerResult, firstName: string) {
  if (activationLink) return `O convite foi para ${email}`
  if (isPending) {
    return `${firstName} ainda não ativou a conta: o aviso foi por e-mail. Se não chegar, gere um novo link na página da pessoa.`
  }
  return `${email} já tem conta: o aviso de que entrou vai por e-mail.`
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 20, gap: 16, paddingBottom: 24 },
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancel: { minWidth: 72, height: spacing.touchTarget, justifyContent: 'center' },
  cancelLabel: { fontFamily: fonts.sans400, fontSize: 15 },
  lead: { marginTop: -8 },
  fields: { gap: 12 },
  teams: { gap: 8 },
  teamsTitle: { fontFamily: fonts.sans700, fontSize: 15 },
  optional: { fontFamily: fonts.sans400 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipLabel: { fontFamily: fonts.sans600, fontSize: 14 },
  chipSelected: { fontFamily: fonts.sans700 },
  info: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
  infoText: { fontFamily: fonts.sans400, fontSize: 13, lineHeight: 19 },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
  addedBody: { paddingBottom: 24 },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 72,
    alignItems: 'center',
    gap: 12,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  tick: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontFamily: fonts.sans700, fontSize: 28, color: '#FFFFFF', textAlign: 'center' },
  heroLine: { fontFamily: fonts.sans400, fontSize: 15, textAlign: 'center' },
  afterHero: { marginTop: -50, paddingHorizontal: 16, gap: 14 },
})
