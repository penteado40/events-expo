import { useState } from 'react'
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'

import { fonts, palette, useTheme } from '@/shared/theme'

type Props = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & { label: string }

/** Media kit, Campos: the label inside the box, both blue while focused. */
export function TextField({ label, onFocus, onBlur, ...input }: Props) {
  const { colors } = useTheme()
  const [focused, setFocused] = useState(false)
  const accent = focused ? colors.link : undefined

  return (
    <View style={[styles.box, { borderColor: accent ?? colors.border }]}>
      <Text style={[styles.label, { color: accent ?? colors.textMuted }]}>{label}</Text>
      <TextInput
        {...input}
        accessibilityLabel={label}
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
  )
}

const styles = StyleSheet.create({
  box: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, gap: 2 },
  label: { fontFamily: fonts.sans600, fontSize: 12 },
  input: { fontFamily: fonts.sans400, fontSize: 16, padding: 0, minHeight: 24 },
})
