import { useLocalSearchParams } from 'expo-router'

import { ContributionStats } from '@/features/contributions'
import { EventDetailScreen, SiteCard } from '@/features/events'
import { MembersCard } from '@/features/members'
import { RegistryList } from '@/features/registry'
import { RsvpList, RsvpStats } from '@/features/rsvps'

export default function EventDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const eventId = Number(id)

  return (
    <EventDetailScreen
      id={eventId}
      summary={(event) => (
        <>
          <RsvpStats event={event} />
          <ContributionStats
            eventId={eventId}
            currency={event.currency}
            pending={event.paidContributionCount}
          />
          <SiteCard siteUrl={event.siteUrl} />
          <MembersCard eventId={eventId} />
        </>
      )}
      rsvps={(event) => <RsvpList event={event} />}
      registry={(event) => <RegistryList event={event} />}
    />
  )
}
