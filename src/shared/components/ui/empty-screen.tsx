import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { palette, spacing, textStyles, useTheme } from '@/shared/theme'

/**
 * A tab with nothing in it yet: its title, with the coral "·" of the design D titles, and whatever
 * it already offers below.
 */
export function EmptyScreen({ title, children }: { title: string; children?: ReactNode }) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, backgroundColor: colors.bg }]}>
      <Text accessibilityRole="header" style={[textStyles.display, { color: colors.text }]}>
        {title}
        <Text style={{ color: palette.coral[500] }}>·</Text>
      </Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: spacing.screen, gap: 24 },
})
