import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@/shared/theme'

/** The Group's blue header (D-Início): blue 900 → 500, rounded at the bottom, under the status bar. */
export function GroupHeader({ children }: { children: ReactNode }) {
  const { header } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + 8,
          backgroundImage: `linear-gradient(160deg, ${header[0]}, ${header[1]})`,
        },
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    gap: 14,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
})
