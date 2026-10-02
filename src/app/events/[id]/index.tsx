import { useLocalSearchParams } from 'expo-router'

import {
  ContributionList,
  ContributionStats,
  VerificationError,
  type ContributionEvent,
} from '@/features/contributions'
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
      notice={<VerificationError eventId={eventId} />}
      summary={(event) => (
        <>
          <RsvpStats event={event} />
          <ContributionStats event={event} />
          <SiteCard siteUrl={event.siteUrl} />
          <MembersCard eventId={eventId} />
        </>
      )}
      rsvps={(event) => <RsvpList event={event} />}
      registry={(event) => <RegistryList event={event} />}
      contributions={(event) => <ContributionsTab event={event} />}
    />
  )
}

/** The Conferir tab names each Contribution's Registry item, from `registry` (ADR-0001). */
function ContributionsTab({ event }: { event: ContributionEvent }) {
  const registryItemNames = useRegistryItemNames(event.id)
  return <ContributionList event={event} registryItemNames={registryItemNames} />
}
