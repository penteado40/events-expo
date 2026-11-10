import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'

import { mockBackend } from '@/shared/mock-backend'
import { useSession, userSchema } from '@/shared/session'

import { useEvent } from '../hooks/use-event'
import { useGroupEvents } from '../hooks/use-group-events'
import { useCreateEvent, useUpdateEvent } from '../hooks/use-save-event'

/** Bruno, Owner of Vocal Livre, in Demo mode: `events` answers from the shared mock backend. */
function wrapper() {
  const user = userSchema.parse(mockBackend.user(2))
  useSession.setState({ session: { id: 'demo-2', user, live: false } })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('saving an Event', () => {
  it("creating reads the Group's list again, so the new Event shows on the Início", async () => {
    const { result } = await renderHook(
      () => ({ list: useGroupEvents(1), create: useCreateEvent(1) }),
      { wrapper: wrapper() },
    )
    await waitFor(() => expect(result.current.list.data).toBeDefined())

    await act(() =>
      result.current.create.mutateAsync({
        name: 'Saída Recife',
        place: 'Recife, PE',
        period: { startDate: '2027-01-08', endDate: '2027-01-10', timezone: 'America/Recife' },
      }),
    )

    await waitFor(() =>
      expect(result.current.list.data?.map((e) => e.name)).toContain('Saída Recife'),
    )
  })

  it("editing shows the Event as the API answered it, and reads the Group's list again", async () => {
    const { result } = await renderHook(
      () => ({ list: useGroupEvents(1), event: useEvent(3), update: useUpdateEvent(3) }),
      { wrapper: wrapper() },
    )
    await waitFor(() => expect(result.current.event.data).toBeDefined())

    await act(() => result.current.update.mutateAsync({ name: 'Saída Manaus 2026' }))

    expect(result.current.event.data?.name).toBe('Saída Manaus 2026')
    await waitFor(() =>
      expect(result.current.list.data?.map((e) => e.name)).toContain('Saída Manaus 2026'),
    )
  })
})
