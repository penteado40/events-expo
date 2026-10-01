import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'

import { mockTokenFor } from '@/shared/mock-backend'
import { useSession, type User } from '@/shared/session'

import { rsvpsRepository } from '../api'
import { useRsvps } from '../hooks/use-rsvps'

let client: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const signIn = (user: User) =>
  useSession.setState({ session: { token: mockTokenFor(user), user, live: false } })

const claudia: User = {
  id: 7,
  name: 'Cláudia Lima',
  email: 'claudia.lima@gmail.com',
  role: 'USER',
  createdAt: '2026-09-27T22:58:10.000Z',
}
const otavio: User = { ...claudia, id: 8, name: 'Otávio Kern', email: 'otavio@kora.com.br' }

// The archived Offsite Kora as each of them gets it from `GET /events/9`.
const offsiteKora = (role: 'OWNER' | 'MANAGER') =>
  ({ id: 9, status: 'ARCHIVED', membership: { role, isPrimaryOwner: role === 'OWNER' } }) as const

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
})

afterEach(() => jest.restoreAllMocks())

describe('useRsvps', () => {
  it('lists the RSVPs most recent first', async () => {
    signIn(claudia)
    const { result } = await renderHook(() => useRsvps(offsiteKora('OWNER')), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.map((r) => r.name)).toEqual([
      'Jonas Lemos',
      'Isabela Faria',
      'Otávio Kern',
    ])
  })

  it("doesn't ask for an archived Event's RSVPs when the viewer can't see its Guests", async () => {
    signIn(otavio)
    const list = jest.spyOn(rsvpsRepository, 'list')
    const { result } = await renderHook(() => useRsvps(offsiteKora('MANAGER')), { wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
    expect(list).not.toHaveBeenCalled()
  })
})
