import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { colors, fonts } from '@/shared/theme'

/** A section of Início: its title in mono, outside the cards, above them. */
export function HomeSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={sectionStyles.section}>
      <Text style={sectionStyles.title}>{title}</Text>
      {children}
    </View>
  )
}

/** Shared with the expanded "Próximos eventos", which lays its list out like a section. */
export const sectionStyles = StyleSheet.create({
  section: { gap: 10 },
  title: {
    paddingHorizontal: 6,
    fontFamily: fonts.mono400,
    fontSize: 12,
    letterSpacing: 0.72,
    color: colors.textMuted,
  },
})
