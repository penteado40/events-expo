import { useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'

import {
  ArchivedGuestsNotice,
  EmptyText,
  Glass,
  Notice,
  PressableGlass,
  QueryError,
  SkeletonBlock,
} from '@/shared/components/ui'
import { canSeeGuests } from '@/shared/domain/events'
import { formatMoney } from '@/shared/domain/money'
import { isViewer } from '@/shared/domain/roles'
import { colors, fonts, radii } from '@/shared/theme'

import type { ContributionEvent } from '../contribution-event'
import { contributionStatus } from '../contribution-status'
import { useContributions } from '../hooks/use-contributions'
import { registryItemName, type RegistryItemNames } from '../registry-item-name'
import { ItemName } from './item-name'
import type { Contribution } from '../schemas'

const SKELETON_ROWS = 3

type Props = {
  event: ContributionEvent
  /** The Event's Registry item names by id, from the route (ADR-0001); undefined while loading. */
  registryItemNames: RegistryItemNames | undefined
}

/**
 * The Conferir tab: the Event's Contributions marked paid, `PAID` first. A Viewer reads them with
 * a notice on top; tapping one opens its sheet.
 */
export function ContributionList({ event, registryItemNames }: Props) {
  const router = useRouter()
  const contributions = useContributions(event)

  if (!canSeeGuests(event)) return <ArchivedGuestsNotice />
  const viewerNotice = isViewer(event.membership) && (
    <Notice>VIEWER · somente leitura. A conferência cabe a Managers e Owners.</Notice>
  )
  if (contributions.isError && !contributions.data) {
    return (
      <>
        {viewerNotice}
        <QueryError message={contributions.error.message} onRetry={() => contributions.refetch()} />
      </>
    )
  }
  return (
    <>
      {viewerNotice}
      {!contributions.data ? (
        Array.from({ length: SKELETON_ROWS }, (_, index) => <ContributionSkeleton key={index} />)
      ) : contributions.data.length === 0 ? (
        <EmptyText>Nenhuma contribuição.</EmptyText>
      ) : (
        contributions.data.map((contribution) => (
          <ContributionCard
            key={contribution.id}
            contribution={contribution}
            currency={event.currency}
            itemName={registryItemName(registryItemNames, contribution.registryItemId)}
            onPress={() =>
              router.push({
                pathname: '/events/[id]/contributions/[cid]',
                params: { id: event.id, cid: contribution.id },
              })
            }
          />
        ))
      )}
    </>
  )
}

type CardProps = {
  contribution: Contribution
  currency: string
  /** Undefined while the Registry loads. */
  itemName: string | undefined
  onPress: () => void
}

function ContributionCard({ contribution, currency, itemName, onPress }: CardProps) {
  const status = contributionStatus(contribution.status)
  return (
    <PressableGlass
      variant="card"
      radius={radii.contributionCard}
      onPress={onPress}
      accessibilityLabel={`Contribuição de ${contribution.guestName}`}
      contentStyle={styles.card}
    >
      <View style={styles.row}>
        <Text style={styles.guest} numberOfLines={1}>
          {contribution.guestName}
        </Text>
        <Text style={styles.amount}>{formatMoney(contribution.amount, currency)}</Text>
      </View>
      <View style={[styles.row, styles.bottomRow]}>
        <ItemName
          name={itemName}
          style={styles.item}
          skeleton={{ width: 140, height: 11 }}
          numberOfLines={1}
          fill
        />
        <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
      </View>
    </PressableGlass>
  )
}

function ContributionSkeleton() {
  return (
    <Glass variant="card" radius={radii.contributionCard} contentStyle={styles.card}>
      <View style={styles.row} accessibilityLabel="Carregando contribuições">
        <SkeletonBlock width={140} height={14} />
        <SkeletonBlock width={80} height={14} />
      </View>
      <View style={styles.row}>
        <SkeletonBlock width={160} height={11} />
        <SkeletonBlock width={70} height={11} />
      </View>
    </Glass>
  )
}

const styles = StyleSheet.create({
  card: { gap: 8, paddingVertical: 14, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  guest: { flex: 1, fontFamily: fonts.sans400, fontSize: 15, color: colors.text },
  amount: { fontFamily: fonts.mono500, fontSize: 16, color: colors.text },
  item: { flex: 1, fontFamily: fonts.mono400, fontSize: 12, color: colors.textMuted },
  bottomRow: { gap: 10 },
  status: { fontFamily: fonts.mono400, fontSize: 12 },
})
