import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'

import { createHttpClient } from '@/shared/lib/http'
import { BASE_URL } from '@/shared/mock-backend/fake-api'
import { FAKE_CODE, fakeClerk } from '@/shared/session/__tests__/fake-clerk'
import { useSession, type Session, type User } from '@/shared/session'

import { createHttpAuthRepository } from '../api'
import { useEnterDemo } from '../hooks/use-enter-demo'
import { usePasswordReset } from '../hooks/use-password-reset'
import { usePasswordSignIn, useSignInCode } from '../hooks/use-password-sign-in'
import { checkSession } from '../hooks/use-session-check'
import { useSignOut } from '../hooks/use-sign-out'
import { useSsoSignIn } from '../hooks/use-sso-sign-in'

// The redirect URL needs the app's manifest, which tests don't have.
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: ({ scheme, path }: { scheme: string; path: string }) => `${scheme}://${path}`,
}))

let client: QueryClient
let fetchSpy: jest.SpyInstance

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const bruno: User = {
  id: 2,
  name: 'Bruno Reis',
  email: 'bruno.reis@example.com',
  phone: '+5527999990002',
  isSuperAdmin: false,
  memberships: [{ groupId: 1, groupName: 'Vocal Livre', role: 'OWNER' }],
}

const credentials = { email: 'bruno.reis@example.com', password: 'senha-forte-1' }

beforeEach(() => {
  // gcTime: Infinity leaves no garbage-collection timer running after the test.
  client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: Infinity } } })
  useSession.setState({ session: null, endedBecause: null })
  fakeClerk.addAccount(credentials.email, credentials.password)
  // `auth` is not live yet: nothing here may reach the network.
  fetchSpy = jest.spyOn(globalThis, 'fetch')
})

afterEach(() => {
  expect(fetchSpy).not.toHaveBeenCalled()
  fetchSpy.mockRestore()
})

describe('usePasswordSignIn', () => {
  it('signs in to Clerk, reads the User and opens a Live session', async () => {
    const { result } = await renderHook(() => usePasswordSignIn(), { wrapper })

    await act(() => result.current.mutateAsync(credentials))

    expect(result.current.data).toBe('signed-in')
    expect(useSession.getState().session).toEqual({ id: 'sess_1', live: true, user: bruno })
  })

  it('exposes the wrong password and opens nothing', async () => {
    const { result } = await renderHook(() => usePasswordSignIn(), { wrapper })

    await act(async () => {
      result.current.mutate({ ...credentials, password: 'errada' })
    })

    await waitFor(() =>
      expect(result.current.error).toMatchObject({ code: 'form_password_incorrect' }),
    )
    expect(useSession.getState().session).toBeNull()
    expect(fakeClerk.session).toBeNull()
  })

  it('refuses an email no User has with USER_NOT_INVITED and signs out of Clerk', async () => {
    fakeClerk.addAccount('outra.pessoa@gmail.com', 'qualquer-senha')
    const { result } = await renderHook(() => usePasswordSignIn(), { wrapper })

    await act(async () => {
      result.current.mutate({ email: 'outra.pessoa@gmail.com', password: 'qualquer-senha' })
    })

    await waitFor(() => expect(result.current.error).toMatchObject({ code: 'USER_NOT_INVITED' }))
    expect(useSession.getState().session).toBeNull()
    expect(fakeClerk.session).toBeNull()
  })

  it('refuses a Deactivated user and signs out of Clerk', async () => {
    fakeClerk.addAccount('carla.dias@example.com', 'senha-da-carla')
    const { result } = await renderHook(() => usePasswordSignIn(), { wrapper })

    await act(async () => {
      result.current.mutate({ email: 'carla.dias@example.com', password: 'senha-da-carla' })
    })

    await waitFor(() => expect(result.current.error).toMatchObject({ code: 'USER_DEACTIVATED' }))
    expect(fakeClerk.session).toBeNull()
  })

  it('clears a Clerk session left behind before signing in again', async () => {
    fakeClerk.restore('jacque.moreira@example.com')
    const { result } = await renderHook(() => usePasswordSignIn(), { wrapper })

    await act(() => result.current.mutateAsync(credentials))

    expect(useSession.getState().session).toMatchObject({ user: { id: 2 } })
  })

  it('asks for the emailed code on an untrusted device, then opens the Session', async () => {
    fakeClerk.requireClientTrust = true
    const signIn = await renderHook(() => usePasswordSignIn(), { wrapper })
    const code = await renderHook(() => useSignInCode(), { wrapper })

    await act(() => signIn.result.current.mutateAsync(credentials))
    expect(signIn.result.current.data).toBe('needs-code')
    expect(useSession.getState().session).toBeNull()

    await act(async () => {
      code.result.current.mutate('000000')
    })
    await waitFor(() =>
      expect(code.result.current.error).toMatchObject({ code: 'form_code_incorrect' }),
    )

    await act(() => code.result.current.mutateAsync(FAKE_CODE))
    expect(useSession.getState().session).toMatchObject({ live: true, user: bruno })
  })
})

describe('useSsoSignIn', () => {
  it.each(['google', 'apple'] as const)(
    'opens a Live session after %s answers with the invited email',
    async (provider) => {
      fakeClerk.ssoEmail = 'lu.andrade@example.com'
      const { result } = await renderHook(() => useSsoSignIn(), { wrapper })

      await act(() => result.current.mutateAsync(provider))

      expect(result.current.data).toBe('signed-in')
      expect(useSession.getState().session).toMatchObject({ live: true, user: { id: 5 } })
    },
  )

  it('refuses an account of another email with USER_NOT_INVITED and signs out of Clerk', async () => {
    fakeClerk.ssoEmail = 'lu.pessoal@gmail.com'
    const { result } = await renderHook(() => useSsoSignIn(), { wrapper })

    await act(async () => {
      result.current.mutate('google')
    })

    await waitFor(() => expect(result.current.error).toMatchObject({ code: 'USER_NOT_INVITED' }))
    expect(fakeClerk.session).toBeNull()
    expect(useSession.getState().session).toBeNull()
  })

  it('does nothing when the person closes the browser', async () => {
    const { result } = await renderHook(() => useSsoSignIn(), { wrapper })

    await act(() => result.current.mutateAsync('apple'))

    expect(result.current.data).toBe('cancelled')
    expect(useSession.getState().session).toBeNull()
  })
})

describe('usePasswordReset', () => {
  it("resets the password with Clerk's emailed code and signs in with the new one", async () => {
    const { result } = await renderHook(() => usePasswordReset(), { wrapper })

    await act(() => result.current.sendCode.mutateAsync(credentials.email))
    await act(() => result.current.verifyCode.mutateAsync(FAKE_CODE))
    await act(() => result.current.setPassword.mutateAsync('nova-senha-forte'))

    expect(useSession.getState().session).toMatchObject({ live: true, user: bruno })
  })

  it('rejects a wrong code without moving on', async () => {
    const { result } = await renderHook(() => usePasswordReset(), { wrapper })
    await act(() => result.current.sendCode.mutateAsync(credentials.email))

    await act(async () => {
      result.current.verifyCode.mutate('111111')
    })

    await waitFor(() =>
      expect(result.current.verifyCode.error).toMatchObject({ code: 'form_code_incorrect' }),
    )
  })
})

describe('useEnterDemo', () => {
  it.each([
    ['OWNER', { id: 2, name: 'Bruno Reis', isSuperAdmin: false }],
    ['VIEWER', { id: 5, name: 'Lu Andrade', isSuperAdmin: false }],
    ['SUPER_ADMIN', { id: 1, name: 'Admin Local', isSuperAdmin: true }],
  ] as const)(
    'opens a Demo mode Session as the sample %s, without Clerk',
    async (account, user) => {
      const { result } = await renderHook(() => useEnterDemo(), { wrapper })

      await act(() => result.current(account))

      expect(useSession.getState().session).toMatchObject({ live: false, user })
      expect(fakeClerk.session).toBeNull()
    },
  )
})

describe('useSignOut', () => {
  it('ends the Session', async () => {
    useSession.setState({ session: { id: 'sess_1', live: true, user: bruno } })
    const { result } = await renderHook(() => useSignOut(), { wrapper })

    await act(() => result.current())

    expect(useSession.getState().session).toBeNull()
    expect(useSession.getState().endedBecause).toBeNull()
  })
})

describe('checkSession (background GET /me on startup)', () => {
  const saved: Session = { id: 'sess_1', live: true, user: { ...bruno, name: 'Nome Antigo' } }

  it('replaces the stored User with the fresh data', async () => {
    fakeClerk.restore(bruno.email)
    useSession.setState({ session: saved })

    await checkSession()

    expect(useSession.getState().session).toEqual({ ...saved, user: bruno })
  })

  it('returns to the login when Clerk no longer has the session (UNAUTHENTICATED)', async () => {
    useSession.setState({ session: saved })

    await checkSession()

    expect(useSession.getState().session).toBeNull()
    expect(useSession.getState().endedBecause).toBe('UNAUTHENTICATED')
  })

  it('returns to the login saying access was taken away from a Deactivated user', async () => {
    fakeClerk.restore('carla.dias@example.com')
    useSession.setState({ session: { ...saved, user: { ...saved.user, id: 6 } } })

    await checkSession()

    expect(useSession.getState().session).toBeNull()
    expect(useSession.getState().endedBecause).toBe('USER_DEACTIVATED')
  })

  it.each([
    ['unreachable', async () => Promise.reject(new TypeError('Network request failed'))],
    ['broken', async () => new Response('oops', { status: 500 })],
  ])('keeps the saved Session when the API is %s', async (_, fetch) => {
    useSession.setState({ session: saved })
    const http = createHttpAuthRepository(
      createHttpClient({ baseUrl: BASE_URL, getToken: async () => null, fetch }),
    )

    await checkSession(http)

    expect(useSession.getState().session).toEqual(saved)
  })

  it('skips Demo mode', async () => {
    const demo = { ...saved, id: 'demo-2', live: false }
    useSession.setState({ session: demo })

    await checkSession()

    expect(useSession.getState().session).toEqual(demo)
  })
})
