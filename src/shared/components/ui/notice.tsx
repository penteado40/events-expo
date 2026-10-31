import { StyleSheet, Text, View } from 'react-native'

import { fonts, useTheme, type Tone } from '@/shared/theme'

import { Icon } from './icon'

type Props = { message: string; tone?: Tone }

/** A tinted box with an alert icon (D-Ativar): coral to warn, red for an error. Read as an alert. */
export function Notice({ message, tone = 'red' }: Props) {
  const { badge } = useTheme()
  const { bg, text } = badge(tone)

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.box, { backgroundColor: bg }]}
    >
      <Icon name="alert" color={text} size={18} />
      <Text style={[styles.message, { color: text }]}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
  },
  message: { flex: 1, fontFamily: fonts.sans400, fontSize: 13, lineHeight: 18 },
})
