import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react-native'

import { eventsKey } from '@/shared/lib/query-keys'
import { mockTokenFor } from '@/shared/mock-backend'
import { useSession, type User } from '@/shared/session'

import { HomeScreen } from '../components/home-screen'

const mockNavigate = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate }),
  useFocusEffect: jest.fn(),
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

const user = (id: number, name: string, role: User['role'] = 'USER'): User => ({
  id,
  name,
  email: 'membro@example.com',
  role,
  createdAt: '2026-09-27T22:58:10.000Z',
})

/** Início in Demo mode, as `who`; `events` seeds the Events list instead of the mock backend. */
async function renderHome(who: User, events?: unknown[]) {
  useSession.setState({ session: { token: mockTokenFor(who), user: who, live: false } })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: Infinity } },
  })
  if (events) client.setQueryData(eventsKey, events)
  await render(
    <QueryClientProvider client={client}>
      <HomeScreen />
    </QueryClientProvider>,
  )
}

beforeEach(() => mockNavigate.mockClear())

describe('HomeScreen', () => {
  it('greets the member by first name and shows their numbers', async () => {
    await renderHome(user(7, 'Cláudia Lima'))

    expect(screen.getByText('Olá, Cláudia')).toBeOnTheScreen()
    expect(
      await screen.findByRole('button', { name: '4 eventos ativos, 1 arquivado' }),
    ).toBeOnTheScreen()
  })

  it('opens Eventos from a card', async () => {
    await renderHome(user(7, 'Cláudia Lima'))

    await fireEvent.press(await screen.findByRole('button', { name: /confirmados/ }))

    expect(mockNavigate).toHaveBeenCalledWith('/events')
  })

  it('tells a member of no Event that a Super admin must add them', async () => {
    await renderHome(user(9, 'Rita Campos'), [])

    expect(screen.getByText('Nenhum evento ainda.')).toBeOnTheScreen()
    expect(screen.getByText('Um Super admin precisa te adicionar como membro.')).toBeOnTheScreen()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('tells a Super admin that no Event was created yet', async () => {
    await renderHome(user(1, 'Admin Local', 'SUPER_ADMIN'), [])

    expect(screen.getByText('Nenhum evento foi criado.')).toBeOnTheScreen()
  })
})
