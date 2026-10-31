import { useState } from 'react'
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'

import { fonts, palette, useTheme } from '@/shared/theme'

type Props = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  label: string
  /** Shown below in red, and read with the field. */
  error?: string
}

/** Media kit, Campos: the label inside the box; blue while focused, red with an error. */
export function TextField({ label, error, onFocus, onBlur, ...input }: Props) {
  const { colors, scheme } = useTheme()
  const [focused, setFocused] = useState(false)
  const errorColor = scheme === 'dark' ? palette.red[100] : palette.red[700]
  const accent = error ? errorColor : focused ? colors.link : undefined

  return (
    <View style={styles.wrapper}>
      <View style={[styles.box, { borderColor: accent ?? colors.border }]}>
        <Text style={[styles.label, { color: accent ?? colors.textMuted }]}>{label}</Text>
        <TextInput
          {...input}
          accessibilityLabel={label}
          accessibilityHint={error}
          onFocus={(event) => {
            setFocused(true)
            onFocus?.(event)
          }}
          onBlur={(event) => {
            setFocused(false)
            onBlur?.(event)
          }}
          placeholderTextColor={palette.gray[500]}
          style={[styles.input, { color: colors.text }]}
        />
      </View>
      {error ? <Text style={[styles.error, { color: errorColor }]}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  box: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, gap: 2 },
  label: { fontFamily: fonts.sans600, fontSize: 12 },
  input: { fontFamily: fonts.sans400, fontSize: 16, padding: 0, minHeight: 24 },
  error: { fontFamily: fonts.sans400, fontSize: 12 },
})
