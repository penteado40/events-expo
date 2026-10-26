import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, screen } from '@testing-library/react-native'
import { router, useLocalSearchParams } from 'expo-router'
import Tabs from 'expo-router/js-tabs'
import { renderRouter } from 'expo-router/testing-library'
import { Text } from 'react-native'

import { mockTokenFor } from '@/shared/mock-backend'
import { SAMPLE_DATE } from '@/shared/mock-backend/data'
import { useSession, type User } from '@/shared/session'

import { HomeScreen } from '../components/home-screen'
import { pinClock } from './pin-clock'

jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

const claudia: User = {
  id: 7,
  name: 'Cláudia Lima',
  email: 'claudia@example.com',
  role: 'USER',
  createdAt: '2026-09-27T22:58:10.000Z',
}

/** Stands in for the Event detail: which Event and tab it was opened on. */
function Detail() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>()
  return <Text>{`detalhe ${id} ${tab ?? 'summary'}`}</Text>
}

async function renderHome() {
  useSession.setState({ session: { token: mockTokenFor(claudia), user: claudia, live: false } })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Home = () => (
    <QueryClientProvider client={client}>
      <HomeScreen />
    </QueryClientProvider>
  )
  await renderRouter({ index: Home, 'events/[id]': Detail }, { initialUrl: '/' })
}

pinClock(SAMPLE_DATE)

describe('Início → Conferir → back', () => {
  it('opens the row on Conferir and comes back to Início', async () => {
    await renderHome()

    await fireEvent.press(await screen.findByRole('button', { name: /^Marcos, 40/ }))
    expect(await screen.findByText('detalhe 14 contributions')).toBeOnTheScreen()

    await act(async () => router.back())
    expect(screen.queryByText('detalhe 14 contributions')).toBeNull()
    expect(await screen.findByRole('button', { name: /^Marcos, 40/ })).toBeOnTheScreen()
  })
})

describe('Início → Resumo → back', () => {
  it('opens the Acontecendo agora card on Resumo and comes back to Início', async () => {
    const name = /^Acontecendo agora/
    const id = 17
    await renderHome()

    await fireEvent.press(await screen.findByRole('button', { name }))
    expect(await screen.findByText(`detalhe ${id} summary`)).toBeOnTheScreen()

    await act(async () => router.back())
    expect(screen.queryByText(`detalhe ${id} summary`)).toBeNull()
    expect(await screen.findByRole('button', { name })).toBeOnTheScreen()
  })
})

describe('Início → expanded Próximos eventos', () => {
  const stack = /^Próximo evento: Chá da Júlia/

  it('opens an Event from the list on Resumo, and comes back with the list closed', async () => {
    await renderHome()

    await fireEvent.press(await screen.findByRole('button', { name: stack }))
    expect(screen.getByRole('button', { name: 'Chá da Júlia, em 10 dias' })).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('button', { name: 'Marcos, 40, em 23 dias' }))
    expect(await screen.findByText('detalhe 14 summary')).toBeOnTheScreen()

    await act(async () => router.back())
    expect(await screen.findByRole('button', { name: stack })).toBeOnTheScreen()
    expect(screen.queryByText('PRÓXIMOS 30 DIAS')).toBeNull()
  })

  it('is closed on coming back from another tab', async () => {
    useSession.setState({ session: { token: mockTokenFor(claudia), user: claudia, live: false } })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const Home = () => (
      <QueryClientProvider client={client}>
        <HomeScreen />
      </QueryClientProvider>
    )
    await renderRouter(
      {
        '(tabs)/_layout': () => <Tabs />,
        '(tabs)/index': Home,
        '(tabs)/events': () => <Text>eventos</Text>,
      },
      { initialUrl: '/' },
    )

    await fireEvent.press(await screen.findByRole('button', { name: stack }))
    expect(screen.getByText('PRÓXIMOS 30 DIAS')).toBeOnTheScreen()

    await act(async () => router.navigate('/events'))
    await act(async () => router.navigate('/'))
    expect(await screen.findByRole('button', { name: stack })).toBeOnTheScreen()
    expect(screen.queryByText('PRÓXIMOS 30 DIAS')).toBeNull()
  })
})
