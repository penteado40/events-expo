import { StyleSheet, Text, View } from 'react-native'

import { fonts, useTheme } from '@/shared/theme'

import { Icon } from './icon'

type Props = {
  message: string
  /** False for a warning that is always there, like D-Ativar's: not announced as an alert. */
  alert?: boolean
}

/** A red box with an alert icon (the D-Ativar warning's shape), for an error unless told. */
export function Notice({ message, alert = true }: Props) {
  const { badge } = useTheme()
  const { bg, text } = badge('red')

  return (
    <View
      accessibilityRole={alert ? 'alert' : undefined}
      accessibilityLiveRegion={alert ? 'polite' : undefined}
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
