import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native'

import { DEMO_OWNER_ID, DEMO_VIEWER_ID, mockBackend } from '@/shared/mock-backend'
import { useSession, userSchema } from '@/shared/session'

import { groupsRepository } from '../api'
import { GroupPeople } from '../components/group-people'
import { TeamScreen } from '../components/team-screen'
import { useGroupChoice } from '../group-choice-store'

const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn() }
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }))

const VOCAL_LIVRE = 1
const owner = { email: 'bruno.reis@example.com' }

/** A Demo mode Session of a sample User: every call goes to the shared mock backend. */
function signInDemo(userId: number) {
  const user = userSchema.parse(mockBackend.user(userId))
  useSession.setState({ session: { id: `demo-${userId}`, user, live: false } })
}

async function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  })
  await render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

/** A Team of its own for a test that changes it (the shared mock backend keeps every change). */
async function newTeam(name: string, memberIds: number[] = []) {
  const team = await mockBackend.createTeam(owner, VOCAL_LIVRE, { name })
  for (const userId of memberIds) {
    await mockBackend.addTeamMember(owner, VOCAL_LIVRE, team.id, userId)
  }
  return team
}

const teamOf = async (teamId: number) =>
  (await mockBackend.groupTeams(owner, VOCAL_LIVRE)).find((t) => t.id === teamId)

beforeEach(() => {
  mockRouter.push.mockClear()
  mockRouter.back.mockClear()
  mockRouter.replace.mockClear()
  useGroupChoice.setState({ chosenBy: {} })
})

afterEach(() => jest.restoreAllMocks())

describe('Teams tab', () => {
  const vocalLivre = (role: 'OWNER' | 'VIEWER') => ({ id: VOCAL_LIVRE, name: 'Vocal Livre', role })
  const openTeamsTab = async () => fireEvent.press(screen.getByRole('tab', { name: 'Teams' }))

  it('"+ Team" creates a Team by name and opens it', async () => {
    signInDemo(DEMO_OWNER_ID)
    await renderWithQuery(<GroupPeople group={vocalLivre('OWNER')} />)
    await openTeamsTab()

    await fireEvent.press(screen.getByRole('button', { name: '+ Team' }))
    await fireEvent.changeText(screen.getByLabelText('Nome do Team'), 'Figurino')
    await fireEvent.press(screen.getByRole('button', { name: 'Criar Team' }))

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalled())
    const created = (await mockBackend.groupTeams(owner, VOCAL_LIVRE)).find(
      (t) => t.name === 'Figurino',
    )!
    expect(mockRouter.push).toHaveBeenCalledWith(`/groups/1/teams/${created.id}`)
  })

  it('says why a name is refused and keeps the sheet open', async () => {
    signInDemo(DEMO_OWNER_ID)
    await renderWithQuery(<GroupPeople group={vocalLivre('OWNER')} />)
    await openTeamsTab()

    await fireEvent.press(screen.getByRole('button', { name: '+ Team' }))
    await fireEvent.changeText(screen.getByLabelText('Nome do Team'), 'banda')
    await fireEvent.press(screen.getByRole('button', { name: 'Criar Team' }))

    expect(
      await screen.findByText('Já existe um Team com este nome neste Group.'),
    ).toBeOnTheScreen()
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('opens a Team from its card, for a Viewer too, who gets no "+ Team"', async () => {
    signInDemo(DEMO_VIEWER_ID)
    await renderWithQuery(<GroupPeople group={vocalLivre('VIEWER')} />)
    await openTeamsTab()

    await fireEvent.press(await screen.findByRole('button', { name: /^Banda/ }))
    expect(mockRouter.push).toHaveBeenCalledWith('/groups/1/teams/5')
    expect(screen.queryByRole('button', { name: '+ Team' })).toBeNull()
  })
})

describe('TeamScreen', () => {
  it('shows the Team, its Group, how many are in it and who', async () => {
    signInDemo(DEMO_OWNER_ID)
    await renderWithQuery(<TeamScreen groupId={VOCAL_LIVRE} teamId={4} />)

    expect(await screen.findByRole('header', { name: 'Cantores' })).toBeOnTheScreen()
    expect(screen.getByText('Team · Vocal Livre')).toBeOnTheScreen()
    expect(screen.getByText('2 pessoas')).toBeOnTheScreen()
    expect(screen.getByText('Jacque Moreira')).toBeOnTheScreen()
    expect(screen.getByText('Lu Andrade')).toBeOnTheScreen()
  })

  it('renames the Team', async () => {
    signInDemo(DEMO_OWNER_ID)
    const team = await newTeam('Luz')
    await renderWithQuery(<TeamScreen groupId={VOCAL_LIVRE} teamId={team.id} />)

    await fireEvent.press(await screen.findByRole('button', { name: 'Renomear' }))
    const field = screen.getByLabelText('Nome do Team')
    expect(field.props.value).toBe('Luz')
    await fireEvent.changeText(field, 'Luz e som')
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByRole('header', { name: 'Luz e som' })).toBeOnTheScreen()
    expect((await teamOf(team.id))?.name).toBe('Luz e som')
  })

  it('adds people of the Group and takes them out, and the count follows', async () => {
    signInDemo(DEMO_OWNER_ID)
    const team = await newTeam('Coro', [3])
    await renderWithQuery(<TeamScreen groupId={VOCAL_LIVRE} teamId={team.id} />)
    expect(await screen.findByText('1 pessoa')).toBeOnTheScreen()

    await fireEvent.press(screen.getByRole('button', { name: '+ Adicionar pessoas do Group' }))
    // Only who is not in the Team yet is offered.
    expect(screen.queryByRole('button', { name: 'Adicionar Matias Costa' })).toBeNull()
    await fireEvent.press(screen.getByRole('button', { name: 'Adicionar Lu Andrade' }))
    expect(await screen.findByText('2 pessoas')).toBeOnTheScreen()
    expect((await teamOf(team.id))?.members).toContainEqual({ userId: DEMO_VIEWER_ID })
    await fireEvent.press(screen.getByRole('button', { name: 'Concluir' }))

    await fireEvent.press(screen.getByRole('button', { name: 'Tirar Matias do Team' }))
    expect(await screen.findByText('1 pessoa')).toBeOnTheScreen()
    expect((await teamOf(team.id))?.members).toEqual([{ userId: DEMO_VIEWER_ID }])
  })

  it('deletes the Team only after the confirmation, and leaves', async () => {
    signInDemo(DEMO_OWNER_ID)
    const team = await newTeam('Apoio')
    await renderWithQuery(<TeamScreen groupId={VOCAL_LIVRE} teamId={team.id} />)

    await fireEvent.press(await screen.findByRole('button', { name: 'Apagar Team' }))
    expect(await teamOf(team.id)).toBeDefined()
    expect(screen.getByText(/^Apagar o Team Apoio\?/)).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('button', { name: 'Apagar' }))

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled())
    expect(await teamOf(team.id)).toBeUndefined()
  })

  it('shows a Viewer the Team with nothing to edit', async () => {
    signInDemo(DEMO_VIEWER_ID)
    await renderWithQuery(<TeamScreen groupId={VOCAL_LIVRE} teamId={4} />)

    expect(await screen.findByText('Jacque Moreira')).toBeOnTheScreen()
    for (const name of [
      'Renomear',
      '+ Adicionar pessoas do Group',
      'Tirar Jacque do Team',
      'Apagar Team',
    ]) {
      expect(screen.queryByRole('button', { name })).toBeNull()
    }
  })

  it("offers no change to who is in it where the repository can't (the events-api)", async () => {
    signInDemo(DEMO_OWNER_ID)
    jest.spyOn(groupsRepository, 'editsTeamMembers').mockReturnValue(false)
    await renderWithQuery(<TeamScreen groupId={VOCAL_LIVRE} teamId={4} />)

    const list = await screen.findByLabelText('Pessoas do Team')
    expect(within(list).getByText('Jacque Moreira')).toBeOnTheScreen()
    expect(screen.queryByRole('button', { name: '+ Adicionar pessoas do Group' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Tirar Jacque do Team' })).toBeNull()
    expect(await screen.findByRole('button', { name: 'Renomear' })).toBeOnTheScreen()
  })
})
