import { StyleSheet, Text, View } from 'react-native'

import { EmptyText, Glass, Notice, QueryError, SkeletonBlock } from '@/shared/components/ui'
import { canSeeGuests, formatEventDay, type GuestDataScope } from '@/shared/domain/events'
import { colors, fonts, radii, textStyles } from '@/shared/theme'

import { useRsvps } from '../hooks/use-rsvps'
import type { Rsvp } from '../schemas'

const SKELETON_ROWS = 4

type Props = { event: { id: number; timezone: string } & GuestDataScope }

/** The RSVPs tab: one card per Guest who confirmed, most recent first. */
export function RsvpList({ event }: Props) {
  const rsvps = useRsvps(event)

  if (!canSeeGuests(event)) return <Notice>ARQUIVADO · só Owners veem os convidados.</Notice>
  if (rsvps.isError && !rsvps.data) {
    return <QueryError message={rsvps.error.message} onRetry={() => rsvps.refetch()} />
  }
  if (!rsvps.data) {
    return Array.from({ length: SKELETON_ROWS }, (_, index) => <RsvpSkeleton key={index} />)
  }
  if (rsvps.data.length === 0) return <EmptyText>Nenhum RSVP.</EmptyText>
  return rsvps.data.map((rsvp) => (
    <RsvpCard key={rsvp.email} rsvp={rsvp} timezone={event.timezone} />
  ))
}

function RsvpCard({ rsvp, timezone }: { rsvp: Rsvp; timezone: string }) {
  return (
    <Glass variant="card" radius={radii.rsvpCard} contentStyle={styles.card}>
      <View style={styles.texts}>
        <Text style={styles.name} numberOfLines={1}>
          {rsvp.name}
        </Text>
        <Text style={textStyles.monoCaption} numberOfLines={1}>
          {rsvp.email}
        </Text>
      </View>
      <Text style={textStyles.monoCaption}>{formatEventDay(rsvp.createdAt, timezone)}</Text>
    </Glass>
  )
}

function RsvpSkeleton() {
  return (
    <Glass variant="card" radius={radii.rsvpCard} contentStyle={styles.card}>
      <View style={styles.texts} accessibilityLabel="Carregando RSVPs">
        <SkeletonBlock width={140} height={14} />
        <SkeletonBlock width={180} height={11} />
      </View>
      <SkeletonBlock width={36} height={11} />
    </Glass>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  texts: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontFamily: fonts.sans400, fontSize: 15, color: colors.text },
})
