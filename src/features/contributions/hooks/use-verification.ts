import {
  useMutation,
  useMutationState,
  useQueryClient,
  type MutationState,
  type QueryClient,
} from '@tanstack/react-query'

import {
  applyStatusChange,
  undoStatusChange,
  type StatusChange,
  type VerificationOutcome,
} from '@/shared/domain/contributions'
import type { ApiError } from '@/shared/lib/api-error'
import { eventCollectionKey, eventKey, eventsKey } from '@/shared/lib/query-keys'

import { contributionsRepository } from '../api'
import type { Contribution } from '../schemas'

/** An Event's Verifications, as mutations: the sheet starts them, the Event detail shows their failure. */
const verificationKey = (eventId: number) => [...eventKey(eventId), 'verification'] as const

type Variables = { contribution: Pick<Contribution, 'id' | 'status'>; outcome: VerificationOutcome }

/** What the Events list and the Event cache that a Verification changes. */
type CountedEvent = { id: number; paidContributionCount: number }

/** Applies a status change to every cache on screen that shows it (hero, chip, dot, Conferir). */
function patchCaches(client: QueryClient, eventId: number, change: StatusChange) {
  const contributionsKey = eventCollectionKey(eventId, 'contributions')
  const before = {
    events: client.getQueryData<CountedEvent[]>(eventsKey),
    event: client.getQueryData<CountedEvent>(eventKey(eventId)),
    contributions: client.getQueryData<Contribution[]>(contributionsKey),
  }
  const after = applyStatusChange(before, eventId, change)
  if (after === before) return
  if (after.events) client.setQueryData(eventsKey, after.events)
  if (after.event) client.setQueryData(eventKey(eventId), after.event)
  if (after.contributions) client.setQueryData(contributionsKey, after.contributions)
}

/**
 * Verifies or rejects a Contribution (or revises the outcome), optimistically: the hero total, the
 * card's chip, the "Conferir" dot and "Verificado" change at once, and a failure rolls them back.
 * Its callbacks outlive the sheet that starts it. Once the last one settles, the Event refetches
 * (the Registry's counts with it), so the screen ends on the API's word.
 */
export function useVerification(eventId: number) {
  const client = useQueryClient()
  const mutation = useMutation<Contribution, ApiError, Variables, StatusChange>({
    mutationKey: verificationKey(eventId),
    mutationFn: ({ contribution, outcome }) =>
      outcome === 'VERIFIED'
        ? contributionsRepository.verify(eventId, contribution.id)
        : contributionsRepository.reject(eventId, contribution.id),
    onMutate: async ({ contribution, outcome }) => {
      // A refetch landing now would overwrite the optimistic change with the old state.
      await Promise.all([
        client.cancelQueries({ queryKey: eventsKey, exact: true }),
        client.cancelQueries({ queryKey: eventKey(eventId), exact: true }),
        client.cancelQueries({ queryKey: eventCollectionKey(eventId, 'contributions') }),
      ])
      const change = { contributionId: contribution.id, from: contribution.status, to: outcome }
      patchCaches(client, eventId, change)
      return change
    },
    onError: (_error, _variables, change) => {
      if (change) patchCaches(client, eventId, undoStatusChange(change))
    },
    onSettled: async () => {
      // Another Verification still on its way would see its optimistic change refetched away.
      if (client.isMutating({ mutationKey: verificationKey(eventId) }) > 1) return
      await Promise.all([
        client.invalidateQueries({ queryKey: eventsKey, exact: true }),
        client.invalidateQueries({ queryKey: eventKey(eventId) }),
      ])
    },
  })

  return (contribution: Variables['contribution'], outcome: VerificationOutcome) =>
    mutation.mutate({ contribution, outcome })
}

type VerificationState = MutationState<Contribution, ApiError, Variables, StatusChange>

/**
 * The Event's latest Verification, when it failed: the sheet has closed by then, so the Event
 * detail shows it. The next Verification replaces it, success or not.
 */
export function useFailedVerification(eventId: number) {
  const states = useMutationState<VerificationState>({
    filters: { mutationKey: verificationKey(eventId) },
    select: (mutation) => mutation.state as VerificationState,
  })
  const latest = states.at(-1)
  return latest?.status === 'error' ? latest : undefined
}
