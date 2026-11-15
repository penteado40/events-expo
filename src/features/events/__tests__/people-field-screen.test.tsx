import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'

import { mockBackend } from '@/shared/mock-backend'
import { useSession, userSchema } from '@/shared/session'

import { EditItemScreen, NewItemScreen } from '../components/item-editor-screen'

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() }
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }))
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}))

const OWNER = 2
const BRUNO = { email: 'bruno.reis@example.com' }
/** Saída Manaus: published, its Participants Bruno, Matias, Jacque and Lu. */
const MANAUS = 3
/** Translado de volta, Sunday 00:40, with Carro 1 - EC (Matias, Lu and Seu Raimundo). */
const TRANSLADO = 8
const LU = 5

async function renderAsOwner(ui: React.ReactElement) {
  const user = userSchema.parse(mockBackend.user(OWNER))
  useSession.setState({ session: { id: `demo-${OWNER}`, user, live: false } })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  await render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }))
const fieldsOf = async (itemId: number) => {
  const { generalInfo, timeline } = await mockBackend.schedule(BRUNO, MANAUS)
  return [...generalInfo, ...timeline.flatMap((d) => d.items)].find((i) => i.id === itemId)!.fields
}

beforeEach(() => mockRouter.back.mockClear())

describe('a Field of people in the item editor', () => {
  it('writes a note, shows the notes to everyone, adds a loose name and a Participant, and takes someone out', async () => {
    await renderAsOwner(<EditItemScreen eventId={MANAUS} itemId={TRANSLADO} />)

    await fireEvent.changeText(await screen.findByLabelText('Nota de Lu Andrade'), 'janela')
    expect(screen.getByText('SEM LOGIN')).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('radio', { name: 'Todos no item' }))
    expect(screen.getByRole('radio', { name: 'Todos no item' })).toBeChecked()
    await press('Adicionar nome solto a Carro 1 - EC')
    await fireEvent.changeText(screen.getByLabelText('Nome solto'), ' Dona Célia ')
    await press('Adicionar nome solto')
    await press('Tirar Seu Raimundo')
    await press('Adicionar Participant a Carro 1 - EC')
    await fireEvent.press(await screen.findByRole('button', { name: 'Adicionar Jacque Moreira' }))
    await press('Salvar')

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled())
    expect(await fieldsOf(TRANSLADO)).toEqual([
      expect.objectContaining({
        name: 'Carro 1 - EC',
        personalNotesVisibility: 'ALL',
        people: [
          expect.objectContaining({ name: 'Matias Costa', personalNote: 'dirigindo' }),
          expect.objectContaining({ name: 'Lu Andrade', personalNote: 'janela' }),
          expect.objectContaining({ userId: null, name: 'Dona Célia', personalNote: null }),
          expect.objectContaining({ userId: 4, name: 'Jacque Moreira' }),
        ],
      }),
    ])
  })

  it('marks who left the Event as "fora do Event", and takes them out', async () => {
    await mockBackend.removeParticipant(BRUNO, MANAUS, LU)
    await renderAsOwner(<EditItemScreen eventId={MANAUS} itemId={TRANSLADO} />)

    expect(await screen.findByText('fora do Event')).toBeOnTheScreen()
    await press('Tirar Lu Andrade')
    expect(screen.queryByText('fora do Event')).not.toBeOnTheScreen()
    await press('Salvar')

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled())
    const [carro] = await fieldsOf(TRANSLADO)
    expect(carro.type === 'PEOPLE' && carro.people.map((p) => p.name)).not.toContain('Lu Andrade')
    await mockBackend.addParticipant(BRUNO, MANAUS, LU)
  })

  it('creates an item with a Field of people, its loose name, notes only for each one', async () => {
    await renderAsOwner(<NewItemScreen eventId={MANAUS} />)

    await fireEvent.changeText(await screen.findByLabelText('Nome do item'), 'Ida ao teatro')
    await press('+ Field de pessoas')
    await fireEvent.changeText(screen.getByLabelText('Nome do Field'), 'Van')
    expect(screen.getByRole('radio', { name: 'Cada um a sua' })).toBeChecked()
    await press('Adicionar nome solto a Van')
    await fireEvent.changeText(screen.getByLabelText('Nome solto'), 'Seu Raimundo')
    await press('Adicionar nome solto')
    await fireEvent.changeText(screen.getByLabelText('Nota de Seu Raimundo'), 'motorista')
    await press('Salvar')

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled())
    const { generalInfo } = await mockBackend.schedule(BRUNO, MANAUS)
    expect(generalInfo.find((i) => i.name === 'Ida ao teatro')?.fields).toEqual([
      expect.objectContaining({
        type: 'PEOPLE',
        name: 'Van',
        personalNotesVisibility: 'PRIVATE',
        people: [
          { userId: null, name: 'Seu Raimundo', personalNote: 'motorista', outOfEvent: false },
        ],
      }),
    ])
  })
})
