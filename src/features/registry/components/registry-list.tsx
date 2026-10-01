import { StyleSheet, Text, View } from 'react-native'

import { EmptyText, Glass, QueryError, SkeletonBlock } from '@/shared/components/ui'
import { formatMoney } from '@/shared/domain/money'
import { colors, fonts, radii, textStyles } from '@/shared/theme'

import { contributionCountLabel } from '../contribution-count-label'
import { useRegistryItems } from '../hooks/use-registry-items'
import type { RegistryItem } from '../schemas'
import { ItemThumbnail } from './item-thumbnail'

const SKELETON_ROWS = 3

type Props = { event: { id: number; currency: string } }

/** The Presentes tab: one card per Registry item, with its image, Contributions and price. */
export function RegistryList({ event }: Props) {
  const items = useRegistryItems(event.id)

  if (items.isError && !items.data) {
    return <QueryError message={items.error.message} onRetry={() => items.refetch()} />
  }
  if (!items.data) {
    return Array.from({ length: SKELETON_ROWS }, (_, index) => <ItemSkeleton key={index} />)
  }
  if (items.data.length === 0) return <EmptyText>Sem lista de presentes.</EmptyText>
  return items.data.map((item) => <ItemCard key={item.id} item={item} currency={event.currency} />)
}

function ItemCard({ item, currency }: { item: RegistryItem; currency: string }) {
  return (
    <Glass variant="card" radius={radii.registryCard} contentStyle={styles.card}>
      <ItemThumbnail imageUrl={item.imageUrl} />
      <View style={styles.texts}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={textStyles.monoCaption}>{contributionCountLabel(item.contributionCount)}</Text>
      </View>
      <Text style={styles.price}>{formatMoney(item.price, currency)}</Text>
    </Glass>
  )
}

function ItemSkeleton() {
  return (
    <Glass variant="card" radius={radii.registryCard} contentStyle={styles.card}>
      <SkeletonBlock width={48} height={48} radius={radii.thumbnail} />
      <View style={styles.texts} accessibilityLabel="Carregando presentes">
        <SkeletonBlock width={150} height={14} />
        <SkeletonBlock width={100} height={11} />
      </View>
      <SkeletonBlock width={70} height={13} />
    </Glass>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  texts: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontFamily: fonts.sans400, fontSize: 15, color: colors.text },
  price: { paddingRight: 6, fontFamily: fonts.mono500, fontSize: 14, color: colors.text },
})
