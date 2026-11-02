import { StyleSheet, Text } from 'react-native'

import { textStyles, useTheme, type Tone } from '@/shared/theme'

/**
 * A state badge (Media kit, Componentes): small, in caps, always with text so the state is never
 * told by color alone. Coral changed/new, green going, gold Draft, red Cancelled, gray removed.
 */
export function Badge({ label, tone }: { label: string; tone: Tone }) {
  const { bg, text } = useTheme().badge(tone)
  return (
    <Text style={[styles.badge, textStyles.badge, { backgroundColor: bg, color: text }]}>
      {label}
    </Text>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
})
