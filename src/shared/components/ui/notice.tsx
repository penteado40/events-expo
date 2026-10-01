import { StyleSheet, Text } from 'react-native'

import { colors, fonts } from '@/shared/theme'

/** A tab's warning line in place of what the viewer can't see or do (Mono 12, warning). */
export function Notice({ children }: { children: string }) {
  return <Text style={styles.notice}>{children}</Text>
}

/** A tab's empty state ("Nenhum RSVP.", "Sem lista de presentes."). */
export function EmptyText({ children }: { children: string }) {
  return <Text style={styles.empty}>{children}</Text>
}

const styles = StyleSheet.create({
  notice: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontFamily: fonts.mono400,
    fontSize: 12,
    lineHeight: 18,
    color: colors.warning,
  },
  empty: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontFamily: fonts.sans400,
    fontSize: 14,
    color: colors.textMuted,
  },
})
