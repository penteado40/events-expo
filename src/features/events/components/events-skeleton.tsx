import { StyleSheet, View } from 'react-native'

import { Glass, SkeletonBlock } from '@/shared/components/ui'
import { radii } from '@/shared/theme'

const CARDS = 3

/** The first load: glass shaped like the hero and the Event cards, so nothing jumps on arrival. */
export function EventsSkeleton() {
  return (
    <View style={styles.list} accessibilityLabel="Carregando eventos">
      <Glass variant="accent" radius={radii.heroCard} contentStyle={styles.hero}>
        <View style={styles.heroText}>
          <SkeletonBlock width={110} height={12} />
          <SkeletonBlock width={210} height={14} />
        </View>
        <SkeletonBlock width={44} height={50} radius={12} />
      </Glass>
      {Array.from({ length: CARDS }, (_, index) => (
        <Glass key={index} variant="card" radius={radii.eventCard} contentStyle={styles.card}>
          <View style={styles.row}>
            <SkeletonBlock width={120} height={12} />
            <SkeletonBlock width={60} height={12} />
          </View>
          <SkeletonBlock width="70%" height={22} radius={8} />
          <View style={styles.row}>
            <SkeletonBlock width={150} height={13} />
            <SkeletonBlock width={84} height={22} radius={radii.chip} />
          </View>
        </Glass>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  list: { gap: 14 },
  hero: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  heroText: { gap: 8 },
  card: { paddingVertical: 16, paddingHorizontal: 18, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
})
