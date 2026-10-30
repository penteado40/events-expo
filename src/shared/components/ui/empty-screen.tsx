import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { palette, spacing, textStyles, useTheme } from '@/shared/theme'

/** A tab with nothing in it yet: only its title, with the coral "·" of the design D titles. */
export function EmptyScreen({ title }: { title: string }) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, backgroundColor: colors.bg }]}>
      <Text accessibilityRole="header" style={[textStyles.display, { color: colors.text }]}>
        {title}
        <Text style={{ color: palette.coral[500] }}>·</Text>
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: spacing.screen },
})
