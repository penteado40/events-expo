import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'

import { mockBackend } from '@/shared/mock-backend'
import { useSession, userSchema } from '@/shared/session'

import { EditEventScreen, NewEventScreen } from '../components/event-form-screen'
import { EventScreen } from '../components/event-screen'

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() }
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }))

const OWNER = 2
const VIEWER = 5
const BRUNO = { email: 'bruno.reis@example.com' }

/** A Demo mode Session of a sample User: `events` answers from the shared mock backend. */
async function renderAs(userId: number, ui: React.ReactElement) {
  const user = userSchema.parse(mockBackend.user(userId))
  useSession.setState({ session: { id: `demo-${userId}`, user, live: false } })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  await render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const field = (label: string) => screen.getByLabelText(label)
const press = (name: string) => fireEvent.press(screen.getByRole('button', { name }))

beforeEach(() => {
  mockRouter.push.mockClear()
  mockRouter.replace.mockClear()
  mockRouter.back.mockClear()
})

describe('NewEventScreen', () => {
  async function fill() {
    await fireEvent.changeText(field('Nome do Event'), 'Saída BH')
    await fireEvent.changeText(field('Cidade ou local'), 'Belo Horizonte, MG')
    await fireEvent.changeText(field('Começa'), '04122026')
    await fireEvent.changeText(field('Termina'), '06122026')
  }

  it('warns that the Event is born in Draft, in the Group', async () => {
    await renderAs(OWNER, <NewEventScreen groupId={1} />)

    expect(screen.getByText('Novo Event · Vocal Livre')).toBeOnTheScreen()
    expect(
      screen.getByText(/O Event nasce em rascunho: o Group já vê onde e quando/),
    ).toBeOnTheScreen()
  })

  it('creates the Event in Draft and opens it', async () => {
    await renderAs(OWNER, <NewEventScreen groupId={1} />)

    await fill()
    expect(field('Começa').props.value).toBe('04/12/2026')
    await press('Criar Event')

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalled())
    const events = await mockBackend.groupEvents(BRUNO, 1)
    const created = events.find((e) => e.name === 'Saída BH')
    expect(created).toMatchObject({
      place: 'Belo Horizonte, MG',
      period: { startDate: '2026-12-04', endDate: '2026-12-06', timezone: 'America/Sao_Paulo' },
      status: 'DRAFT',
    })
    expect(mockRouter.replace).toHaveBeenCalledWith(`/events/${created!.id}`)
  })

  it('picks the default timezone from the list', async () => {
    await renderAs(OWNER, <NewEventScreen groupId={1} />)
    await fill()
    await fireEvent.changeText(field('Nome do Event'), 'Saída Manaus de novo')

    await press('Fuso padrão dos itens: São Paulo (GMT−3)')
    await press('Manaus (GMT−4)')
    expect(
      screen.getByRole('button', { name: 'Fuso padrão dos itens: Manaus (GMT−4)' }),
    ).toBeOnTheScreen()
    await press('Criar Event')

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalled())
    const events = await mockBackend.groupEvents(BRUNO, 1)
    expect(events.find((e) => e.name === 'Saída Manaus de novo')?.period.timezone).toBe(
      'America/Manaus',
    )
  })

  it('refuses an end before the start on its field, sending nothing', async () => {
    await renderAs(OWNER, <NewEventScreen groupId={1} />)
    const before = (await mockBackend.groupEvents(BRUNO, 1)).length

    await fill()
    await fireEvent.changeText(field('Termina'), '03122026')
    await press('Criar Event')

    expect(screen.getByText('A data final não pode ser antes da inicial.')).toBeOnTheScreen()
    expect(await mockBackend.groupEvents(BRUNO, 1)).toHaveLength(before)
    expect(mockRouter.replace).not.toHaveBeenCalled()
  })

  it('shows the refusal of a Viewer, who has no business here', async () => {
    await renderAs(VIEWER, <NewEventScreen groupId={1} />)

    await fill()
    await press('Criar Event')

    expect(await screen.findByText('Você não tem permissão para esta ação.')).toBeOnTheScreen()
  })

  it('"Cancelar" goes back without creating', async () => {
    await renderAs(OWNER, <NewEventScreen groupId={1} />)

    await press('Cancelar')

    expect(mockRouter.back).toHaveBeenCalled()
  })
})

describe('EditEventScreen', () => {
  it('opens with the Event as it is', async () => {
    await renderAs(OWNER, <EditEventScreen eventId={3} />)

    expect(await screen.findByDisplayValue('Saída Manaus')).toBeOnTheScreen()
    expect(field('Cidade ou local').props.value).toBe('Manaus, AM')
    expect(field('Começa').props.value).toBe('20/11/2026')
    expect(field('Termina').props.value).toBe('22/11/2026')
    expect(
      screen.getByRole('button', { name: 'Fuso padrão dos itens: Manaus (GMT−4)' }),
    ).toBeOnTheScreen()
    expect(screen.queryByText(/nasce em rascunho/)).toBeNull()
  })

  it('saves what changed, also on a Finished event, and goes back', async () => {
    await renderAs(OWNER, <EditEventScreen eventId={1} />)
    await screen.findByDisplayValue('Gravação do clipe')

    await fireEvent.changeText(field('Cidade ou local'), 'Serra, ES')
    await press('Salvar')

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled())
    expect(await mockBackend.event(BRUNO, 1)).toMatchObject({
      name: 'Gravação do clipe',
      place: 'Serra, ES',
    })
  })
})

describe('EditEventScreen, without the right to edit', () => {
  it('tells a Viewer who opens it that they cannot edit, with no form', async () => {
    await renderAs(VIEWER, <EditEventScreen eventId={3} />)

    expect(await screen.findByText('Você não pode editar este Event.')).toBeOnTheScreen()
    expect(screen.queryByRole('button', { name: 'Salvar' })).toBeNull()
  })

  it('keeps a Cancelled Event frozen', async () => {
    await renderAs(OWNER, <EditEventScreen eventId={5} />)

    expect(await screen.findByText('Você não pode editar este Event.')).toBeOnTheScreen()
  })
})

describe('EventScreen', () => {
  it('shows the Owner an Event in Draft, with where, when and its timezone', async () => {
    await renderAs(OWNER, <EventScreen eventId={2} />)

    expect(await screen.findByText('Turnê Minas')).toBeOnTheScreen()
    expect(screen.getByText('RASCUNHO · o Group vê só onde e quando')).toBeOnTheScreen()
    expect(screen.getByText('Belo Horizonte, MG · 12 a 14 de mar. · GMT−3')).toBeOnTheScreen()
  })

  it('"Editar" opens the editing for the Owner', async () => {
    await renderAs(OWNER, <EventScreen eventId={2} />)
    await screen.findByText('Turnê Minas')

    await press('Editar')

    expect(mockRouter.push).toHaveBeenCalledWith('/events/2/edit')
  })

  it('lets the Owner edit a Finished event', async () => {
    await renderAs(OWNER, <EventScreen eventId={1} />)

    await screen.findByText('Gravação do clipe')
    expect(screen.getByRole('button', { name: 'Editar' })).toBeOnTheScreen()
  })

  it('shows a Viewer only where and when, without "Editar" or the Draft', async () => {
    await renderAs(VIEWER, <EventScreen eventId={2} />)

    expect(await screen.findByText('Turnê Minas')).toBeOnTheScreen()
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull()
    expect(screen.queryByText(/RASCUNHO/)).toBeNull()
  })

  it('freezes a Cancelled Event: no "Editar"', async () => {
    await renderAs(OWNER, <EventScreen eventId={5} />)

    await screen.findByText('Festival de Verão')
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull()
  })

  it('"Voltar" goes back', async () => {
    await renderAs(OWNER, <EventScreen eventId={2} />)
    await screen.findByText('Turnê Minas')

    await press('Voltar')

    expect(mockRouter.back).toHaveBeenCalled()
  })
})
