import { useLocalSearchParams, useRouter } from 'expo-router'

import { ContributionDetail, ContributionDetailSkeleton } from '@/features/contributions'
import { useEvent } from '@/features/events'
import { useRegistryItemNames } from '@/features/registry'
import { QueryError, Sheet } from '@/shared/components/ui'

/**
 * The Contribution sheet, its own route over the Event detail (`transparentModal`), so a
 * Contribution can be linked to directly. Closing it pops back to Conferir; opened by a link with
 * nothing underneath, it lands on the Event detail instead.
 */
export default function ContributionRoute() {
  const router = useRouter()
  const { id, cid } = useLocalSearchParams<{ id: string; cid: string }>()
  const eventId = Number(id)
  const event = useEvent(eventId)
  const registryItemNames = useRegistryItemNames(eventId)
  const close = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/events/[id]', params: { id: eventId } })

  return (
    <Sheet onClose={close}>
      {event.data ? (
        <ContributionDetail
          event={event.data}
          contributionId={Number(cid)}
          registryItemNames={registryItemNames}
        />
      ) : event.isError ? (
        <QueryError message={event.error.message} onRetry={() => event.refetch()} />
      ) : (
        <ContributionDetailSkeleton />
      )}
    </Sheet>
  )
}
