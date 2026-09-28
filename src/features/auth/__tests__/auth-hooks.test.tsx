import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'

import { useLastEmail, useSession } from '@/shared/session'

import { useEnterDemo } from '../hooks/use-enter-demo'
import { useLogin } from '../hooks/use-login'

let client: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  // gcTime: Infinity leaves no garbage-collection timer running after the test.
  client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: Infinity } } })
  useSession.setState({ session: null })
  useLastEmail.setState({ email: '' })
})

describe('useLogin', () => {
  it('signs in through "Entrar" and saves the typed email', async () => {
    const { result } = await renderHook(() => useLogin(), { wrapper })

    await act(() => result.current.mutateAsync({ email: 'admin@local.test', password: 'admin123' }))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(useSession.getState().session).toMatchObject({
      live: false,
      user: { email: 'admin@local.test', role: 'SUPER_ADMIN' },
    })
    expect(useLastEmail.getState().email).toBe('admin@local.test')
  })

  it('exposes the API error and changes nothing when the credentials are wrong', async () => {
    useLastEmail.setState({ email: 'previous@local.test' })
    const { result } = await renderHook(() => useLogin(), { wrapper })

    await act(async () => {
      result.current.mutate({ email: 'admin@local.test', password: 'wrong' })
    })

    await waitFor(() => expect(result.current.error).toMatchObject({ code: 'INVALID_CREDENTIALS' }))
    expect(useSession.getState().session).toBeNull()
    expect(useLastEmail.getState().email).toBe('previous@local.test')
  })
})

describe('useEnterDemo', () => {
  it('opens a Session as the demo Super admin without touching the saved email', async () => {
    useLastEmail.setState({ email: 'someone@local.test' })
    const { result } = await renderHook(() => useEnterDemo(), { wrapper })

    await act(() => result.current())

    expect(useSession.getState().session).toMatchObject({
      live: false,
      user: { id: 1, name: 'Admin Local', role: 'SUPER_ADMIN' },
    })
    expect(useLastEmail.getState().email).toBe('someone@local.test')
  })
})
