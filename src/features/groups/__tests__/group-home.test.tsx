import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { Pressable, Text } from 'react-native'

import { networkError } from '@/shared/lib/api-error'
import { mockBackend } from '@/shared/mock-backend'
import { useSession, userSchema, type Session } from '@/shared/session'

import { GroupHome } from '../components/group-home'
import { useGroupChoice } from '../group-choice-store'

function demoSession(userId: number): Session {
  const user = userSchema.parse(mockBackend.user(userId))
  return { id: `demo-${userId}`, user, live: false }
}

async function renderHome(onRefresh?: () => Promise<unknown>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <GroupHome onRefresh={onRefresh}>
        {({ group, switcher, refresh }) => (
          <>
            <Text>
              Início de {group.name} como {group.role}
            </Text>
            {switcher}
            <Pressable accessibilityRole="button" accessibilityLabel="Puxar" onPress={refresh} />
          </>
        )}
      </GroupHome>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  useGroupChoice.setState({ chosenBy: {} })
})

afterEach(() => jest.restoreAllMocks())

describe('GroupHome', () => {
  it("opens on the person's first Group, with their role there", async () => {
    useSession.setState({ session: demoSession(5) })

    await renderHome()

    expect(await screen.findByText('Início de Coral Jovem Vitória como VIEWER')).toBeOnTheScreen()
  })

  it('switches Group from the "Seus Groups" sheet and remembers the choice', async () => {
    useSession.setState({ session: demoSession(5) })
    await renderHome()

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Coral Jovem Vitória, trocar de Group' }),
    )
    expect(screen.getByText(/^Seus Groups/)).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('button', { name: 'Vocal Livre, Viewer' }))

    expect(await screen.findByText('Início de Vocal Livre como VIEWER')).toBeOnTheScreen()
    expect(useGroupChoice.getState().chosenBy[5]).toBe(1)
  })

  it('opens on the remembered Group', async () => {
    useSession.setState({ session: demoSession(5) })
    useGroupChoice.setState({ chosenBy: { 5: 1 } })

    await renderHome()

    expect(await screen.findByText('Início de Vocal Livre como VIEWER')).toBeOnTheScreen()
  })

  it('says so to someone in no Group, and "Atualizar" looks again', async () => {
    useSession.setState({ session: demoSession(5) })
    jest.spyOn(mockBackend, 'groups').mockResolvedValueOnce([])
    await renderHome()

    expect(await screen.findByText('Você ainda não está em nenhum Group')).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('button', { name: 'Atualizar' }))

    expect(await screen.findByText('Início de Coral Jovem Vitória como VIEWER')).toBeOnTheScreen()
  })

  it('lets someone in no Group sign in with another account', async () => {
    useSession.setState({ session: demoSession(7) })
    await renderHome()

    await fireEvent.press(await screen.findByRole('button', { name: 'Entrar com outra conta' }))

    expect(useSession.getState().session).toBeNull()
  })

  it('shows the error and tries again', async () => {
    useSession.setState({ session: demoSession(5) })
    jest.spyOn(mockBackend, 'groups').mockRejectedValueOnce(networkError(new Error('offline')))
    await renderHome()

    expect(
      await screen.findByText('Não foi possível conectar. Verifique sua internet e tente de novo.'),
    ).toBeOnTheScreen()
    await fireEvent.press(await screen.findByRole('button', { name: 'Tentar de novo' }))

    await waitFor(() =>
      expect(screen.getByText('Início de Coral Jovem Vitória como VIEWER')).toBeOnTheScreen(),
    )
  })

  it('gives the Início a refresh that reloads the Groups and the User', async () => {
    useSession.setState({ session: demoSession(5) })
    const onRefresh = jest.fn(async () => {})
    await renderHome(onRefresh)
    await screen.findByText(/^Início de/)
    const listGroups = jest.spyOn(mockBackend, 'groups')

    await fireEvent.press(screen.getByRole('button', { name: 'Puxar' }))

    await waitFor(() => expect(listGroups).toHaveBeenCalledTimes(1))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })
})
