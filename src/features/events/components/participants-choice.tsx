import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Icon } from '@/shared/components/ui'
import { autoTone } from '@/shared/domain/auto-tone'
import { plural } from '@/shared/domain/plural'
import { fonts, useTheme } from '@/shared/theme'

import type { ParticipantsChoice } from '../event-form'
import { useGroupMembers, useGroupTeams } from '../hooks/use-participants'
import { ChoiceOption } from './choice-option'

type Props = {
  groupId: number
  value: ParticipantsChoice
  onChange: (choice: ParticipantsChoice) => void
  error?: string
}

/**
 * "Participants vêm de" on "Novo Event" (PROJ-222): every Group member, or the people of the Teams
 * chosen, each copied at that moment. A Group with no Team only has the first.
 */
export function ParticipantsChoiceField({ groupId, value, onChange, error }: Props) {
  const theme = useTheme()
  const { colors } = theme
  const members = useGroupMembers(groupId)
  const teams = useGroupTeams(groupId)
  const chosen = value.from === 'teams' ? value.teamIds : []
  const toggleTeam = (teamId: number) =>
    onChange({
      from: 'teams',
      teamIds: chosen.includes(teamId) ? chosen.filter((id) => id !== teamId) : [...chosen, teamId],
    })
  const everyone = members.data && plural(members.data.length, 'pessoa', 'pessoas')

  return (
    <View style={styles.field}>
      <Text style={[styles.section, { color: colors.text }]}>Participants vêm de</Text>
      <ChoiceOption
        label="Todos os Group members"
        hint={everyone ? `${everyone}, dá para tirar depois` : undefined}
        a11yHint={everyone}
        selected={value.from === 'group'}
        onPress={() => onChange({ from: 'group' })}
      />
      {teams.data && teams.data.length > 0 && (
        <ChoiceOption
          label="Alguns Teams"
          hint="Quem está neles agora; mudar o Team depois não muda a lista"
          selected={value.from === 'teams'}
          onPress={() => value.from !== 'teams' && onChange({ from: 'teams', teamIds: [] })}
        >
          {value.from === 'teams' && (
            <View style={styles.chips}>
              {teams.data.map((team) => {
                const on = chosen.includes(team.id)
                const chip = theme.teamChip(autoTone(team.id))
                return (
                  <Pressable
                    key={team.id}
                    onPress={() => toggleTeam(team.id)}
                    accessibilityRole="checkbox"
                    accessibilityLabel={team.name}
                    accessibilityState={{ checked: on }}
                    style={[
                      styles.chip,
                      { backgroundColor: on ? chip.bg : colors.surface, borderColor: chip.bg },
                    ]}
                  >
                    {on && <Icon name="check" color={chip.text} size={14} strokeWidth={2.4} />}
                    <Text style={[styles.chipLabel, { color: on ? chip.text : colors.text }]}>
                      {team.name}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          )}
        </ChoiceOption>
      )}
      {error && (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.error, { color: theme.badge('red').text }]}
        >
          {error}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: 10, marginTop: 4 },
  section: { fontFamily: fonts.sans700, fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 12 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipLabel: { fontFamily: fonts.sans600, fontSize: 13 },
  error: { fontFamily: fonts.sans400, fontSize: 13, lineHeight: 18 },
})
