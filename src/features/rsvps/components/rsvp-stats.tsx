import { StyleSheet, View } from 'react-native'

import { QueryError, StatCard } from '@/shared/components/ui'

import { useRsvps } from '../hooks/use-rsvps'
import { rsvpCounts } from '../rsvp-counts'

/** The Resumo's first row: "RSVP · vão" and "RSVP · não vão". */
export function RsvpStats({ eventId }: { eventId: number }) {
  const rsvps = useRsvps(eventId)

  if (rsvps.isError && !rsvps.data) {
    return <QueryError message={rsvps.error.message} onRetry={() => rsvps.refetch()} />
  }
  const counts = rsvps.data && rsvpCounts(rsvps.data)
  return (
    <View style={styles.row}>
      <StatCard label="RSVP · VÃO" value={counts && String(counts.attending)} />
      <StatCard label="RSVP · NÃO VÃO" value={counts && String(counts.notAttending)} />
    </View>
  )
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 10 } })
