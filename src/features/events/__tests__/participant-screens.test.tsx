import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { Linking } from 'react-native'

import { mockBackend } from '@/shared/mock-backend'
import { useSession, userSchema } from '@/shared/session'

import { EventScreen } from '../components/event-screen'
import { ItemScreen } from '../components/item-screen'
import { TimelineScreen } from '../components/timeline-screen'

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() }
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }))

const OWNER = 2
const LU = 5
const MINAS = 2
const MANAUS = 3
const CHECK_IN = 4
const TRANSLADO = 8

async function renderAs(userId: number, ui: React.ReactElement) {
  const user = userSchema.parse(mockBackend.user(userId))
  useSession.setState({ session: { id: `demo-${userId}`, user, live: false } })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  await render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }))

beforeEach(() => {
  mockRouter.push.mockClear()
  mockRouter.replace.mockClear()
})

describe('publishing the Event', () => {
  it('"Publicar" takes the Owner\'s Event out of Draft, its badge and the button going', async () => {
    await renderAs(OWNER, <EventScreen eventId={MINAS} />)
    expect(await screen.findByText('RASCUNHO · o Group vê só onde e quando')).toBeOnTheScreen()

    await press('Publicar')

    expect(await screen.findByText('Turnê Minas')).toBeOnTheScreen()
    expect(screen.queryByText('RASCUNHO · o Group vê só onde e quando')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull()
  })

  it('offers no "Publicar" on a published Event', async () => {
    await renderAs(OWNER, <EventScreen eventId={MANAUS} />)

    expect(await screen.findByText('Saída Manaus')).toBeOnTheScreen()
    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull()
  })
})

describe('the Summary, for a Participant', () => {
  it('shows "VOCÊ VAI", where in its timezone, and only the Highlights, theirs for the people', async () => {
    await renderAs(LU, <EventScreen eventId={MANAUS} />)

    expect(await screen.findByText('Seu quarto: 101')).toBeOnTheScreen()
    expect(screen.getByText('VOCÊ VAI')).toBeOnTheScreen()
    expect(screen.getByText('horário de Manaus')).toBeOnTheScreen()
    expect(screen.getByText('Seu carro: Carro 1 - EC')).toBeOnTheScreen()
    expect(screen.getByText('Contato: Técnico do teatro: (92) 98888-0000')).toBeOnTheScreen()
    expect(screen.queryByText(/Quarto 102/)).toBeNull()
    expect(screen.queryByText(/Despachar o som/)).toBeNull()
  })

  it("opens an item from its card, and the Timeline from the Event's bar", async () => {
    await renderAs(LU, <EventScreen eventId={MANAUS} />)

    await fireEvent.press(await screen.findByRole('button', { name: /Check-in · Hotel Taj Mahal/ }))
    expect(mockRouter.push).toHaveBeenCalledWith(`/events/${MANAUS}/items/${CHECK_IN}`)

    await fireEvent.press(screen.getByRole('tab', { name: 'Timeline' }))
    expect(mockRouter.replace).toHaveBeenCalledWith(`/events/${MANAUS}/timeline`)
  })
})

describe('the Timeline, for a Participant', () => {
  it('shows the days, the eve outside the period too, and their own car on the item', async () => {
    await renderAs(LU, <TimelineScreen eventId={MANAUS} />)

    expect(await screen.findByRole('button', { name: 'Ir para Qui 19' })).toBeOnTheScreen()
    expect(screen.getByText('FORA DO PERÍODO')).toBeOnTheScreen()
    expect(screen.getByText('Seu carro: Carro 1 - EC')).toBeOnTheScreen()
    expect(screen.queryByRole('button', { name: '+ Item' })).toBeNull()
  })

  it('opens the item itself, not its actions', async () => {
    await renderAs(LU, <TimelineScreen eventId={MANAUS} />)

    await fireEvent.press(await screen.findByRole('button', { name: /Translado de volta/ }))

    expect(mockRouter.push).toHaveBeenCalledWith(`/events/${MANAUS}/items/${TRANSLADO}`)
  })
})

describe('the Event item, for a Participant', () => {
  it('shows their own private note, not the others\', and the notes for all behind "Ver todos"', async () => {
    await renderAs(LU, <ItemScreen eventId={MANAUS} itemId={CHECK_IN} />)

    expect(await screen.findByText('Cama extra pedida')).toBeOnTheScreen()
    expect(screen.getByText('Sua nota · só você e a produção')).toBeOnTheScreen()
    expect(screen.getByText('Seu quarto: 101')).toBeOnTheScreen()
    expect(screen.queryByText('Chega depois do show')).toBeNull()
    expect(screen.queryByText('Acorda cedo')).toBeNull()

    await press('Ver todos')

    expect(screen.getByText('Acorda cedo')).toBeOnTheScreen()
    expect(screen.queryByText('Chega depois do show')).toBeNull()
  })

  it('marks a loose name "SEM LOGIN" and opens a Participant\'s WhatsApp', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)
    await renderAs(LU, <ItemScreen eventId={MANAUS} itemId={TRANSLADO} />)

    expect(await screen.findByText('Seu Raimundo')).toBeOnTheScreen()
    expect(screen.getByText('SEM LOGIN')).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('link', { name: 'Abrir WhatsApp de Matias Costa' }))

    expect(openURL).toHaveBeenCalledWith('https://wa.me/5527999990003')
  })
})
