import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native'

import { fonts, palette, spacing, useTheme } from '@/shared/theme'

/**
 * Media kit, Botões: `primary` (blue, the screen's one action), `secondary` (outlined), `dark`
 * (Apple's), `link` (text only, like "Esqueci a senha").
 */
type Variant = 'primary' | 'secondary' | 'dark' | 'link'

type Props = {
  label: string
  onPress: () => void
  variant?: Variant
  /** Shows a spinner and ignores presses. */
  loading?: boolean
  disabled?: boolean
  /** Drawn before the label, e.g. a brand mark. */
  icon?: ReactNode
  style?: ViewStyle
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
}: Props) {
  const { colors } = useTheme()
  const inactive = disabled || loading
  const look = {
    primary: { bg: colors.action, text: colors.onAction, border: 'transparent' },
    secondary: { bg: colors.surface, text: colors.text, border: colors.border },
    dark: { bg: palette.gray[900], text: '#FFFFFF', border: 'transparent' },
    link: { bg: 'transparent', text: colors.link, border: 'transparent' },
  }[variant]
  const off = disabled && !loading && variant !== 'link'

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        variant === 'link' ? styles.link : styles.button,
        {
          backgroundColor: off ? colors.divider : look.bg,
          borderColor: look.border,
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={look.text} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              variant === 'link' && styles.linkLabel,
              { color: off ? palette.gray[500] : look.text },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  link: {
    minHeight: spacing.touchTarget,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  label: { fontFamily: fonts.sans600, fontSize: 16 },
  linkLabel: { fontSize: 15 },
})
