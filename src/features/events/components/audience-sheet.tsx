import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { Button, Icon, Sheet } from '@/shared/components/ui'
import { autoTone } from '@/shared/domain/auto-tone'
import { initials } from '@/shared/domain/initials'
import { plural } from '@/shared/domain/plural'
import { fonts, spacing, textStyles, useTheme } from '@/shared/theme'

import type { Team } from '../api'
import {
  audienceReach,
  setAudienceKind,
  teamCopied,
  teamParticipants,
  togglePerson,
  toggleTeam,
  type AudienceDraft,
  type FieldDraft,
  type PersonChoice,
} from '../item-draft'
import { ChoiceOption } from './choice-option'

type Props = {
  visible: boolean
  /** The item's name, above the title ("Ensaio no hotel"). */
  itemName: string
  audience: AudienceDraft
  /** The item's Fields as edited: whoever is in a Field of people counts too. */
  fields: readonly FieldDraft[]
  participants: readonly PersonChoice[]
  teams: readonly Team[]
  onApply: (audience: AudienceDraft) => void
  onClose: () => void
}

/** "Quem vê" (D-QuemVe, PROJ-233), its choice kept only while open: nothing changes until "Aplicar". */
export function AudienceSheet(props: Props) {
  return (
    <Sheet visible={props.visible} title="Quem vê" onClose={props.onClose}>
      {/* Opened anew each time, from the editor's Audience. */}
      {props.visible && <AudienceChoice {...props} />}
    </Sheet>
  )
}

/**
 * "Todos que vão", following the Participants, or "Escolher pessoas": a list built from Teams,
 * copied as they are now, and Participants avulsos. Below, how many it reaches, counting once
 * whoever is in a Field of people of the item, who sees it anyway.
 */
function AudienceChoice({ itemName, audience, fields, participants, teams, onApply }: Props) {
  const theme = useTheme()
  const { colors } = theme
  const [choice, setChoice] = useState(audience)
  const going = participants.map((p) => p.userId)
  const reach = audienceReach(choice, fields, going)
  const chosen = choice.kind === 'SELECTED'
  const withPeople = teams.filter((team) => teamParticipants(team, going).length > 0)

  return (
    <View style={styles.body}>
      {itemName.trim() !== '' && (
        <Text style={[styles.itemName, { color: colors.textMuted }]}>{itemName.trim()}</Text>
      )}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
        <ChoiceOption
          label="Todos que vão"
          hint="Acompanha os Participants: quem entrar depois também vê"
          selected={!chosen}
          onPress={() => setChoice((c) => setAudienceKind(c, 'ALL'))}
        />
        <ChoiceOption
          label="Escolher pessoas"
          hint="Uma lista fixa, montada com Teams e avulsos"
          selected={chosen}
          onPress={() => setChoice((c) => setAudienceKind(c, 'SELECTED'))}
        />

        {chosen && withPeople.length > 0 && (
          <>
            <Text style={[styles.section, { color: colors.textMuted }]}>COPIAR DE UM TEAM</Text>
            <View style={styles.teams}>
              {withPeople.map((team) => {
                const on = teamCopied(choice, team, going)
                const chip = theme.teamChip(autoTone(team.id))
                const label = `${team.name} · ${teamParticipants(team, going).length}`
                return (
                  <Pressable
                    key={team.id}
                    onPress={() => setChoice((c) => toggleTeam(c, team, going))}
                    accessibilityRole="checkbox"
                    accessibilityLabel={label}
                    accessibilityState={{ checked: on }}
                    style={[
                      styles.team,
                      { backgroundColor: on ? chip.text : chip.bg, borderColor: chip.text },
                    ]}
                  >
                    {on && <Icon name="check" color={chip.bg} size={16} strokeWidth={2.6} />}
                    <Text style={[styles.teamLabel, { color: on ? chip.bg : chip.text }]}>
                      {label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            <Text style={[textStyles.caption, { color: colors.textMuted }]}>
              Copia quem do Team vai agora; mudar o Team depois não muda a lista.
            </Text>
          </>
        )}

        {chosen && (
          <>
            <Text style={[styles.section, { color: colors.textMuted }]}>AVULSOS</Text>
            <View style={[styles.people, { backgroundColor: colors.bg }]}>
              {participants.map((person, i) => {
                const on = choice.userIds.includes(person.userId)
                const chip = theme.teamChip(autoTone(person.userId))
                return (
                  <Pressable
                    key={person.userId}
                    onPress={() => setChoice((c) => togglePerson(c, person.userId))}
                    accessibilityRole="checkbox"
                    accessibilityLabel={person.name}
                    accessibilityState={{ checked: on }}
                    style={[
                      styles.person,
                      i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider },
                    ]}
                  >
                    <View style={[styles.avatar, { backgroundColor: chip.bg }]}>
                      <Text style={[styles.initials, { color: chip.text }]}>
                        {initials(person.name)}
                      </Text>
                    </View>
                    <Text style={[styles.name, { color: colors.text }]}>{person.name}</Text>
                    <View
                      style={[
                        styles.box,
                        on
                          ? { backgroundColor: colors.action, borderColor: colors.action }
                          : { borderColor: colors.border },
                      ]}
                    >
                      {on && (
                        <Icon name="check" color={colors.onAction} size={16} strokeWidth={2.6} />
                      )}
                    </View>
                  </Pressable>
                )
              })}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.reach, { color: colors.text }]}
        >{`${plural(reach, 'pessoa', 'pessoas')} ${reach === 1 ? 'vê' : 'veem'}`}</Text>
        <Text style={[textStyles.caption, styles.notice, { color: colors.textMuted }]}>
          Quem estiver num Field de pessoas do item também vê, e já está na conta.
        </Text>
        <Button label="Aplicar" onPress={() => onApply(choice)} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  body: { gap: 12 },
  itemName: { fontFamily: fonts.sans600, fontSize: 13, marginTop: -8 },
  scroll: { maxHeight: 460 },
  list: { gap: 10 },
  section: { fontFamily: fonts.sans700, fontSize: 13, letterSpacing: 0.5, marginTop: 4 },
  teams: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  team: {
    minHeight: spacing.touchTarget,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamLabel: { fontFamily: fonts.sans700, fontSize: 14 },
  people: { borderRadius: 18, paddingHorizontal: 14 },
  person: {
    minHeight: spacing.touchTarget + 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontFamily: fonts.sans700, fontSize: 11 },
  name: { flex: 1, fontFamily: fonts.sans400, fontSize: 15 },
  box: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { gap: 6 },
  reach: { fontFamily: fonts.sans700, fontSize: 15, textAlign: 'center' },
  notice: { textAlign: 'center' },
})
