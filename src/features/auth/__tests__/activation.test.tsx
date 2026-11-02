import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'

import { API_URL } from '@/shared/lib/api-client'
import { createFakeApi } from '@/shared/mock-backend/fake-api'
import { fakeClerk } from '@/shared/session/__tests__/fake-clerk'
import { useSession } from '@/shared/session'

import { readActivationLink } from '../activation-link'
import { useActivation } from '../hooks/use-activation'

// The redirect URL needs the app's manifest, which tests don't have.
jest.mock('expo-auth-session', () => ({ makeRedirectUri: () => 'events-expo://' }))

let client: QueryClient
let fetchSpy: jest.SpyInstance

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

/** Lu Andrade's Activation link, as Clerk hands it to the app once she opens it. */
function luLink(extra: Record<string, string> = {}) {
  const ticket = fakeClerk.invite('lu.andrade@example.com')
  return readActivationLink({ __clerk_ticket: ticket, __clerk_status: 'sign_up', ...extra })
}

async function renderActivation(link = luLink()) {
  const rendered = await renderHook(() => useActivation(link), { wrapper })
  await waitFor(() => expect(rendered.result.current.invitation.isPending).toBe(false))
  return rendered
}

beforeEach(() => {
  client = new QueryClient({
    defaultOptions: {
      // The hook's result is read after rendering, which TanStack's tracked props don't see.
      queries: { retry: false, notifyOnChangeProps: 'all' },
      mutations: { retry: false, gcTime: Infinity },
    },
  })
  useSession.setState({ session: null, endedBecause: null })
  // `auth` is live: `GET /me` goes to the fake API, over the mock backend.
  fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(createFakeApi({ baseUrl: API_URL }))
})

afterEach(() => fetchSpy.mockRestore())

describe('useActivation', () => {
  it("reads the invitation's email from Clerk", async () => {
    const { result } = await renderActivation()

    expect(result.current.invitation.data).toEqual({ email: 'lu.andrade@example.com' })
  })

  it('creates the password, which activates the account and opens a Live session', async () => {
    const { result } = await renderActivation()

    await act(() => result.current.activate.mutateAsync('minha-senha-1'))

    expect(fakeClerk.hasAccount('lu.andrade@example.com')).toBe(true)
    expect(useSession.getState().session).toMatchObject({ live: true, user: { id: 5 } })
  })

  it("refuses a weak password with Clerk's code and opens nothing", async () => {
    const { result } = await renderActivation()

    await act(async () => {
      result.current.activate.mutate('curta')
    })

    await waitFor(() =>
      expect(result.current.activate.error).toMatchObject({
        code: 'form_password_length_too_short',
      }),
    )
    expect(useSession.getState().session).toBeNull()
  })

  it.each(['google', 'apple'] as const)(
    'activates with %s of the invitation email',
    async (provider) => {
      fakeClerk.ssoEmail = 'lu.andrade@example.com'
      const { result } = await renderActivation()

      await act(() => result.current.sso.mutateAsync(provider))

      expect(useSession.getState().session).toMatchObject({ live: true, user: { id: 5 } })
    },
  )

  it('refuses Google or Apple of another email, even one with an account, and signs out', async () => {
    fakeClerk.ssoEmail = 'bruno.reis@example.com'
    const { result } = await renderActivation()

    await act(async () => {
      result.current.sso.mutate('google')
    })

    await waitFor(() =>
      expect(result.current.sso.error).toMatchObject({ code: 'activation_other_email' }),
    )
    expect(fakeClerk.session).toBeNull()
    expect(useSession.getState().session).toBeNull()
  })

  it('compares the emails ignoring case', async () => {
    fakeClerk.ssoEmail = 'Lu.Andrade@example.com'
    const { result } = await renderActivation()

    await act(() => result.current.sso.mutateAsync('apple'))

    expect(result.current.sso.data).toBe('signed-in')
  })

  it('says a revoked link no longer works', async () => {
    const link = luLink()
    fakeClerk.revokeInvitation(link.ticket!)

    const { result } = await renderActivation(link)

    expect(result.current.invitation.error).toMatchObject({ code: 'ticket_invalid_code' })
  })

  it('says a used link no longer works', async () => {
    const link = luLink()
    fakeClerk.addAccount('lu.andrade@example.com', 'ja-ativou-1')

    const { result } = await renderActivation(link)

    expect(result.current.invitation.error).toMatchObject({ code: 'form_identifier_exists' })
  })

  it.each([
    ['Clerk already has the account', { __clerk_ticket: 'tkt_9', __clerk_status: 'sign_in' }],
    ['the link came without a ticket', {}],
  ])('says the link no longer works when %s', async (_, params) => {
    const { result } = await renderActivation(readActivationLink(params))

    expect(result.current.invitation.error).toMatchObject({ code: 'activation_link_gone' })
  })

  it('signs out of a Clerk session left behind before reading the ticket', async () => {
    fakeClerk.restore('bruno.reis@example.com')

    const { result } = await renderActivation()

    expect(result.current.invitation.data).toEqual({ email: 'lu.andrade@example.com' })
    expect(fakeClerk.signOutCount).toBe(1)
  })
})
