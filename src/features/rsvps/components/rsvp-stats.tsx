import { StyleSheet, View } from 'react-native'

import { QueryError, StatCard } from '@/shared/components/ui'
import { canSeeGuests, type GuestDataScope } from '@/shared/domain/events'

import { useRsvps } from '../hooks/use-rsvps'
import { rsvpCounts } from '../rsvp-counts'

type Props = { event: { id: number } & GuestDataScope }

/**
 * The Resumo's first row: "RSVP · vão" and "RSVP · não vão". "—" for a viewer who can't see the
 * Guests, until the API has an Event summary to count from.
 */
export function RsvpStats({ event }: Props) {
  const rsvps = useRsvps(event)

  if (rsvps.isError && !rsvps.data) {
    return <QueryError message={rsvps.error.message} onRetry={() => rsvps.refetch()} />
  }
  const counts = rsvps.data && rsvpCounts(rsvps.data)
  const value = (count: number | undefined) =>
    !canSeeGuests(event) ? '—' : count === undefined ? undefined : String(count)
  return (
    <View style={styles.row}>
      <StatCard label="RSVP · VÃO" value={value(counts?.attending)} />
      <StatCard label="RSVP · NÃO VÃO" value={value(counts?.notAttending)} />
    </View>
  )
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 10 } })
