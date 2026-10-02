import { StyleSheet, View } from 'react-native'

import { QueryError, StatCard } from '@/shared/components/ui'
import { verifiedAmount } from '@/shared/domain/contributions'
import { canSeeGuests } from '@/shared/domain/events'
import { formatMoney } from '@/shared/domain/money'

import type { ContributionEvent } from '../contribution-event'
import { useContributions } from '../hooks/use-contributions'

type Props = {
  /** `paidContributionCount` is "Para conferir": the same number as the "Conferir" dot and the hero. */
  event: ContributionEvent & { paidContributionCount: number }
}

/**
 * The Resumo's second row: "Verificado" (money) and "Para conferir" (accent). "Verificado" is "—"
 * for a viewer who can't see the Guests, until the API has an Event summary to sum from.
 */
export function ContributionStats({ event }: Props) {
  const contributions = useContributions(event)

  // "Para conferir" comes from the Event, so it stays when the list fails; "Verificado" doesn't.
  const failed = contributions.isError && !contributions.data
  const verified = contributions.data
    ? formatMoney(verifiedAmount(contributions.data), event.currency)
    : failed || !canSeeGuests(event)
      ? '—'
      : undefined
  return (
    <>
      <View style={styles.row}>
        <StatCard label="VERIFICADO" money value={verified} />
        <StatCard label="PARA CONFERIR" accent value={String(event.paidContributionCount)} />
      </View>
      {failed && (
        <QueryError message={contributions.error.message} onRetry={() => contributions.refetch()} />
      )}
    </>
  )
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 10 } })
