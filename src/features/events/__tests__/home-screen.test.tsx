import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen } from '@testing-library/react-native'

import {
  applyStatusChange,
  undoStatusChange,
  type StatusChange,
} from '@/shared/domain/contributions'
import { eventsKey } from '@/shared/lib/query-keys'
import { mockTokenFor } from '@/shared/mock-backend'
import { SAMPLE_DATE } from '@/shared/mock-backend/data'
import { useSession, type User } from '@/shared/session'

import { HomeScreen } from '../components/home-screen'
import type { Event } from '../schemas'
import { pinClock } from './pin-clock'

const mockNavigate = jest.fn()
const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate, push: mockPush }),
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
  return client
}

pinClock(SAMPLE_DATE)

beforeEach(() => {
  mockNavigate.mockClear()
  mockPush.mockClear()
})

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

  describe('pending work', () => {
    it('shows the Super admin every Event to verify', async () => {
      await renderHome(user(1, 'Admin Local', 'SUPER_ADMIN'))

      expect(
        await screen.findByRole('button', { name: '8 contribuições para conferir' }),
      ).toBeOnTheScreen()
      expect(screen.getByRole('button', { name: 'Chá da Júlia, 2 pendentes' })).toBeOnTheScreen()
    })

    it("leaves out of Cláudia Lima's the Event she is only Viewer of", async () => {
      await renderHome(user(7, 'Cláudia Lima'))

      expect(
        await screen.findByRole('button', { name: '6 contribuições para conferir' }),
      ).toBeOnTheScreen()
      expect(screen.getByRole('button', { name: 'Ana & Rafael, 3 pendentes' })).toBeOnTheScreen()
      expect(screen.getByRole('button', { name: 'Marcos, 40, 1 pendente' })).toBeOnTheScreen()
      expect(screen.queryByRole('button', { name: /^Chá da Júlia/ })).toBeNull()
    })

    it('hides both from Otávio Kern, Manager of an archived Event only', async () => {
      await renderHome(user(8, 'Otávio Kern'))

      expect(await screen.findByRole('button', { name: /^0 eventos ativos/ })).toBeOnTheScreen()
      expect(screen.queryByText('PARA CONFERIR')).toBeNull()
      expect(screen.queryByText('CONFERIR POR EVENTO')).toBeNull()
    })

    it('opens the tapped Event on Conferir', async () => {
      await renderHome(user(7, 'Cláudia Lima'))

      await fireEvent.press(await screen.findByRole('button', { name: /^Marcos, 40/ }))

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/events/[id]',
        params: { id: 14, tab: 'contributions' },
      })
    })

    it('follows a Verification at once, and its rollback', async () => {
      const client = await renderHome(user(7, 'Cláudia Lima'))
      await screen.findByRole('button', { name: '6 contribuições para conferir' })
      // What useVerification does to the Events list: Marcos, 40's only PAID one is verified.
      const change: StatusChange = { contributionId: 1, amount: 100, from: 'PAID', to: 'VERIFIED' }
      const patch = (status: StatusChange) =>
        act(async () => {
          client.setQueryData<readonly Event[]>(eventsKey, (events) => {
            const caches = { events, event: undefined, contributions: undefined }
            return applyStatusChange(caches, 14, status).events
          })
        })

      await patch(change)
      expect(
        screen.getByRole('button', { name: '5 contribuições para conferir' }),
      ).toBeOnTheScreen()
      expect(screen.queryByText('Marcos, 40')).toBeNull()

      await patch(undoStatusChange(change))
      expect(
        screen.getByRole('button', { name: '6 contribuições para conferir' }),
      ).toBeOnTheScreen()
      expect(screen.getByRole('button', { name: 'Marcos, 40, 1 pendente' })).toBeOnTheScreen()
    })
  })

  describe('happening and upcoming', () => {
    it("shows Cláudia's birthday happening and Chá da Júlia next, stacked over Marcos, 40", async () => {
      await renderHome(user(7, 'Cláudia Lima'))

      expect(
        await screen.findByRole('button', { name: 'Acontecendo agora: Aniversário da Cláudia' }),
      ).toBeOnTheScreen()
      expect(screen.getByText('agora')).toBeOnTheScreen()
      expect(
        screen.getByRole('button', {
          name: 'Próximo evento: Chá da Júlia, em 10 dias. Mais 1 nos próximos 30 dias',
        }),
      ).toBeOnTheScreen()
    })

    it('puts them around the grid, above the pending work', async () => {
      await renderHome(user(7, 'Cláudia Lima'))
      await screen.findByText('ACONTECENDO AGORA')

      const titles = [
        'ACONTECENDO AGORA',
        'EVENTOS ATIVOS',
        'PRÓXIMOS EVENTOS',
        'PARA CONFERIR',
        'CONFERIR POR EVENTO',
      ]
      const found = screen.getAllByText(new RegExp(`^(${titles.join('|')})$`))
      expect(found).toHaveLength(titles.length)
      found.forEach((element, index) => expect(element).toHaveTextContent(titles[index]))
    })

    it('opens Acontecendo agora on Resumo', async () => {
      await renderHome(user(7, 'Cláudia Lima'))

      await fireEvent.press(await screen.findByRole('button', { name: /^Acontecendo agora/ }))

      expect(mockPush).toHaveBeenCalledWith({ pathname: '/events/[id]', params: { id: 17 } })
    })

    it('expands Próximos eventos into the Events within 30 days, each opening on Resumo', async () => {
      await renderHome(user(7, 'Cláudia Lima'))

      await fireEvent.press(await screen.findByRole('button', { name: /^Próximo evento/ }))
      expect(mockPush).not.toHaveBeenCalled()
      expect(screen.getByText('PRÓXIMOS 30 DIAS')).toBeOnTheScreen()
      expect(screen.getByRole('button', { name: 'Marcos, 40, em 23 dias' })).toBeOnTheScreen()
      await fireEvent.press(screen.getByRole('button', { name: 'Chá da Júlia, em 10 dias' }))

      expect(mockPush).toHaveBeenCalledWith({ pathname: '/events/[id]', params: { id: 15 } })
      expect(screen.queryByText('PRÓXIMOS 30 DIAS')).toBeNull()
    })

    it('hides both when no active Event is happening or to come', async () => {
      await renderHome(user(8, 'Otávio Kern'))

      expect(await screen.findByRole('button', { name: /^0 eventos ativos/ })).toBeOnTheScreen()
      expect(screen.queryByText('ACONTECENDO AGORA')).toBeNull()
      expect(screen.queryByText('PRÓXIMOS EVENTOS')).toBeNull()
    })
  })
})
