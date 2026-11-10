import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native'
import * as Clipboard from 'expo-clipboard'
import { Linking } from 'react-native'

import { ApiError } from '@/shared/lib/api-error'
import { DEMO_OWNER_ID, DEMO_VIEWER_ID, mockBackend } from '@/shared/mock-backend'
import { useSession, userSchema } from '@/shared/session'

import { AddPersonScreen } from '../components/add-person-screen'
import { GroupPeople } from '../components/group-people'
import { PersonScreen } from '../components/person-screen'
import { useGroupChoice } from '../group-choice-store'

const mockRouter = { push: jest.fn(), back: jest.fn() }
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }))

const VOCAL_LIVRE = 1

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

beforeEach(() => {
  mockRouter.push.mockClear()
  mockRouter.back.mockClear()
  useGroupChoice.setState({ chosenBy: {} })
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)
})

afterEach(() => jest.restoreAllMocks())

describe('Pessoas list', () => {
  const vocalLivre = (role: 'OWNER' | 'VIEWER') => ({ id: VOCAL_LIVRE, name: 'Vocal Livre', role })

  it('"+ Pessoa" opens "Adicionar pessoa", and a person opens their page', async () => {
    signInDemo(DEMO_OWNER_ID)
    await renderWithQuery(<GroupPeople group={vocalLivre('OWNER')} />)

    await fireEvent.press(screen.getByRole('button', { name: '+ Pessoa' }))
    expect(mockRouter.push).toHaveBeenCalledWith('/groups/1/people/add')

    await fireEvent.press(await screen.findByRole('button', { name: 'Matias Costa' }))
    expect(mockRouter.push).toHaveBeenCalledWith('/groups/1/people/3')
  })

  it('shows no "+ Pessoa" to a Viewer', async () => {
    signInDemo(DEMO_VIEWER_ID)
    await renderWithQuery(<GroupPeople group={vocalLivre('VIEWER')} />)

    await screen.findByRole('button', { name: 'Matias Costa' })
    expect(screen.queryByRole('button', { name: '+ Pessoa' })).toBeNull()
  })
})

describe('AddPersonScreen', () => {
  const fill = async (name: string, email: string, phone = '+55 27 98888-1234') => {
    await fireEvent.changeText(screen.getByLabelText('Nome'), name)
    await fireEvent.changeText(
      screen.getByLabelText('E-mail · é com ele que a pessoa entra'),
      email,
    )
    await fireEvent.changeText(screen.getByLabelText('Telefone com DDI'), phone)
  }
  const submit = () => fireEvent.press(screen.getByRole('button', { name: 'Adicionar e convidar' }))

  it('adds a new email in the chosen Team and shows the link to send on WhatsApp or copy', async () => {
    signInDemo(DEMO_OWNER_ID)
    await renderWithQuery(<AddPersonScreen groupId={VOCAL_LIVRE} />)

    await fill('Paula Lima', 'paula.lima@example.com')
    await fireEvent.press(await screen.findByRole('checkbox', { name: 'Banda' }))
    await submit()

    expect(await screen.findByText('Paula está no Group')).toBeOnTheScreen()
    expect(screen.getByText('O convite foi para paula.lima@example.com')).toBeOnTheScreen()
    const url = screen.getByLabelText('Link de ativação').props.children as string
    expect(url).toMatch(/^https:\/\//)

    await fireEvent.press(screen.getByRole('button', { name: 'Copiar link' }))
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(url)
    expect(await screen.findByRole('button', { name: 'Link copiado' })).toBeOnTheScreen()

    await fireEvent.press(screen.getByRole('button', { name: 'Enviar no WhatsApp' }))
    const whatsapp = (Linking.openURL as jest.Mock).mock.calls[0][0] as string
    expect(whatsapp).toMatch(/^https:\/\/wa\.me\/5527988881234\?text=/)
    expect(decodeURIComponent(whatsapp)).toContain(url)

    const banda = (await mockBackend.groupTeams({ email: 'bruno.reis@example.com' }, 1)).find(
      (t) => t.name === 'Banda',
    )!
    const paula = (await mockBackend.groupMembers({ email: 'bruno.reis@example.com' }, 1)).find(
      (m) => m.name === 'Paula Lima',
    )!
    expect(banda.members).toContainEqual({ userId: paula.userId })

    await fireEvent.press(screen.getByRole('button', { name: 'Concluir' }))
    expect(mockRouter.back).toHaveBeenCalled()
  })

  it('only confirms when the email already has an account: no link to pass on', async () => {
    signInDemo(DEMO_OWNER_ID)
    await renderWithQuery(<AddPersonScreen groupId={VOCAL_LIVRE} />)

    await fill('Ana', 'ana.prado@example.com')
    await submit()

    expect(await screen.findByText('Ana está no Group')).toBeOnTheScreen()
    expect(screen.queryByRole('button', { name: 'Copiar link' })).toBeNull()
  })

  it('says a Pending user added here has not activated yet, pointing to a new link', async () => {
    signInDemo(8) // Ana Prado, Owner of Coral Jovem Vitória
    await renderWithQuery(<AddPersonScreen groupId={2} />)

    await fill('Tiago', 'tiago.souza@example.com')
    await submit()

    expect(await screen.findByText('Tiago está no Group')).toBeOnTheScreen()
    expect(
      screen.getByText(
        'Tiago ainda não ativou a conta: o aviso foi por e-mail. Se não chegar, gere um novo link na página da pessoa.',
      ),
    ).toBeOnTheScreen()
    expect(screen.queryByText(/já tem conta/)).toBeNull()
  })

  it('shows ALREADY_A_GROUP_MEMBER on the form', async () => {
    signInDemo(DEMO_OWNER_ID)
    await renderWithQuery(<AddPersonScreen groupId={VOCAL_LIVRE} />)

    await fill('Matias', 'matias.costa@example.com')
    await submit()

    expect(await screen.findByText('Esta pessoa já é Group member deste Group.')).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'Adicionar e convidar' })).toBeOnTheScreen()
  })

  it('says what is missing before sending anything', async () => {
    signInDemo(DEMO_OWNER_ID)
    const addViewer = jest.spyOn(mockBackend, 'addViewer')
    await renderWithQuery(<AddPersonScreen groupId={VOCAL_LIVRE} />)

    await fill('', 'paula@', '27 9999')
    await submit()

    expect(screen.getByText('Informe o nome.')).toBeOnTheScreen()
    expect(screen.getByText('E-mail inválido.')).toBeOnTheScreen()
    expect(screen.getByText('Comece pelo DDI, como +55 27 99999-9999.')).toBeOnTheScreen()
    expect(addViewer).not.toHaveBeenCalled()
  })

  it('shows a Viewer who opens it the refusal, not the form', async () => {
    signInDemo(DEMO_VIEWER_ID)
    await renderWithQuery(<AddPersonScreen groupId={VOCAL_LIVRE} />)

    expect(
      await screen.findByText('Você não pode adicionar pessoas neste Group.'),
    ).toBeOnTheScreen()
    expect(screen.queryByLabelText('Nome')).toBeNull()
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }))
    expect(mockRouter.back).toHaveBeenCalled()
  })

  it("turns the API's 403 into a message on the form", async () => {
    signInDemo(DEMO_OWNER_ID)
    jest
      .spyOn(mockBackend, 'addViewer')
      .mockRejectedValue(new ApiError('FORBIDDEN', 'Você não tem permissão para esta ação.'))
    await renderWithQuery(<AddPersonScreen groupId={VOCAL_LIVRE} />)

    await fill('Paula Lima', 'paula.viewer@example.com')
    await submit()

    expect(await screen.findByText('Você não tem permissão para esta ação.')).toBeOnTheScreen()
  })
})

describe('PersonScreen', () => {
  it('gives a pending person a new link, saying the previous one no longer works', async () => {
    signInDemo(DEMO_OWNER_ID)
    await renderWithQuery(<PersonScreen groupId={VOCAL_LIVRE} userId={9} />)

    expect(await screen.findByText('Tiago Souza')).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('button', { name: 'Gerar novo link' }))

    expect(await screen.findByLabelText('Link de ativação')).toBeOnTheScreen()
    expect(screen.getByText(/o anterior não vale mais/)).toBeOnTheScreen()
  })

  it('removes a Viewer after the confirmation, and the list no longer has them', async () => {
    signInDemo(DEMO_OWNER_ID)
    await renderWithQuery(<PersonScreen groupId={VOCAL_LIVRE} userId={4} />)

    await fireEvent.press(await screen.findByRole('button', { name: 'Remover do Group' }))
    expect(screen.getByText(/^Remover Jacque do Group\?/)).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('button', { name: 'Remover' }))

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled())
    const members = await mockBackend.groupMembers({ email: 'bruno.reis@example.com' }, 1)
    expect(members.map((m) => m.userId)).not.toContain(4)
  })

  it('"Cancelar" keeps the person', async () => {
    signInDemo(DEMO_OWNER_ID)
    const removeViewer = jest.spyOn(mockBackend, 'removeViewer')
    await renderWithQuery(<PersonScreen groupId={VOCAL_LIVRE} userId={3} />)

    await fireEvent.press(await screen.findByRole('button', { name: 'Remover do Group' }))
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }))

    expect(removeViewer).not.toHaveBeenCalled()
  })

  it("turns the API's 403 into a message", async () => {
    signInDemo(DEMO_OWNER_ID)
    jest
      .spyOn(mockBackend, 'removeViewer')
      .mockRejectedValueOnce(new ApiError('FORBIDDEN', 'Você não tem permissão para esta ação.'))
    await renderWithQuery(<PersonScreen groupId={VOCAL_LIVRE} userId={3} />)

    await fireEvent.press(await screen.findByRole('button', { name: 'Remover do Group' }))
    await fireEvent.press(screen.getByRole('button', { name: 'Remover' }))

    expect(await screen.findByText('Você não tem permissão para esta ação.')).toBeOnTheScreen()
    expect(mockRouter.back).not.toHaveBeenCalled()
  })

  it('offers no removal of an Owner, nor of oneself', async () => {
    signInDemo(DEMO_OWNER_ID)
    await renderWithQuery(<PersonScreen groupId={VOCAL_LIVRE} userId={DEMO_OWNER_ID} />)

    expect(await screen.findByText('Bruno Reis')).toBeOnTheScreen()
    expect(screen.queryByRole('button', { name: 'Remover do Group' })).toBeNull()
  })

  it('shows a Viewer the person without the actions', async () => {
    signInDemo(DEMO_VIEWER_ID)
    await renderWithQuery(<PersonScreen groupId={VOCAL_LIVRE} userId={9} />)

    const card = await screen.findByText('Tiago Souza')
    expect(card).toBeOnTheScreen()
    expect(within(screen.getByText('Teams').parent!.parent!).queryByText('Banda')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Gerar novo link' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Remover do Group' })).toBeNull()
  })
})
