import { useState } from 'react'
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'

import { fonts, palette, useTheme } from '@/shared/theme'

type Props = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  label: string
  /** What is wrong with the value: the box turns red and says it below. */
  error?: string | null
}

/** Media kit, Campos: the label inside the box, both blue while focused, red with an error. */
export function TextField({ label, error, onFocus, onBlur, ...input }: Props) {
  const { colors, badge } = useTheme()
  const [focused, setFocused] = useState(false)
  const danger = badge('red').text
  const accent = error ? danger : focused ? colors.link : undefined

  return (
    <View style={styles.field}>
      <View
        style={[
          styles.box,
          { borderColor: accent ?? colors.border, backgroundColor: colors.surface },
        ]}
      >
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
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  box: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, gap: 2 },
  label: { fontFamily: fonts.sans600, fontSize: 12 },
  input: { fontFamily: fonts.sans400, fontSize: 16, padding: 0, minHeight: 24 },
  error: { fontFamily: fonts.sans400, fontSize: 13, lineHeight: 18 },
})
