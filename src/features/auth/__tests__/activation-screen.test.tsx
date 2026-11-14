import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'

import { API_URL } from '@/shared/lib/api-client'
import { createFakeApi } from '@/shared/mock-backend/fake-api'
import { useSession } from '@/shared/session'
import { fakeClerk } from '@/shared/session/__tests__/fake-clerk'

import { readActivationLink } from '../activation-link'
import { ActivationScreen } from '../components/activation-screen'

const mockReplace = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }))
jest.mock('expo-auth-session', () => ({ makeRedirectUri: () => 'events-expo://' }))

const LU = 'lu.andrade@example.com'

async function renderActivation(params: Record<string, string>) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false, gcTime: Infinity } },
  })
  await render(
    <QueryClientProvider client={client}>
      <ActivationScreen link={readActivationLink(params)} withClerk />
    </QueryClientProvider>,
  )
}

/** Lu's link as the events-api builds it, with the ticket Clerk appends. */
const luParams = (ticket: string) => ({
  __clerk_ticket: ticket,
  __clerk_status: 'sign_up',
  inviter: 'Bruno Reis',
  group: 'Vocal Livre',
  name: 'Lu Andrade',
})

let fetchSpy: jest.SpyInstance

beforeEach(() => {
  mockReplace.mockClear()
  useSession.setState({ session: null, endedBecause: null })
  // `auth` is live: `GET /me` goes to the fake API, over the mock backend.
  fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(createFakeApi({ baseUrl: API_URL }))
})

afterEach(() => fetchSpy.mockRestore())

describe('ActivationScreen', () => {
  it('says who invited to which Group, and locks the invitation email', async () => {
    await renderActivation(luParams(fakeClerk.invite(LU)))

    expect(
      screen.getByRole('header', { name: /Bruno te convidou para o Vocal Livre/ }),
    ).toBeOnTheScreen()
    expect(await screen.findByText(`${LU} · do convite`)).toBeOnTheScreen()
    expect(screen.queryByLabelText('E-mail')).toBeNull()
  })

  it('creates the password and enters with it', async () => {
    await renderActivation(luParams(fakeClerk.invite(LU)))
    await screen.findByText(`${LU} · do convite`)

    await fireEvent.changeText(screen.getByLabelText('Crie uma senha'), 'minha-senha-1')
    await fireEvent.press(screen.getByRole('button', { name: 'Ativar e entrar' }))

    await waitFor(() =>
      expect(useSession.getState().session).toMatchObject({ live: true, user: { id: 5 } }),
    )
  })

  it('refuses Google of another email naming the invitation one', async () => {
    fakeClerk.ssoEmail = 'lu.pessoal@gmail.com'
    fakeClerk.ssoSignUpRestricted = true
    await renderActivation(luParams(fakeClerk.invite(LU)))
    await screen.findByText(`${LU} · do convite`)

    await fireEvent.press(screen.getByRole('button', { name: 'Google' }))

    expect(
      await screen.findByText(`Essa conta não é do e-mail do convite. Entre com ${LU}.`),
    ).toBeOnTheScreen()
    expect(useSession.getState().session).toBeNull()
  })

  it('asks for a new link when this one was revoked, and goes to the login', async () => {
    const ticket = fakeClerk.invite(LU)
    fakeClerk.revokeInvitation(ticket)
    await renderActivation(luParams(ticket))

    expect(
      await screen.findByText(
        'Este convite já foi usado ou não vale mais. Se você ainda não entrou, peça um novo à produção do seu Group.',
      ),
    ).toBeOnTheScreen()
    expect(screen.queryByLabelText('Crie uma senha')).toBeNull()

    await fireEvent.press(screen.getByRole('button', { name: 'Ir para o login' }))
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('falls back to a plain title and the email alone without what the events-api sends', async () => {
    await renderActivation({ __clerk_ticket: fakeClerk.invite(LU) })

    expect(screen.getByRole('header', { name: /Ative sua conta/ })).toBeOnTheScreen()
    expect(await screen.findByText(LU)).toBeOnTheScreen()
    expect(screen.getByText('do convite')).toBeOnTheScreen()
  })

  it('says an invitation cannot be accepted in a Demo build, pointing to Demo mode', async () => {
    await render(
      <QueryClientProvider client={new QueryClient()}>
        <ActivationScreen link={readActivationLink(luParams('ticket'))} withClerk demoBuild />
      </QueryClientProvider>,
    )

    expect(screen.getByText(/preview do app/)).toBeOnTheScreen()
    expect(screen.queryByLabelText('Crie uma senha')).toBeNull()
  })
})
