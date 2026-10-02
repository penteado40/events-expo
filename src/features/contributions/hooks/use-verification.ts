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
  type VerificationEvent,
  type StatusChange,
  type VerificationOutcome,
} from '@/shared/domain/contributions'
import type { ApiError } from '@/shared/lib/api-error'
import { eventCollectionKey, eventKey, eventsKey } from '@/shared/lib/query-keys'

import { contributionsRepository } from '../api'
import type { Contribution } from '../schemas'
import { VERIFICATION_OUTCOMES } from '../verification-outcome'

/** An Event's Verifications, as mutations: the sheet starts them, the Event detail shows their failure. */
const verificationKey = (eventId: number) => [...eventKey(eventId), 'verification'] as const

type Variables = {
  contribution: Pick<Contribution, 'id' | 'status' | 'amount'>
  outcome: VerificationOutcome
}

/** Applies a status change to every cache on screen that shows it (Início, chip, dot, Conferir). */
function patchCaches(client: QueryClient, eventId: number, change: StatusChange) {
  const contributionsKey = eventCollectionKey(eventId, 'contributions')
  const before = {
    events: client.getQueryData<VerificationEvent[]>(eventsKey),
    event: client.getQueryData<VerificationEvent>(eventKey(eventId)),
    contributions: client.getQueryData<Contribution[]>(contributionsKey),
  }
  const after = applyStatusChange(before, eventId, change)
  if (after === before) return
  if (after.events) client.setQueryData(eventsKey, after.events)
  if (after.event) client.setQueryData(eventKey(eventId), after.event)
  if (after.contributions) client.setQueryData(contributionsKey, after.contributions)
}

/** The Event's settled Verifications: what a new one replaces, so their failures go with them. */
const settledVerifications = (client: QueryClient, eventId: number) =>
  client.getMutationCache().findAll({
    mutationKey: verificationKey(eventId),
    predicate: (mutation) => mutation.state.status !== 'pending',
  })

/**
 * Records a Verification (or revises one), optimistically: Início's numbers, the card's chip, the
 * "Conferir" dot and "Verificado" change at once, and a failure rolls them back. Its callbacks
 * outlive the sheet that starts it. Once the last one settles, the Event refetches (the Registry's
 * counts with it), so the screen ends on the API's word.
 */
export function useVerification(eventId: number) {
  const client = useQueryClient()
  const mutation = useMutation<Contribution, ApiError, Variables, StatusChange>({
    mutationKey: verificationKey(eventId),
    // Kept until the next Verification or "×": a failure must outlive the sheet, however long.
    gcTime: Infinity,
    mutationFn: ({ contribution, outcome }) =>
      contributionsRepository[VERIFICATION_OUTCOMES[outcome].call](eventId, contribution.id),
    onMutate: async ({ contribution, outcome }) => {
      settledVerifications(client, eventId).forEach((settled) =>
        client.getMutationCache().remove(settled),
      )
      // A refetch landing now would overwrite the optimistic change with the old state.
      await Promise.all([
        client.cancelQueries({ queryKey: eventsKey, exact: true }),
        client.cancelQueries({ queryKey: eventKey(eventId), exact: true }),
        client.cancelQueries({ queryKey: eventCollectionKey(eventId, 'contributions') }),
      ])
      const change = {
        contributionId: contribution.id,
        amount: contribution.amount,
        from: contribution.status,
        to: outcome,
      }
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

type FailedVerification = {
  mutationId: number
  state: MutationState<Contribution, ApiError, Variables, StatusChange>
}

/**
 * The Event's most recent failed Verification since the last one started, if any: the sheet has
 * closed by then, so the Event detail shows it until `dismiss` or the next Verification.
 */
export function useFailedVerification(eventId: number) {
  const client = useQueryClient()
  const failures = useMutationState<FailedVerification>({
    filters: { mutationKey: verificationKey(eventId), status: 'error' },
    select: (mutation) => ({
      mutationId: mutation.mutationId,
      // The cache doesn't know this key's types; `useVerification` is its only writer.
      state: mutation.state as unknown as FailedVerification['state'],
    }),
  })
  const latest = failures.at(-1)
  if (!latest) return undefined

  const dismiss = () => {
    const cache = client.getMutationCache()
    const mutation = cache.getAll().find((m) => m.mutationId === latest.mutationId)
    if (mutation) cache.remove(mutation)
  }
  return { ...latest.state, dismiss }
}
