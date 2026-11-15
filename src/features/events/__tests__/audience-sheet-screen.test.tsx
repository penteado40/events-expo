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
/** Saída Manaus: its Participants Bruno, Matias, Jacque and Lu; Cantores are Jacque and Lu. */
const MANAUS = 3
/** Passagem de som, with no Field of people. */
const PASSAGEM = 6
/** Translado de volta, with Carro 1 - EC (Matias, Lu and Seu Raimundo). */
const TRANSLADO = 8

async function renderAsOwner(ui: React.ReactElement) {
  const user = userSchema.parse(mockBackend.user(OWNER))
  useSession.setState({ session: { id: `demo-${OWNER}`, user, live: false } })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  await render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }))
const audienceOf = async (itemId: number) => {
  const { generalInfo, timeline } = await mockBackend.schedule(BRUNO, MANAUS)
  return [...generalInfo, ...timeline.flatMap((d) => d.items)].find((i) => i.id === itemId)!
    .audience
}

beforeEach(() => mockRouter.back.mockClear())

describe('"Quem vê" in the item editor', () => {
  it('chooses a list with a Team copied and someone avulso, counting before applying', async () => {
    await renderAsOwner(<EditItemScreen eventId={MANAUS} itemId={PASSAGEM} />)

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Quem vê: Todos que vão, 4 pessoas' }),
    )
    expect(screen.getByRole('radio', { name: /^Todos que vão/ })).toBeChecked()
    expect(screen.getByText('4 pessoas veem')).toBeOnTheScreen()
    expect(
      screen.getByText(/Quem estiver num Field de pessoas do item também vê/),
    ).toBeOnTheScreen()

    await fireEvent.press(screen.getByRole('radio', { name: /^Escolher pessoas/ }))
    expect(screen.getByText('0 pessoas veem')).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Cantores · 2' }))
    expect(screen.getByRole('checkbox', { name: 'Cantores · 2' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Jacque Moreira' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Lu Andrade' })).toBeChecked()
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Matias Costa' }))
    expect(screen.getByText('3 pessoas veem')).toBeOnTheScreen()
    await press('Aplicar')

    expect(
      screen.getByRole('button', { name: 'Quem vê: Lista escolhida, 3 pessoas' }),
    ).toBeOnTheScreen()
    await press('Salvar')

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled())
    expect(await audienceOf(PASSAGEM)).toEqual({ kind: 'SELECTED', userIds: [3, 4, 5] })
  })

  it('counts whoever is in a Field of people once, on top of the chosen', async () => {
    await renderAsOwner(<EditItemScreen eventId={MANAUS} itemId={TRANSLADO} />)

    await fireEvent.press(await screen.findByRole('button', { name: /^Quem vê/ }))
    await fireEvent.press(screen.getByRole('radio', { name: /^Escolher pessoas/ }))
    expect(screen.getByText('2 pessoas veem')).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Lu Andrade' }))
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Jacque Moreira' }))

    expect(screen.getByText('3 pessoas veem')).toBeOnTheScreen()
  })

  it('leaves the Audience as it was when the sheet is closed without applying', async () => {
    await mockBackend.updateItem(BRUNO, MANAUS, PASSAGEM, {
      audience: { kind: 'SELECTED', userIds: [3] },
    })
    await renderAsOwner(<EditItemScreen eventId={MANAUS} itemId={PASSAGEM} />)

    await fireEvent.press(await screen.findByRole('button', { name: /^Quem vê/ }))
    await fireEvent.press(screen.getByRole('radio', { name: /^Todos que vão/ }))
    // The overlay behind the sheet, which the sheet's modal view hides from the accessibility tree.
    await fireEvent.press(screen.getByLabelText('Fechar', { includeHiddenElements: true }))
    await fireEvent.press(screen.getByRole('button', { name: /^Quem vê/ }))

    expect(screen.getByRole('radio', { name: /^Escolher pessoas/ })).toBeChecked()
  })

  it('creates an item for "Todos que vão" by default', async () => {
    await renderAsOwner(<NewItemScreen eventId={MANAUS} />)

    await fireEvent.changeText(await screen.findByLabelText('Nome do item'), 'Jantar')
    expect(
      await screen.findByRole('button', { name: 'Quem vê: Todos que vão, 4 pessoas' }),
    ).toBeOnTheScreen()
    await press('Salvar')

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled())
    const { generalInfo } = await mockBackend.schedule(BRUNO, MANAUS)
    expect(generalInfo.find((i) => i.name === 'Jantar')?.audience).toEqual({ kind: 'ALL' })
  })
})
