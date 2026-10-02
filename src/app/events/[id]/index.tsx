import { useLocalSearchParams } from 'expo-router'

import { ContributionList, ContributionStats } from '@/features/contributions'
import { EventDetailScreen, SiteCard } from '@/features/events'
import { MembersCard } from '@/features/members'
import { RegistryList, useRegistryItemNames } from '@/features/registry'
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
          <ContributionStats event={event} pending={event.paidContributionCount} />
          <SiteCard siteUrl={event.siteUrl} />
          <MembersCard eventId={eventId} />
        </>
      )}
      rsvps={(event) => <RsvpList event={event} />}
      registry={(event) => <RegistryList event={event} />}
      contributions={(event) => <ConferirTab event={event} />}
    />
  )
}

type ConferirProps = { event: Parameters<typeof ContributionList>[0]['event'] }

/** Conferir names each Contribution's Registry item, from `registry` (ADR-0001). */
function ConferirTab({ event }: ConferirProps) {
  const registryItemNames = useRegistryItemNames(event.id)
  return <ContributionList event={event} registryItemNames={registryItemNames} />
}
