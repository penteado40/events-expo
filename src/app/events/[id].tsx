import { useLocalSearchParams } from 'expo-router'

import { ContributionStats } from '@/features/contributions'
import { EventDetailScreen, SiteCard } from '@/features/events'
import { MembersCard } from '@/features/members'
import { RsvpStats } from '@/features/rsvps'

export default function EventDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const eventId = Number(id)

  return (
    <EventDetailScreen
      id={eventId}
      summary={(event) => (
        <>
          <RsvpStats eventId={eventId} />
          <ContributionStats
            eventId={eventId}
            currency={event.currency}
            pending={event.paidContributionCount}
          />
          <SiteCard siteUrl={event.siteUrl} />
          <MembersCard eventId={eventId} />
        </>
      )}
    />
  )
}
