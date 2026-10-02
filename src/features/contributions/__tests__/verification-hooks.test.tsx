import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'

import {
  verifiedAmount,
  type ContributionStatus,
  type CountedEvent,
} from '@/shared/domain/contributions'
import { pendingTotal } from '@/shared/domain/events'
import { ApiError } from '@/shared/lib/api-error'
import { eventCollectionKey, eventKey, eventsKey } from '@/shared/lib/query-keys'

import { contributionsRepository } from '../api'
import { useFailedVerification, useVerification } from '../hooks/use-verification'
import type { Contribution } from '../schemas'

let client: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const contribution = (id: number, amount: number, status: ContributionStatus): Contribution => ({
  id,
  guestName: 'Beatriz Nogueira',
  registryItemId: 121,
  amount,
  status,
  paidAt: '2026-09-27T00:14:00.000Z',
  hasReceipt: true,
})

const contributionsKey = eventCollectionKey(12, 'contributions')

// Ana & Rafael (12) as the Events list, the Event detail and Conferir have it cached.
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
  client.setQueryData(eventsKey, [
    { id: 12, paidContributionCount: 2 },
    { id: 15, paidContributionCount: 2 },
  ])
  client.setQueryData(eventKey(12), { id: 12, paidContributionCount: 2 })
  client.setQueryData(contributionsKey, [
    contribution(301, 450, 'PAID'),
    contribution(302, 200, 'PAID'),
    contribution(298, 200, 'VERIFIED'),
  ])
})

// A test's last refetches and re-renders land inside it, not in the next one.
afterEach(async () => {
  await act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)))
  jest.restoreAllMocks()
})

/** What the screen shows: the hero total, the Event's dot/chip count and "Verificado". */
const screen = () => ({
  hero: pendingTotal(client.getQueryData<CountedEvent[]>(eventsKey) ?? []),
  badge: client.getQueryData<CountedEvent>(eventKey(12))?.paidContributionCount,
  verified: verifiedAmount(client.getQueryData<Contribution[]>(contributionsKey) ?? []),
})

/** A repository call that answers only when told to. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const render = () =>
  renderHook(() => ({ record: useVerification(12), failed: useFailedVerification(12) }), {
    wrapper,
  })

describe('useVerification', () => {
  it('updates the hero, the badge and "Verificado" before the API answers', async () => {
    const answer = deferred<Contribution>()
    jest.spyOn(contributionsRepository, 'verify').mockReturnValue(answer.promise)
    const { result } = await render()

    await act(async () => result.current.record(contribution(301, 450, 'PAID'), 'VERIFIED'))

    await waitFor(() => expect(screen()).toEqual({ hero: 3, badge: 1, verified: 650 }))
    await act(async () => answer.resolve(contribution(301, 450, 'VERIFIED')))
  })

  it('rolls everything back when the API refuses, and reports the failure', async () => {
    jest
      .spyOn(contributionsRepository, 'reject')
      .mockRejectedValue(new ApiError('FORBIDDEN', 'Você não tem permissão para esta ação.'))
    const { result } = await render()

    await act(async () => result.current.record(contribution(301, 450, 'PAID'), 'REJECTED'))

    await waitFor(() => expect(result.current.failed).toBeDefined())
    expect(screen()).toEqual({ hero: 4, badge: 2, verified: 200 })
    expect(client.getQueryData<Contribution[]>(contributionsKey)?.[0].status).toBe('PAID')
    expect(result.current.failed?.error?.code).toBe('FORBIDDEN')
    expect(result.current.failed?.variables).toMatchObject({
      contribution: { id: 301 },
      outcome: 'REJECTED',
    })
  })

  it('clears the failure with the next Verification', async () => {
    jest
      .spyOn(contributionsRepository, 'verify')
      .mockRejectedValueOnce(new ApiError('INTERNAL_ERROR', 'Erro interno.'))
      .mockResolvedValueOnce(contribution(302, 200, 'VERIFIED'))
    const { result } = await render()

    await act(async () => result.current.record(contribution(301, 450, 'PAID'), 'VERIFIED'))
    await waitFor(() => expect(result.current.failed).toBeDefined())
    await act(async () => result.current.record(contribution(302, 200, 'PAID'), 'VERIFIED'))

    await waitFor(() => expect(result.current.failed).toBeUndefined())
  })

  it('refetches the Event and the Events list once it settles', async () => {
    jest
      .spyOn(contributionsRepository, 'verify')
      .mockResolvedValue(contribution(301, 450, 'VERIFIED'))
    const { result } = await render()

    await act(async () => result.current.record(contribution(301, 450, 'PAID'), 'VERIFIED'))

    await waitFor(() => expect(client.getQueryState(eventsKey)?.isInvalidated).toBe(true))
    expect(client.getQueryState(eventKey(12))?.isInvalidated).toBe(true)
    expect(client.getQueryState(contributionsKey)?.isInvalidated).toBe(true)
  })

  it("keeps one Verification's optimistic change while another's failure rolls back", async () => {
    const first = deferred<Contribution>()
    jest
      .spyOn(contributionsRepository, 'verify')
      .mockReturnValueOnce(first.promise)
      .mockRejectedValueOnce(new ApiError('INTERNAL_ERROR', 'Erro interno.'))
    const { result } = await render()

    await act(async () => result.current.record(contribution(301, 450, 'PAID'), 'VERIFIED'))
    await act(async () => result.current.record(contribution(302, 200, 'PAID'), 'VERIFIED'))
    await waitFor(() => expect(result.current.failed).toBeDefined())

    expect(screen()).toEqual({ hero: 3, badge: 1, verified: 650 })
    // Still on its way: the failure's settling doesn't refetch it away.
    expect(client.getQueryState(contributionsKey)?.isInvalidated).toBe(false)
    await act(async () => first.resolve(contribution(301, 450, 'VERIFIED')))
  })

  it('keeps the failure after the sheet that started it is gone, until dismissed', async () => {
    jest
      .spyOn(contributionsRepository, 'verify')
      .mockRejectedValue(new ApiError('INTERNAL_ERROR', 'Erro interno.'))
    const sheet = await renderHook(() => useVerification(12), { wrapper })
    await act(async () => sheet.result.current(contribution(301, 450, 'PAID'), 'VERIFIED'))
    await act(async () => sheet.unmount())

    // The Event detail, mounted afresh (e.g. after leaving it and coming back).
    const detail = await renderHook(() => useFailedVerification(12), { wrapper })
    await waitFor(() => expect(detail.result.current?.error?.code).toBe('INTERNAL_ERROR'))
    await act(async () => detail.result.current?.dismiss())

    await waitFor(() => expect(detail.result.current).toBeUndefined())
    const again = await renderHook(() => useFailedVerification(12), { wrapper })
    expect(again.result.current).toBeUndefined()
  })

  it("shows an earlier Verification's failure while a later one is still on its way", async () => {
    const earlier = deferred<Contribution>()
    const later = deferred<Contribution>()
    jest
      .spyOn(contributionsRepository, 'verify')
      .mockReturnValueOnce(earlier.promise)
      .mockReturnValueOnce(later.promise)
    const { result } = await render()

    await act(async () => result.current.record(contribution(301, 450, 'PAID'), 'VERIFIED'))
    await act(async () => result.current.record(contribution(302, 200, 'PAID'), 'VERIFIED'))
    await act(async () => earlier.reject(new ApiError('INTERNAL_ERROR', 'Erro interno.')))
    await waitFor(() => expect(result.current.failed?.variables?.contribution.id).toBe(301))
    await act(async () => later.resolve(contribution(302, 200, 'VERIFIED')))

    expect(result.current.failed?.variables?.contribution.id).toBe(301)
  })
})
