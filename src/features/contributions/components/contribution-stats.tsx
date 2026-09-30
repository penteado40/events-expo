import { StyleSheet, View } from 'react-native'

import { QueryError, StatCard } from '@/shared/components/ui'
import { verifiedAmount } from '@/shared/domain/contributions'
import { formatMoney } from '@/shared/domain/money'

import { useContributions } from '../hooks/use-contributions'

type Props = {
  eventId: number
  currency: string
  /** The Event's `paidContributionCount`: the same number as the "Conferir" dot and the hero. */
  pending: number
}

/** The Resumo's second row: "Verificado" (money) and "Para conferir" (accent). */
export function ContributionStats({ eventId, currency, pending }: Props) {
  const contributions = useContributions(eventId)

  // "Para conferir" comes from the Event, so it stays when the list fails; "Verificado" doesn't.
  const failed = contributions.isError && !contributions.data
  const verified = contributions.data
    ? formatMoney(verifiedAmount(contributions.data), currency)
    : failed
      ? '—'
      : undefined
  return (
    <>
      <View style={styles.row}>
        <StatCard label="VERIFICADO" money value={verified} />
        <StatCard label="PARA CONFERIR" accent value={String(pending)} />
      </View>
      {failed && (
        <QueryError message={contributions.error.message} onRetry={() => contributions.refetch()} />
      )}
    </>
  )
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 10 } })
