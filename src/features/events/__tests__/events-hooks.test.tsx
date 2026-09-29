import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'

import { mockTokenFor } from '@/shared/mock-backend'
import { useSession, type User } from '@/shared/session'

import { useEvent, useEvents } from '../hooks/use-events'

let client: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const claudia: User = {
  id: 7,
  name: 'Cláudia Lima',
  email: 'claudia.lima@gmail.com',
  role: 'USER',
  createdAt: '2026-09-27T22:58:10.000Z',
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
  // Demo mode: the hooks answer from the mock backend.
  useSession.setState({ session: { token: mockTokenFor(claudia), user: claudia, live: false } })
})

describe('useEvents', () => {
  it('lists the viewer’s Events, active soonest first and archived last', async () => {
    const { result } = await renderHook(() => useEvents(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.map((e) => e.name)).toEqual([
      'Chá da Júlia',
      'Marcos, 40',
      'Ana & Rafael',
      'Offsite Kora 2026',
    ])
  })
})

describe('useEvent', () => {
  it('fetches one Event', async () => {
    const { result } = await renderHook(() => useEvent(14), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toMatchObject({ id: 14, name: 'Marcos, 40' })
  })

  it('shows the list’s copy of the Event at once, while its own request runs', async () => {
    const list = await renderHook(() => useEvents(), { wrapper })
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true))

    const { result } = await renderHook(() => useEvent(15), { wrapper })

    expect(result.current.data).toMatchObject({ id: 15, name: 'Chá da Júlia' })
    await waitFor(() => expect(result.current.isPlaceholderData).toBe(false))
  })

  it('exposes FORBIDDEN for an Event the viewer is not a member of', async () => {
    const { result } = await renderHook(() => useEvent(16), { wrapper })

    await waitFor(() => expect(result.current.error).toMatchObject({ code: 'FORBIDDEN' }))
  })
})
