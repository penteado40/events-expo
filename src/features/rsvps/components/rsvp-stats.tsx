import { StyleSheet, View } from 'react-native'

import { QueryError, StatCard } from '@/shared/components/ui'
import { canSeeGuests, type GuestDataScope } from '@/shared/domain/events'

import { useRsvps } from '../hooks/use-rsvps'

type Props = { event: { id: number } & GuestDataScope }

/**
 * The Resumo's first row: "Confirmados", the Event's RSVPs (each one a Guest who's going). "—"
 * for a viewer who can't see the Guests, until the API has an Event summary to count from.
 */
export function RsvpStats({ event }: Props) {
  const rsvps = useRsvps(event)

  if (rsvps.isError && !rsvps.data) {
    return <QueryError message={rsvps.error.message} onRetry={() => rsvps.refetch()} />
  }
  const value = !canSeeGuests(event) ? '—' : rsvps.data && String(rsvps.data.length)
  // In a row, like the other stats: StatCard grows along its parent's main axis (flex: 1).
  return (
    <View style={styles.row}>
      <StatCard label="CONFIRMADOS" value={value} />
    </View>
  )
}

const styles = StyleSheet.create({ row: { flexDirection: 'row' } })
