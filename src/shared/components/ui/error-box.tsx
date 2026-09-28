import { StyleSheet, Text, View } from 'react-native'

import { colors, fonts, radii } from '@/shared/theme'

/** The API error as the design shows it: `code` on top, `message` below. */
export function ErrorBox({ code, message }: { code: string; message: string }) {
  return (
    <View style={styles.box} accessibilityRole="alert">
      <Text style={styles.code}>{code}</Text>
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
    gap: 4,
  },
  code: { fontFamily: fonts.mono500, fontSize: 12, color: colors.danger },
  message: { fontFamily: fonts.sans400, fontSize: 14, lineHeight: 20, color: colors.errorText },
})
