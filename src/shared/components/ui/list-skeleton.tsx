import { StyleSheet, View } from 'react-native'

import { useTheme } from '@/shared/theme'

/**
 * D-Carregando's list: the shape of the date column and the cards, so the screen does not jump
 * when they arrive. Read as one "Carregando".
 */
export function ListSkeleton() {
  const { colors } = useTheme()
  const block = { backgroundColor: colors.divider }

  return (
    <View accessible accessibilityLabel="Carregando" style={styles.list}>
      {[64, 180, 64].map((height, index) => (
        <View key={index} style={styles.row}>
          <View style={[styles.date, block]} />
          <View style={[styles.card, { height, backgroundColor: colors.surface }]}>
            <View style={[styles.line, block, { width: 120 }]} />
            <View style={[styles.line, block, { width: 80, height: 10 }]} />
          </View>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  list: { gap: 14 },
  row: { flexDirection: 'row', gap: 12 },
  date: { width: 46, height: 40, borderRadius: 10 },
  card: { flex: 1, borderRadius: 18, padding: 14, gap: 8, justifyContent: 'flex-end' },
  line: { height: 14, borderRadius: 7 },
})
