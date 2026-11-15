import { Pressable, StyleSheet, Text, View } from 'react-native'

import { fonts, spacing, useTheme } from '@/shared/theme'

type Props = {
  label: string
  hint?: string
  /** What the radio's name adds: "5 pessoas". */
  a11yHint?: string
  selected: boolean
  onPress: () => void
  /** What the option opens when chosen (the Teams to pick, say). */
  children?: React.ReactNode
}

/**
 * One radio option on a card, outlined in the action color when chosen: "Participants vêm de" on
 * "Novo Event", "Quem vê" in the item editor.
 */
export function ChoiceOption({ label, hint, a11yHint, selected, onPress, children }: Props) {
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
})
