import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react-native'

import { useSession } from '@/shared/session'
import { fakeClerk } from '@/shared/session/__tests__/fake-clerk'

import { LoginScreen } from '../components/login-screen'

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }))
jest.mock('expo-auth-session', () => ({ makeRedirectUri: () => 'events-expo://sso-callback' }))

async function renderLogin() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false, gcTime: Infinity } },
  })
  await render(
    <QueryClientProvider client={client}>
      <LoginScreen />
    </QueryClientProvider>,
  )
}

async function signInWith(email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText('E-mail'), email)
  await fireEvent.changeText(screen.getByLabelText('Senha'), password)
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }))
}

beforeEach(() => useSession.setState({ session: null, endedBecause: null }))

describe('LoginScreen', () => {
  it('says there is no open sign-up', async () => {
    await renderLogin()

    expect(screen.getByText(/Quem convida é a produção do seu Group/)).toBeOnTheScreen()
    expect(screen.queryByRole('button', { name: /criar conta|cadastr/i })).toBeNull()
  })

  it('tells someone with another email to use the one the invitation went to', async () => {
    fakeClerk.addAccount('outra.pessoa@gmail.com', 'qualquer-senha')
    await renderLogin()

    await signInWith('outra.pessoa@gmail.com', 'qualquer-senha')

    expect(
      await screen.findByText(
        'Este e-mail não recebeu convite. Entre com o e-mail do convite da produção do seu Group.',
      ),
    ).toBeOnTheScreen()
  })

  it('says access was taken away when the API ended the Session of a Deactivated user', async () => {
    useSession.setState({ endedBecause: 'USER_DEACTIVATED' })

    await renderLogin()

    expect(
      screen.getByText('Seu acesso foi retirado. Se for engano, fale com a produção do seu Group.'),
    ).toBeOnTheScreen()
  })

  it('asks for the emailed code on a device Clerk does not trust yet', async () => {
    fakeClerk.addAccount('bruno.reis@example.com', 'senha-forte-1')
    fakeClerk.requireClientTrust = true
    await renderLogin()

    await signInWith('bruno.reis@example.com', 'senha-forte-1')

    expect(await screen.findByLabelText('Código')).toBeOnTheScreen()
    expect(screen.getByText(/Enviamos um código para bruno.reis@example.com/)).toBeOnTheScreen()
  })

  it('enters Demo mode as the sample Viewer in a development build', async () => {
    await renderLogin()

    await fireEvent.press(screen.getByRole('button', { name: 'Viewer' }))

    expect(useSession.getState().session).toMatchObject({ live: false, user: { id: 5 } })
  })
})
