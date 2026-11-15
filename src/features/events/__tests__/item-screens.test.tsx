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
/** Saída Manaus: published, 20 to 22 Nov 2026, in Manaus' timezone. */
const MANAUS = 3
/** Turnê Minas: in Draft, 12 to 14 Mar 2027, in São Paulo's timezone. */
const MINAS = 2
/** Festival de Verão: Cancelled. */
const FESTIVAL = 5
/** Saída Manaus' Show, Saturday 19:00 at Teatro Amazonas: published. */
const SHOW = 5

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
const allItems = async (eventId: number) => {
  const { generalInfo, timeline } = await mockBackend.schedule(BRUNO, eventId)
  return [...generalInfo, ...timeline.flatMap((d) => d.items)]
}

/** The items written in Turnê Minas, in Draft: born published. */
const minas = { passagem: 0, show: 0, fields: { obs: 0, contato: 0 } }
beforeAll(async () => {
  const palacio = { name: 'Palácio das Artes', address: 'Av. Afonso Pena, 1537' }
  minas.passagem = (
    await mockBackend.createItem(BRUNO, MINAS, {
      name: 'Passagem de som',
      date: '2027-03-13',
      time: '16:00',
      place: palacio,
    })
  ).id
  minas.show = (
    await mockBackend.createItem(BRUNO, MINAS, {
      name: 'Show',
      date: '2027-03-13',
      time: '20:00',
      place: palacio,
    })
  ).id
  const field = (name: string, value: string) =>
    mockBackend.addField(BRUNO, MINAS, minas.show, { type: 'TEXT', name, value })
  minas.fields.obs = (await field('Obs', 'Figurino azul')).id
  minas.fields.contato = (await field('Contato', 'Produção: (27) 99999-0000')).id
  await mockBackend.createItem(BRUNO, MINAS, {
    name: 'Check-out',
    date: '2027-03-14',
    time: '11:00',
  })
})

beforeEach(() => {
  mockRouter.push.mockClear()
  mockRouter.back.mockClear()
})

describe('EventScreen, the schedule in short', () => {
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

  it('marks in the day line an item in Draft (RASCUNHO) and a Cancelled one (CANCELADO, struck)', async () => {
    const { id } = await mockBackend.createItem(BRUNO, MANAUS, {
      name: 'Ensaio no hotel',
      date: '2026-11-21',
      time: '11:00',
    })
    await mockBackend.cancelItem(BRUNO, MANAUS, SHOW)
    try {
      await renderAs(OWNER, <EventScreen eventId={MANAUS} />)

      const saturday = await screen.findByRole('button', {
        name: 'Sáb 21, Almoço, Ensaio no hotel (rascunho), Passagem de som, Show (cancelado), 4',
      })
      expect(within(saturday).getByText('RASCUNHO')).toBeOnTheScreen()
      expect(within(saturday).getByText('CANCELADO')).toBeOnTheScreen()
      expect(within(saturday).getByText('Show')).toHaveStyle({
        textDecorationLine: 'line-through',
      })
      expect(within(saturday).getByText('Ensaio no hotel')).not.toHaveStyle({
        textDecorationLine: 'line-through',
      })
    } finally {
      await mockBackend.uncancelItem(BRUNO, MANAUS, SHOW)
      await mockBackend.deleteItem(BRUNO, MANAUS, id)
    }
  })

  it('opens the Timeline and the new item from it, in an Event in Draft', async () => {
    await renderAs(OWNER, <EventScreen eventId={MINAS} />)

    await press(await screen.findByText('Abrir a Timeline').then(() => 'Abrir a Timeline'))
    expect(mockRouter.push).toHaveBeenCalledWith(`/events/${MINAS}/timeline`)
    await press('+ Item')
    expect(mockRouter.push).toHaveBeenCalledWith(`/events/${MINAS}/items/new`)
  })

  it('has "+ Item" in a published Event too', async () => {
    await renderAs(OWNER, <EventScreen eventId={MANAUS} />)

    expect(await screen.findByText('O que levar · Contatos')).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: '+ Item' })).toBeOnTheScreen()
  })

  it('has no "+ Item" in a Cancelled Event, frozen', async () => {
    await renderAs(OWNER, <EventScreen eventId={FESTIVAL} />)
    expect(await screen.findByText('Programação')).toBeOnTheScreen()
    expect(screen.queryByRole('button', { name: '+ Item' })).toBeNull()
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
    expect(screen.getByLabelText('00:40, Translado de volta')).toBeOnTheScreen()
    expect(screen.getByText('FORA DO PERÍODO')).toBeOnTheScreen()
    expect(screen.getByLabelText('a definir, Técnica viaja antes')).toBeOnTheScreen()
  })

  it('shows the untimed ("a definir") before the timed in a day', async () => {
    await renderAs(OWNER, <TimelineScreen eventId={MANAUS} />)

    const rows = (await screen.findAllByLabelText(/Almoço|Passagem de som|Show/)).map(
      (row) => row.props.accessibilityLabel,
    )
    expect(rows).toEqual([
      'a definir, Almoço',
      '16:00, Passagem de som, Teatro Amazonas',
      '19:00, Show, Teatro Amazonas',
    ])
  })

  it('labels a time in a timezone other than the Event’s by the zone’s city: "horário de São Paulo"', async () => {
    await renderAs(OWNER, <TimelineScreen eventId={MANAUS} />)

    expect(await screen.findAllByText('Vitória · horário de São Paulo')).toHaveLength(2)
    expect(screen.getByLabelText(/^14:30, Check-in/).props.accessibilityLabel).not.toMatch(
      /horário/,
    )
  })

  it('cancels a published item of a published Event: CANCELADO and its name struck, until uncancelled', async () => {
    await renderAs(OWNER, <TimelineScreen eventId={MANAUS} />)

    await press(await screen.findByText('Show').then(() => '19:00, Show, Teatro Amazonas'))
    expect(screen.queryByRole('button', { name: 'Apagar' })).toBeNull()
    await press('Cancelar item')

    const cancelled = await screen.findByRole('button', {
      name: '19:00, Show, Teatro Amazonas, cancelado',
    })
    expect(within(cancelled).getByText('CANCELADO')).toBeOnTheScreen()
    expect(within(cancelled).getByText('Show')).toHaveStyle({ textDecorationLine: 'line-through' })
    expect((await allItems(MANAUS)).find((i) => i.id === SHOW)?.state).toBe('CANCELLED')

    await fireEvent.press(cancelled)
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Apagar' })).toBeNull()
    await press('Descancelar')

    expect(
      await screen.findByRole('button', { name: '19:00, Show, Teatro Amazonas' }),
    ).toBeOnTheScreen()
    expect(screen.queryByText('CANCELADO')).toBeNull()
    expect((await allItems(MANAUS)).find((i) => i.id === SHOW)?.state).toBe('PUBLISHED')
  })

  it('publishes an item in Draft of a published Event from its actions, taking off RASCUNHO', async () => {
    const { id } = await mockBackend.createItem(BRUNO, MANAUS, {
      name: 'Ensaio no hotel',
      date: '2026-11-21',
      time: '11:00',
    })
    await renderAs(OWNER, <TimelineScreen eventId={MANAUS} />)

    const draft = await screen.findByRole('button', { name: '11:00, Ensaio no hotel, rascunho' })
    expect(within(draft).getByText('RASCUNHO')).toBeOnTheScreen()
    await fireEvent.press(draft)
    expect(screen.queryByRole('button', { name: 'Cancelar item' })).toBeNull()
    await press('Publicar')

    expect(await screen.findByRole('button', { name: '11:00, Ensaio no hotel' })).toBeOnTheScreen()
    expect(screen.queryByText('RASCUNHO')).toBeNull()
    await mockBackend.deleteItem(BRUNO, MANAUS, id)
  })

  it('deletes an item in Draft of a published Event after the confirmation', async () => {
    await mockBackend.createItem(BRUNO, MANAUS, { name: 'Ensaio extra', date: '2026-11-21' })
    await renderAs(OWNER, <TimelineScreen eventId={MANAUS} />)

    await press(await screen.findByText('Ensaio extra').then(() => /^a definir, Ensaio extra/))
    await press('Apagar')
    await press('Apagar')

    await waitFor(() => expect(screen.queryByText('Ensaio extra')).toBeNull())
    expect((await allItems(MANAUS)).map((i) => i.name)).not.toContain('Ensaio extra')
  })

  it('deletes an item after the confirmation', async () => {
    await renderAs(OWNER, <TimelineScreen eventId={MINAS} />)

    await press(await screen.findByText('Check-out').then(() => '11:00, Check-out'))
    await press('Apagar')
    expect(screen.getByText('O item sai da programação e não dá para desfazer.')).toBeOnTheScreen()
    await press('Apagar')

    await waitFor(() => expect(screen.queryByText('Check-out')).toBeNull())
    expect((await allItems(MINAS)).map((i) => i.name)).not.toContain('Check-out')
  })

  it('opens the editor of an item from its actions', async () => {
    await renderAs(OWNER, <TimelineScreen eventId={MINAS} />)

    await press(await screen.findByText('Show').then(() => '20:00, Show, Palácio das Artes'))
    await press('Editar')

    expect(mockRouter.push).toHaveBeenCalledWith(`/events/${MINAS}/items/${minas.show}`)
  })
})

describe('NewItemScreen', () => {
  it('refuses a time with no day, sending nothing', async () => {
    const createItem = jest.spyOn(mockBackend, 'createItem')
    await renderAs(OWNER, <NewItemScreen eventId={MINAS} />)

    await fireEvent.changeText(await screen.findByLabelText('Nome do item'), 'Ensaio no hotel')
    await fireEvent.changeText(field('Hora · São Paulo'), '1100')
    expect(field('Hora · São Paulo').props.value).toBe('11:00')
    await press('Criar item')

    expect(screen.getByText('Para pôr a hora, informe o dia.')).toBeOnTheScreen()
    expect(createItem).not.toHaveBeenCalled()
    expect(mockRouter.back).not.toHaveBeenCalled()
    createItem.mockRestore()
  })

  it('refuses a name of 247 characters (the limit is 200), sending nothing', async () => {
    const createItem = jest.spyOn(mockBackend, 'createItem')
    await renderAs(OWNER, <NewItemScreen eventId={MINAS} />)

    await fireEvent.changeText(await screen.findByLabelText('Nome do item'), 'x'.repeat(247))
    await fireEvent.changeText(field('Dia'), '13032027')
    await press('Criar item')

    expect(await screen.findByText('Use um nome de até 200 caracteres.')).toBeOnTheScreen()
    expect(createItem).not.toHaveBeenCalled()
    expect(mockRouter.back).not.toHaveBeenCalled()
    createItem.mockRestore()
  })

  it('refuses a place name over 200 characters and an address over 500, sending nothing', async () => {
    const createItem = jest.spyOn(mockBackend, 'createItem')
    await renderAs(OWNER, <NewItemScreen eventId={MINAS} />)

    await fireEvent.changeText(await screen.findByLabelText('Nome do item'), 'Ensaio')
    await fireEvent.changeText(field('Nome do lugar'), 'x'.repeat(201))
    await fireEvent.changeText(field('Endereço'), 'x'.repeat(501))
    await press('Criar item')

    expect(await screen.findAllByText(/^Use até (200|500) caracteres\.$/)).toHaveLength(2)
    expect(createItem).not.toHaveBeenCalled()
    createItem.mockRestore()
  })

  it('creates the item with day, local time and a place in its own timezone', async () => {
    await renderAs(OWNER, <NewItemScreen eventId={MINAS} />)

    await fireEvent.changeText(await screen.findByLabelText('Nome do item'), 'Voo para Manaus')
    await fireEvent.changeText(field('Dia'), '11032027')
    await fireEvent.changeText(field('Nome do lugar'), 'Manaus')
    await press('Fuso do lugar: Fuso do Event · São Paulo (GMT−3)')
    await press('Manaus (GMT−4)')
    expect(field('Hora · Manaus')).toBeOnTheScreen()
    await fireEvent.changeText(field('Hora · Manaus'), '0900')
    await press('Criar item')

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled())
    expect((await allItems(MINAS)).find((i) => i.name === 'Voo para Manaus')).toMatchObject({
      when: { date: '2027-03-11', time: '09:00', timezone: 'America/Manaus' },
      place: { name: 'Manaus', address: null, timezone: 'America/Manaus' },
    })
  })

  it('creates the item with its text Fields in the editor’s order, one in the Resumo', async () => {
    await renderAs(OWNER, <NewItemScreen eventId={MINAS} />)

    await fireEvent.changeText(await screen.findByLabelText('Nome do item'), 'Ensaio geral')
    await press('+ Field de texto')
    await press('+ Field de texto')
    const names = screen.getAllByLabelText('Nome do Field')
    const values = screen.getAllByLabelText('Valor')
    await fireEvent.changeText(names[0], 'Voltagem')
    await fireEvent.changeText(values[0], '127 V')
    await fireEvent.changeText(names[1], 'O que levar')
    await fireEvent.changeText(values[1], 'In-ear e garrafa')
    await fireEvent.press(screen.getByRole('switch', { name: 'O que levar no Resumo' }))
    expect(screen.getByRole('switch', { name: 'O que levar no Resumo' })).toBeChecked()
    await press('Subir O que levar')
    await press('Criar item')

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled())
    const created = (await allItems(MINAS)).find((i) => i.name === 'Ensaio geral')
    expect(created?.fields).toEqual([
      expect.objectContaining({ name: 'O que levar', value: 'In-ear e garrafa', highlight: true }),
      expect.objectContaining({ name: 'Voltagem', value: '127 V', highlight: false }),
    ])
  })

  it('saving again after a Field failed to save, keeps the one item already created', async () => {
    const addField = jest.spyOn(mockBackend, 'addField').mockRejectedValueOnce(new Error('offline'))
    await renderAs(OWNER, <NewItemScreen eventId={MINAS} />)

    await fireEvent.changeText(await screen.findByLabelText('Nome do item'), 'Jantar')
    await press('+ Field de texto')
    await fireEvent.changeText(field('Nome do Field'), 'Obs')
    await fireEvent.changeText(field('Valor'), 'Mesa para 20')
    await press('Criar item')
    expect(await screen.findByText('Não foi possível salvar. Tente de novo.')).toBeOnTheScreen()
    await press('Criar item')

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled())
    const dinners = (await allItems(MINAS)).filter((i) => i.name === 'Jantar')
    expect(dinners).toHaveLength(1)
    expect(dinners[0].fields).toEqual([
      expect.objectContaining({ name: 'Obs', value: 'Mesa para 20' }),
    ])
    addField.mockRestore()
  })

  it('refuses a Field with no name on it, sending nothing', async () => {
    const createItem = jest.spyOn(mockBackend, 'createItem')
    await renderAs(OWNER, <NewItemScreen eventId={MINAS} />)

    await fireEvent.changeText(await screen.findByLabelText('Nome do item'), 'Ensaio')
    await press('+ Field de texto')
    await fireEvent.changeText(field('Valor'), 'Sem nome')
    await press('Criar item')

    expect(screen.getByText('Dê um nome ao Field.')).toBeOnTheScreen()
    expect(createItem).not.toHaveBeenCalled()
    createItem.mockRestore()
  })

  it('saves an item of a published Event in Draft, with RASCUNHO', async () => {
    await renderAs(OWNER, <NewItemScreen eventId={MANAUS} />)

    expect(await screen.findByText('RASCUNHO · só Owners veem')).toBeOnTheScreen()
    await fireEvent.changeText(field('Nome do item'), 'Ensaio de voz')
    await press('Salvar')

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled())
    const created = (await allItems(MANAUS)).find((i) => i.name === 'Ensaio de voz')
    expect(created?.state).toBe('DRAFT')
    await mockBackend.deleteItem(BRUNO, MANAUS, created!.id)
  })

  it('publishes an item of a published Event at once with Publicar', async () => {
    await renderAs(OWNER, <NewItemScreen eventId={MANAUS} />)

    await fireEvent.changeText(await screen.findByLabelText('Nome do item'), 'Ensaio de dança')
    await press('Publicar')

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled())
    const created = (await allItems(MANAUS)).find((i) => i.name === 'Ensaio de dança')
    expect(created?.state).toBe('PUBLISHED')
    await mockBackend.deleteItem(BRUNO, MANAUS, created!.id)
  })

  it('creates an item of an Event in Draft published, with no RASCUNHO nor Publicar', async () => {
    await renderAs(OWNER, <NewItemScreen eventId={MINAS} />)

    expect(await screen.findByRole('button', { name: 'Criar item' })).toBeOnTheScreen()
    expect(screen.queryByText('RASCUNHO · só Owners veem')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull()
  })

  it('is not open in a Cancelled Event', async () => {
    await renderAs(OWNER, <NewItemScreen eventId={FESTIVAL} />)

    expect(
      await screen.findByText('O Event está cancelado. Descancele para editar os itens.'),
    ).toBeOnTheScreen()
    expect(screen.queryByRole('button', { name: 'Criar item' })).toBeNull()
  })
})

describe('EditItemScreen', () => {
  it('opens with the item and saves only what changed', async () => {
    await renderAs(OWNER, <EditItemScreen eventId={MINAS} itemId={minas.passagem} />)

    expect(await screen.findByDisplayValue('Passagem de som')).toBeOnTheScreen()
    expect(field('Dia').props.value).toBe('13/03/2027')
    await fireEvent.changeText(field('Hora · São Paulo'), '1700')
    await press('Salvar')

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled())
    expect((await allItems(MINAS)).find((i) => i.id === minas.passagem)).toMatchObject({
      when: { date: '2027-03-13', time: '17:00', timezone: 'America/Sao_Paulo' },
      place: { name: 'Palácio das Artes' },
    })
  })

  it('edits, deletes, reorders and highlights the item’s text Fields, saved in that order', async () => {
    await renderAs(OWNER, <EditItemScreen eventId={MINAS} itemId={minas.show} />)

    expect(await screen.findByDisplayValue('Figurino azul')).toBeOnTheScreen()
    expect(screen.getByRole('switch', { name: 'Obs no Resumo' })).not.toBeChecked()
    await fireEvent.changeText(screen.getByDisplayValue('Figurino azul'), 'Figurino preto')
    await fireEvent.press(screen.getByRole('switch', { name: 'Obs no Resumo' }))
    await press('+ Field de texto')
    await fireEvent.changeText(screen.getAllByLabelText('Nome do Field')[2], 'Voltagem')
    await fireEvent.changeText(screen.getAllByLabelText('Valor')[2], '220 V')
    await press('Subir Voltagem')
    await press('Subir Voltagem')
    await press('Apagar Contato')
    expect(screen.queryByDisplayValue('Produção: (27) 99999-0000')).toBeNull()
    await press('Salvar')

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled())
    const show = (await allItems(MINAS)).find((i) => i.id === minas.show)
    expect(show?.fields).toEqual([
      expect.objectContaining({ name: 'Voltagem', value: '220 V', highlight: false }),
      { id: minas.fields.obs, type: 'TEXT', name: 'Obs', value: 'Figurino preto', highlight: true },
    ])
  })

  it('edits a published item of a published Event, with no Publicar', async () => {
    await renderAs(OWNER, <EditItemScreen eventId={MANAUS} itemId={6} />)

    expect(await screen.findByDisplayValue('Passagem de som')).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeOnTheScreen()
    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull()
    expect(screen.queryByText('RASCUNHO · só Owners veem')).toBeNull()
  })

  it('saves what changed of an item in Draft, then publishes it', async () => {
    const { id } = await mockBackend.createItem(BRUNO, MANAUS, { name: 'Ensaio no hall' })
    await renderAs(OWNER, <EditItemScreen eventId={MANAUS} itemId={id} />)

    expect(await screen.findByText('RASCUNHO · só Owners veem')).toBeOnTheScreen()
    await fireEvent.changeText(field('Nome do item'), 'Ensaio no saguão')
    await press('Publicar')

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled())
    expect((await allItems(MANAUS)).find((i) => i.id === id)).toMatchObject({
      name: 'Ensaio no saguão',
      state: 'PUBLISHED',
    })
    await mockBackend.deleteItem(BRUNO, MANAUS, id)
  })

  it('is not open for a Cancelled item', async () => {
    await mockBackend.cancelItem(BRUNO, MANAUS, 9)
    await renderAs(OWNER, <EditItemScreen eventId={MANAUS} itemId={9} />)

    expect(
      await screen.findByText('Este item está cancelado. Descancele para editar.'),
    ).toBeOnTheScreen()
    expect(screen.queryByRole('button', { name: 'Salvar' })).toBeNull()
    await mockBackend.uncancelItem(BRUNO, MANAUS, 9)
  })

  it('tells a Viewer they cannot edit the items', async () => {
    await renderAs(VIEWER, <EditItemScreen eventId={MANAUS} itemId={6} />)

    expect(await screen.findByText('Você não pode editar os itens deste Event.')).toBeOnTheScreen()
  })
})
