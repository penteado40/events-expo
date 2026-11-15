import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { Icon } from '@/shared/components/ui'
import { useTheme } from '@/shared/theme'

type Props = {
  /** The person's name, the checkbox's own. */
  label: string
  checked: boolean
  disabled?: boolean
  /** The first row of its card: no divider above it. */
  first: boolean
  onPress: () => void
  style?: StyleProp<ViewStyle>
  /** What the row shows before the box: the avatar and the name. */
  children: React.ReactNode
}

/**
 * A person to mark in a card, with a box at the end filled in the action color when marked: who
 * goes on "Quem vai", the avulsos on "Quem vê".
 */
export function CheckRow({
  label,
  checked,
  disabled = false,
  first,
  onPress,
  style,
  children,
}: Props) {
  const { colors } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      style={[styles.row, !first && { borderTopWidth: 1, borderTopColor: colors.divider }, style]}
    >
      {children}
      <CheckBox checked={checked} />
    </Pressable>
  )
}

/** The box of a row, also shown alone where nothing is marked by touch. */
export function CheckBox({ checked }: { checked: boolean }) {
  const { colors } = useTheme()
  return (
    <View
      style={[
        styles.box,
        checked
          ? { backgroundColor: colors.action, borderColor: colors.action }
          : { borderColor: colors.border },
      ]}
    >
      {checked && <Icon name="check" color={colors.onAction} size={16} strokeWidth={2.6} />}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  box: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
