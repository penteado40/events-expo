import { Pressable, StyleSheet, Text } from 'react-native'

import { Icon } from '@/shared/components/ui'
import { autoTone } from '@/shared/domain/auto-tone'
import { fonts, useTheme } from '@/shared/theme'

type Props = {
  teamId: number
  label: string
  /** Marked: the check before the name. */
  checked: boolean
  /**
   * A choice to toggle (`checkbox`), only outlined in the Team's color while off; or an action
   * (`button`), always filled, done once checked.
   */
  kind: 'checkbox' | 'button'
  accessibilityLabel?: string
  disabled?: boolean
  onPress: () => void
}

/**
 * A Team in its automatic chip colors: "Participants vêm de" on "Novo Event", "Marcar Team" on
 * "Quem vai", "Copiar de um Team" on "Quem vê".
 */
export function TeamChip({
  teamId,
  label,
  checked,
  kind,
  accessibilityLabel = label,
  disabled = false,
  onPress,
}: Props) {
  const { teamChip, colors } = useTheme()
  const chip = teamChip(autoTone(teamId))
  const filled = kind === 'button' || checked
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={kind}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={kind === 'checkbox' ? { checked, disabled } : { disabled }}
      style={[
        styles.chip,
        { backgroundColor: filled ? chip.bg : colors.surface, borderColor: chip.bg },
      ]}
    >
      {checked && <Icon name="check" color={chip.text} size={14} strokeWidth={2.4} />}
      <Text style={[styles.label, { color: filled ? chip.text : colors.text }]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: { fontFamily: fonts.sans600, fontSize: 13 },
})
