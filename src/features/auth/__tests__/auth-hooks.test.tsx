import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'

import { API_URL } from '@/shared/lib/api-client'
import { useLastEmail, useSession, type Session } from '@/shared/session'

import { useEnterDemo } from '../hooks/use-enter-demo'
import { useLogin } from '../hooks/use-login'
import { checkSession } from '../hooks/use-session-check'
import { createFakeApi } from './fake-api'

let client: QueryClient
let fetchSpy: jest.SpyInstance

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const admin = {
  id: 1,
  name: 'Admin Local',
  email: 'admin@local.test',
  role: 'SUPER_ADMIN',
  createdAt: '2026-01-01T12:00:00.000Z',
} as const

beforeEach(() => {
  // gcTime: Infinity leaves no garbage-collection timer running after the test.
  client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: Infinity } } })
  useSession.setState({ session: null })
  useLastEmail.setState({ email: '' })
  fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(createFakeApi(API_URL))
})

afterEach(() => fetchSpy.mockRestore())

const calledPaths = () => fetchSpy.mock.calls.map(([url]) => String(url).slice(API_URL.length))

describe('useLogin', () => {
  it('logs in against the API, opens a Live session and saves the typed email', async () => {
    const { result } = await renderHook(() => useLogin(), { wrapper })

    await act(() => result.current.mutateAsync({ email: 'admin@local.test', password: 'admin123' }))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(calledPaths()).toEqual(['/auth/login', '/me'])
    expect(useSession.getState().session).toEqual({
      token: expect.any(String),
      live: true,
      user: admin,
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

  it('shows NETWORK when the API is unreachable', async () => {
    fetchSpy.mockRejectedValue(new TypeError('Network request failed'))
    const { result } = await renderHook(() => useLogin(), { wrapper })

    await act(async () => {
      result.current.mutate({ email: 'admin@local.test', password: 'admin123' })
    })

    await waitFor(() => expect(result.current.error).toMatchObject({ code: 'NETWORK' }))
    expect(useSession.getState().session).toBeNull()
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
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe('checkSession (background GET /me on startup)', () => {
  const saved = (token: string): Session => ({
    token,
    live: true,
    user: { ...admin, name: 'Nome Antigo' },
  })

  it('replaces the stored User with the fresh data', async () => {
    useSession.setState({ session: saved('mock-token-1') })

    await checkSession()

    expect(calledPaths()).toEqual(['/me'])
    expect(useSession.getState().session).toEqual({ ...saved('mock-token-1'), user: admin })
  })

  it('returns to Login when the API answers UNAUTHENTICATED', async () => {
    useSession.setState({ session: saved('revoked') })

    await checkSession()

    expect(useSession.getState().session).toBeNull()
  })

  it('keeps the saved Session when the API is unreachable', async () => {
    fetchSpy.mockRejectedValue(new TypeError('Network request failed'))
    useSession.setState({ session: saved('mock-token-1') })

    await checkSession()

    expect(useSession.getState().session).toEqual(saved('mock-token-1'))
  })

  it('keeps the saved Session on any other error', async () => {
    fetchSpy.mockResolvedValue(new Response('oops', { status: 500 }))
    useSession.setState({ session: saved('mock-token-1') })

    await checkSession()

    expect(useSession.getState().session).toEqual(saved('mock-token-1'))
  })

  it('skips Demo mode', async () => {
    useSession.setState({ session: { ...saved('mock-token-1'), live: false } })

    await checkSession()

    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
