import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, screen } from '@testing-library/react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { renderRouter } from 'expo-router/testing-library'
import { Text } from 'react-native'

import { mockTokenFor } from '@/shared/mock-backend'
import { useSession, type User } from '@/shared/session'

import { HomeScreen } from '../components/home-screen'

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

describe('Início → Conferir → back', () => {
  it('opens the row on Conferir and comes back to Início', async () => {
    useSession.setState({ session: { token: mockTokenFor(claudia), user: claudia, live: false } })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const Home = () => (
      <QueryClientProvider client={client}>
        <HomeScreen />
      </QueryClientProvider>
    )
    await renderRouter({ index: Home, 'events/[id]': Detail }, { initialUrl: '/' })

    await fireEvent.press(await screen.findByRole('button', { name: /^Marcos, 40/ }))
    expect(await screen.findByText('detalhe 14 contributions')).toBeOnTheScreen()

    await act(async () => router.back())
    expect(screen.queryByText('detalhe 14 contributions')).toBeNull()
    expect(await screen.findByRole('button', { name: /^Marcos, 40/ })).toBeOnTheScreen()
  })
})
