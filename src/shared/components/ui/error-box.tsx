import { StyleSheet, Text, View } from 'react-native'

import { colors, fonts, radii } from '@/shared/theme'

/** An error's message, never its code: the screen doesn't expose API internals. */
export function ErrorBox({ message }: { message: string }) {
  return (
    <View style={styles.box} accessibilityRole="alert">
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radii.input,
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  message: { fontFamily: fonts.sans400, fontSize: 14, lineHeight: 20, color: colors.errorText },
})
