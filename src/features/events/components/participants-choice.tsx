import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Icon } from '@/shared/components/ui'
import { autoTone } from '@/shared/domain/auto-tone'
import { plural } from '@/shared/domain/plural'
import { fonts, spacing, useTheme } from '@/shared/theme'

import type { ParticipantsChoice } from '../event-form'
import { useGroupPeople } from '../hooks/use-participants'

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
  const { members, teams } = useGroupPeople(groupId)
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
      <Option
        label="Todos os Group members"
        hint={everyone ? `${everyone}, dá para tirar depois` : undefined}
        a11yHint={everyone}
        selected={value.from === 'group'}
        onPress={() => onChange({ from: 'group' })}
      />
      {teams.data && teams.data.length > 0 && (
        <Option
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
        </Option>
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

function Option({
  label,
  hint,
  a11yHint,
  selected,
  onPress,
  children,
}: {
  label: string
  hint?: string
  /** What the radio's name adds: "5 pessoas". */
  a11yHint?: string
  selected: boolean
  onPress: () => void
  children?: React.ReactNode
}) {
  const { colors } = useTheme()
  return (
    <View
      style={[
        styles.option,
        { backgroundColor: colors.surface, borderColor: selected ? colors.action : colors.border },
      ]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityLabel={[label, a11yHint].filter(Boolean).join(', ')}
        accessibilityState={{ checked: selected }}
        style={styles.optionHead}
      >
        <View style={[styles.radio, { borderColor: selected ? colors.action : colors.border }]}>
          {selected && <View style={[styles.dot, { backgroundColor: colors.action }]} />}
        </View>
        <View style={styles.optionText}>
          <Text style={[styles.optionLabel, { color: colors.text }]}>{label}</Text>
          {hint && <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>}
        </View>
      </Pressable>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: 10, marginTop: 4 },
  section: { fontFamily: fonts.sans700, fontSize: 16 },
  option: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 4 },
  optionHead: {
    minHeight: spacing.touchTarget,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  optionText: { flex: 1, gap: 2 },
  optionLabel: { fontFamily: fonts.sans600, fontSize: 15 },
  hint: { fontFamily: fonts.sans400, fontSize: 13, lineHeight: 18 },
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
