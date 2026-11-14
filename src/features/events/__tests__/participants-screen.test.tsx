import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native'

import { mockBackend } from '@/shared/mock-backend'
import { useSession, userSchema } from '@/shared/session'

import { ParticipantsScreen } from '../components/participants-screen'

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() }
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }))

const OWNER = 2
const VIEWER = 5

/** A Demo mode Session of a sample User: `events` answers from the shared mock backend. */
async function renderAs(userId: number, eventId: number) {
  const user = userSchema.parse(mockBackend.user(userId))
  useSession.setState({ session: { id: `demo-${userId}`, user, live: false } })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  await render(
    <QueryClientProvider client={client}>
      <ParticipantsScreen eventId={eventId} />
    </QueryClientProvider>,
  )
}

const person = (name: RegExp | string) => screen.findByRole('checkbox', { name })
const checked = (element: { props: { accessibilityState?: { checked?: boolean } } }) =>
  element.props.accessibilityState?.checked

describe('ParticipantsScreen, for an Owner', () => {
  it('lists the whole Group, each marked, with how many go', async () => {
    // Saída Manaus: Bruno, Matias, Jacque and Lu go; Tiago does not.
    await renderAs(OWNER, 3)

    expect(checked(await person('Jacque Moreira'))).toBe(true)
    expect(checked(await person('Tiago Souza'))).toBe(false)
    expect(screen.getByText('4 de 5')).toBeOnTheScreen()
    expect(screen.getByText('Produção · Owner')).toBeOnTheScreen()
    expect(
      screen.getByText(
        'Quem sai deixa de ver os itens; nos Fields de pessoas fica marcado como fora do Event.',
      ),
    ).toBeOnTheScreen()
  })

  it('unmarks someone, and the count follows', async () => {
    await renderAs(OWNER, 3)

    await fireEvent.press(await person('Jacque Moreira'))

    await waitFor(async () => expect(checked(await person('Jacque Moreira'))).toBe(false))
    expect(screen.getByText('3 de 5')).toBeOnTheScreen()
  })

  it('marks someone who was not going', async () => {
    // Ensaio geral: everyone but Tiago goes.
    await renderAs(OWNER, 6)

    await fireEvent.press(await person('Tiago Souza'))

    await waitFor(async () => expect(checked(await person('Tiago Souza'))).toBe(true))
    expect(screen.getByText('5 de 5')).toBeOnTheScreen()
  })

  it('marks a whole Team with its shortcut, then shows it done', async () => {
    // Turnê Minas: nobody goes yet.
    await renderAs(OWNER, 2)
    await person('Matias Costa')

    await fireEvent.press(screen.getByRole('button', { name: 'Marcar Team Cantores' }))

    await waitFor(() => expect(screen.getByText('2 de 5')).toBeOnTheScreen())
    expect(checked(await person('Lu Andrade'))).toBe(true)
    expect(checked(await person('Jacque Moreira'))).toBe(true)
    expect(screen.getByRole('button', { name: 'Cantores, todos vão' })).toBeDisabled()
  })

  it('does not follow a Team that changes later', async () => {
    // Ensaio da Banda: only Matias, of Banda, goes. Jacque joins Banda afterwards.
    await mockBackend.addTeamMember({ email: 'bruno.reis@example.com' }, 1, 5, 4)

    await renderAs(OWNER, 4)

    expect(checked(await person('Jacque Moreira'))).toBe(false)
    expect(screen.getByText('1 de 5')).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'Marcar Team Banda' })).toBeEnabled()
  })

  it('keeps a Cancelled Event frozen: the list, without marking', async () => {
    await renderAs(OWNER, 5)

    expect(await screen.findByText('Matias Costa')).toBeOnTheScreen()
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.queryByRole('button', { name: /Marcar Team/ })).toBeNull()
  })
})

describe('ParticipantsScreen, for a Viewer', () => {
  it('shows who goes, without marking or Team shortcuts', async () => {
    // Ensaio da Banda: Lu does not go, and still sees who does.
    await renderAs(VIEWER, 4)

    const list = await screen.findByLabelText('Participants')
    expect(within(list).getByText('Matias Costa')).toBeOnTheScreen()
    expect(within(list).queryByText('Lu Andrade')).toBeNull()
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.queryByRole('button', { name: /Marcar Team/ })).toBeNull()
    expect(screen.getByText('1 de 5')).toBeOnTheScreen()
  })
})
