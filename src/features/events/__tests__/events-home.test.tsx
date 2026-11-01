import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, within } from '@testing-library/react-native'

import { mockBackend } from '@/shared/mock-backend'
import { useSession, userSchema } from '@/shared/session'

import { EventsHome } from '../components/events-home'
import type { GroupRole } from '@/shared/domain/group-role'

const VIEWER: GroupRole = 'VIEWER'
const OWNER: GroupRole = 'OWNER'

async function renderHome(role: GroupRole, userId = 5, onRefresh?: () => Promise<unknown>) {
  const user = userSchema.parse(mockBackend.user(userId))
  useSession.setState({ session: { id: `demo-${userId}`, user, live: false } })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  await render(
    <QueryClientProvider client={client}>
      <EventsHome groupId={1} role={role} groupSwitcher={null} onRefresh={onRefresh} />
    </QueryClientProvider>,
  )
  await screen.findByText('Saída Manaus')
}

const row = (name: string) => screen.getByLabelText(new RegExp(`^${name},`))

beforeEach(() => {
  // Saturday, 31 Oct 2026, morning in Vitória.
  jest.useFakeTimers({ now: new Date('2026-10-31T09:00:00-03:00'), advanceTimers: true })
})

afterEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
})

describe('EventsHome', () => {
  it('greets the person with the date', async () => {
    await renderHome(VIEWER)

    expect(screen.getByText(/^Olá, Lu/)).toBeOnTheScreen()
    expect(screen.getByText('sáb., 31 de out.')).toBeOnTheScreen()
  })

  it("lists the Group's coming Events with their states", async () => {
    await renderHome(VIEWER)

    expect(screen.queryByText('Gravação do clipe')).toBeNull()
    expect(within(row('Ensaio geral')).getByText('VOCÊ VAI')).toBeOnTheScreen()
    expect(
      within(row('Ensaio da Banda')).getByText('dom. · Estúdio · você não vai'),
    ).toBeOnTheScreen()
    expect(within(row('Festival de Verão')).getByText('CANCELADO')).toBeOnTheScreen()
    expect(within(row('Turnê Minas')).queryByText('RASCUNHO')).toBeNull()
  })

  it('shows the Owner the RASCUNHO of a Draft', async () => {
    await renderHome(OWNER, 2)

    expect(within(row('Turnê Minas')).getByText('RASCUNHO')).toBeOnTheScreen()
  })

  it('switches between Próximos, Que eu vou and Passados', async () => {
    await renderHome(VIEWER)

    await fireEvent.press(screen.getByRole('tab', { name: 'Que eu vou' }))
    expect(screen.queryByText('Ensaio da Banda')).toBeNull()
    expect(screen.getByText('Saída Manaus')).toBeOnTheScreen()

    await fireEvent.press(screen.getByRole('tab', { name: 'Passados' }))
    expect(screen.getByText('Gravação do clipe')).toBeOnTheScreen()
    expect(screen.queryByText('Saída Manaus')).toBeNull()
  })

  it('searches the Events by name or place', async () => {
    await renderHome(VIEWER)

    await fireEvent.changeText(screen.getByLabelText('Buscar evento'), 'manaus')

    expect(screen.getByText('Saída Manaus')).toBeOnTheScreen()
    expect(screen.queryByText('Ensaio geral')).toBeNull()

    await fireEvent.changeText(screen.getByLabelText('Buscar evento'), 'lisboa')
    expect(screen.getByText('Nenhum Event encontrado para “lisboa”.')).toBeOnTheScreen()
  })

  it('pulling down refetches the Events and refreshes the Group around them', async () => {
    const onRefresh = jest.fn(async () => {})
    await renderHome(VIEWER, 5, onRefresh)
    const listEvents = jest.spyOn(mockBackend, 'groupEvents')

    await act(() => screen.getByTestId('home-list').props.refreshControl.props.onRefresh())

    expect(listEvents).toHaveBeenCalledTimes(1)
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })
})
