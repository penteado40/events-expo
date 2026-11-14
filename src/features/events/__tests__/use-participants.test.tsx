import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'

import { mockBackend } from '@/shared/mock-backend'
import { useSession, userSchema } from '@/shared/session'

import { useEvent } from '../hooks/use-event'
import { useGroupEvents } from '../hooks/use-group-events'
import { useParticipants, useParticipantWrites } from '../hooks/use-participants'

/** Bruno, Owner of Vocal Livre, in Demo mode: `events` answers from the shared mock backend. */
function wrapper() {
  const user = userSchema.parse(mockBackend.user(2))
  useSession.setState({ session: { id: 'demo-2', user, live: false } })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

const BRUNO = 2
const ENSAIO_DA_BANDA = 4

describe('changing the Participants', () => {
  it("reads the Participants, the Event and the Group's list again", async () => {
    const { result } = await renderHook(
      () => ({
        participants: useParticipants(ENSAIO_DA_BANDA),
        event: useEvent(ENSAIO_DA_BANDA),
        list: useGroupEvents(1),
        writes: useParticipantWrites(1, ENSAIO_DA_BANDA),
      }),
      { wrapper: wrapper() },
    )
    await waitFor(() => expect(result.current.list.data).toBeDefined())
    await waitFor(() => expect(result.current.event.data?.isParticipant).toBe(false))
    await waitFor(() => expect(result.current.participants.data).toHaveLength(1))

    await act(() => result.current.writes.add.mutateAsync([BRUNO, 4]))

    await waitFor(() => expect(result.current.participants.data).toHaveLength(3))
    await waitFor(() => expect(result.current.event.data?.isParticipant).toBe(true))
    const inList = result.current.list.data?.find((e) => e.id === ENSAIO_DA_BANDA)
    expect(inList?.isParticipant).toBe(true)

    await act(() => result.current.writes.remove.mutateAsync(BRUNO))

    await waitFor(() => expect(result.current.participants.data).toHaveLength(2))
    await waitFor(() =>
      expect(result.current.list.data?.find((e) => e.id === ENSAIO_DA_BANDA)?.isParticipant).toBe(
        false,
      ),
    )
  })
})
