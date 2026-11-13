import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native'

import { mockBackend } from '@/shared/mock-backend'
import { useSession, userSchema } from '@/shared/session'

import { EventScreen } from '../components/event-screen'
import { EditItemScreen, NewItemScreen } from '../components/item-editor-screen'
import { TimelineScreen } from '../components/timeline-screen'

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() }
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }))
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}))

const OWNER = 2
const VIEWER = 5
const BRUNO = { email: 'bruno.reis@example.com' }
/** Saída Manaus: 20 to 22 Nov 2026, in Manaus' timezone. */
const MANAUS = 3

/** A Demo mode Session of a sample User: everything answers from the shared mock backend. */
async function renderAs(userId: number, ui: React.ReactElement) {
  const user = userSchema.parse(mockBackend.user(userId))
  useSession.setState({ session: { id: `demo-${userId}`, user, live: false } })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  await render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const field = (label: string) => screen.getByLabelText(label)
const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }))
const allItems = async () => {
  const { generalInfo, timeline } = await mockBackend.schedule(BRUNO, MANAUS)
  return [...generalInfo, ...timeline.flatMap((d) => d.items)]
}

beforeEach(() => {
  mockRouter.push.mockClear()
  mockRouter.back.mockClear()
})

describe('EventScreen, the Draft schedule in short', () => {
  it('shows the Owner the General info and a line per day, the eve outside the period', async () => {
    await renderAs(OWNER, <EventScreen eventId={MANAUS} />)

    expect(await screen.findByText('O que levar · Contatos')).toBeOnTheScreen()
    const eve = screen.getByRole('button', { name: /^Qui 19, Técnica viaja antes/ })
    expect(within(eve).getByText('FORA DO PERÍODO')).toBeOnTheScreen()
    expect(
      screen.getByRole('button', {
        name: 'Dom 22, Translado de volta, Check-out, Voo MAO → VIX, 3',
      }),
    ).toBeOnTheScreen()
  })

  it('opens the Timeline and the new item from it', async () => {
    await renderAs(OWNER, <EventScreen eventId={MANAUS} />)

    await press(await screen.findByText('Abrir a Timeline').then(() => 'Abrir a Timeline'))
    expect(mockRouter.push).toHaveBeenCalledWith(`/events/${MANAUS}/timeline`)
    await press('+ Item')
    expect(mockRouter.push).toHaveBeenCalledWith(`/events/${MANAUS}/items/new`)
  })

  it('shows a Viewer no schedule', async () => {
    await renderAs(VIEWER, <EventScreen eventId={MANAUS} />)

    expect(await screen.findByText('Saída Manaus')).toBeOnTheScreen()
    expect(screen.queryByText('Programação')).toBeNull()
  })
})

describe('TimelineScreen', () => {
  it('puts the 00:40 transfer on Sunday and the eve on the eve, marked outside the period', async () => {
    await renderAs(OWNER, <TimelineScreen eventId={MANAUS} />)

    const headings = (await screen.findAllByRole('header')).map((h) => h.props.children)
    expect(headings.flat().filter((t: unknown) => typeof t === 'string')).toEqual(
      expect.arrayContaining(['Qui 19', 'Sex 20', 'Sáb 21', 'Dom 22']),
    )
    expect(screen.getByRole('button', { name: '00:40, Translado de volta' })).toBeOnTheScreen()
    expect(screen.getByText('FORA DO PERÍODO')).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'a definir, Técnica viaja antes' })).toBeOnTheScreen()
  })

  it('shows the untimed ("a definir") before the timed in a day', async () => {
    await renderAs(OWNER, <TimelineScreen eventId={MANAUS} />)

    const rows = (
      await screen.findAllByRole('button', { name: /Almoço|Passagem de som|Show/ })
    ).map((row) => row.props.accessibilityLabel)
    expect(rows).toEqual([
      'a definir, Almoço',
      '16:00, Passagem de som, Teatro Amazonas',
      '19:00, Show, Teatro Amazonas',
    ])
  })

  it('labels a time in a timezone other than the Event’s by the zone’s city: "horário de São Paulo"', async () => {
    await renderAs(OWNER, <TimelineScreen eventId={MANAUS} />)

    expect(await screen.findAllByText('Vitória · horário de São Paulo')).toHaveLength(2)
    expect(
      screen.getByRole('button', { name: /^14:30, Check-in/ }).props.accessibilityLabel,
    ).not.toMatch(/horário/)
  })

  it('deletes an item after the confirmation', async () => {
    await renderAs(OWNER, <TimelineScreen eventId={MANAUS} />)

    await press(await screen.findByText('Check-out').then(() => '11:00, Check-out'))
    await press('Apagar')
    expect(screen.getByText('O item sai da programação e não dá para desfazer.')).toBeOnTheScreen()
    await press('Apagar')

    await waitFor(() => expect(screen.queryByText('Check-out')).toBeNull())
    expect((await allItems()).map((i) => i.name)).not.toContain('Check-out')
  })

  it('opens the editor of an item from its actions', async () => {
    await renderAs(OWNER, <TimelineScreen eventId={MANAUS} />)

    await press(await screen.findByText('Show').then(() => '19:00, Show, Teatro Amazonas'))
    await press('Editar')

    expect(mockRouter.push).toHaveBeenCalledWith(`/events/${MANAUS}/items/5`)
  })
})

describe('NewItemScreen', () => {
  it('refuses a time with no day, sending nothing', async () => {
    await renderAs(OWNER, <NewItemScreen eventId={MANAUS} />)
    const before = (await allItems()).length

    await fireEvent.changeText(await screen.findByLabelText('Nome do item'), 'Ensaio no hotel')
    await fireEvent.changeText(field('Hora · Manaus'), '1100')
    expect(field('Hora · Manaus').props.value).toBe('11:00')
    await press('Criar item')

    expect(screen.getByText('Para pôr a hora, informe o dia.')).toBeOnTheScreen()
    expect(await allItems()).toHaveLength(before)
    expect(mockRouter.back).not.toHaveBeenCalled()
  })

  it('refuses a name of 247 characters (the limit is 200), sending nothing', async () => {
    const createItem = jest.spyOn(mockBackend, 'createItem')
    await renderAs(OWNER, <NewItemScreen eventId={MANAUS} />)

    await fireEvent.changeText(await screen.findByLabelText('Nome do item'), 'x'.repeat(247))
    await fireEvent.changeText(field('Dia'), '21112026')
    await press('Criar item')

    expect(await screen.findByText('Use um nome de até 200 caracteres.')).toBeOnTheScreen()
    expect(createItem).not.toHaveBeenCalled()
    expect(mockRouter.back).not.toHaveBeenCalled()
    createItem.mockRestore()
  })

  it('refuses a place name over 200 characters and an address over 500, sending nothing', async () => {
    const createItem = jest.spyOn(mockBackend, 'createItem')
    await renderAs(OWNER, <NewItemScreen eventId={MANAUS} />)

    await fireEvent.changeText(await screen.findByLabelText('Nome do item'), 'Ensaio')
    await fireEvent.changeText(field('Nome do lugar'), 'x'.repeat(201))
    await fireEvent.changeText(field('Endereço'), 'x'.repeat(501))
    await press('Criar item')

    expect(await screen.findAllByText(/^Use até (200|500) caracteres\.$/)).toHaveLength(2)
    expect(createItem).not.toHaveBeenCalled()
    createItem.mockRestore()
  })

  it('creates the item with day, local time and a place in its own timezone', async () => {
    await renderAs(OWNER, <NewItemScreen eventId={MANAUS} />)

    await fireEvent.changeText(await screen.findByLabelText('Nome do item'), 'Ensaio em Vitória')
    await fireEvent.changeText(field('Dia'), '19112026')
    await fireEvent.changeText(field('Nome do lugar'), 'Vitória')
    await press('Fuso do lugar: Fuso do Event · Manaus (GMT−4)')
    await press('São Paulo (GMT−3)')
    expect(field('Hora · São Paulo')).toBeOnTheScreen()
    await fireEvent.changeText(field('Hora · São Paulo'), '0900')
    await press('Criar item')

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled())
    expect((await allItems()).find((i) => i.name === 'Ensaio em Vitória')).toMatchObject({
      when: { date: '2026-11-19', time: '09:00', timezone: 'America/Sao_Paulo' },
      place: { name: 'Vitória', address: null, timezone: 'America/Sao_Paulo' },
    })
  })
})

describe('EditItemScreen', () => {
  it('opens with the item and saves only what changed', async () => {
    await renderAs(OWNER, <EditItemScreen eventId={MANAUS} itemId={6} />)

    expect(await screen.findByDisplayValue('Passagem de som')).toBeOnTheScreen()
    expect(field('Dia').props.value).toBe('21/11/2026')
    await fireEvent.changeText(field('Hora · Manaus'), '1700')
    await press('Salvar')

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled())
    expect((await allItems()).find((i) => i.id === 6)).toMatchObject({
      when: { date: '2026-11-21', time: '17:00', timezone: 'America/Manaus' },
      place: { name: 'Teatro Amazonas' },
    })
  })

  it('tells a Viewer they cannot edit the items', async () => {
    await renderAs(VIEWER, <EditItemScreen eventId={MANAUS} itemId={6} />)

    expect(await screen.findByText('Você não pode editar os itens deste Event.')).toBeOnTheScreen()
  })
})
