import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'

import { API_URL } from '@/shared/lib/api-client'
import { createFakeApi, json } from '@/shared/mock-backend/fake-api'
import { mockBackend } from '@/shared/mock-backend'
import { useSession, userSchema } from '@/shared/session'
import { fakeClerk } from '@/shared/session/__tests__/fake-clerk'

import { EditProfileScreen } from '../components/edit-profile-screen'
import { ProfileScreen } from '../components/profile-screen'

const mockRouter = { push: jest.fn(), back: jest.fn() }
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }))

const USERS = {
  owner: 'bruno.reis@example.com',
  viewer: 'lu.andrade@example.com',
  superAdmin: 'admin@local.test',
} as const

/** A Live session of a sample User: `/me` is live, so its calls go to the fake API. */
function signInLive(email: string) {
  fakeClerk.restore(email)
  const user = userSchema.parse(
    mockBackend.user({ [USERS.owner]: 2, [USERS.viewer]: 5, [USERS.superAdmin]: 1 }[email]!),
  )
  useSession.setState({ session: { id: fakeClerk.session!.id, user, live: true } })
}

async function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false, gcTime: Infinity } },
  })
  await render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

let fetchSpy: jest.SpyInstance

beforeEach(() => {
  mockRouter.push.mockClear()
  mockRouter.back.mockClear()
  fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(createFakeApi({ baseUrl: API_URL }))
})

afterEach(() => fetchSpy.mockRestore())

describe('ProfileScreen', () => {
  it('shows the name, the email, the phone and each Group with the role there', async () => {
    signInLive(USERS.viewer)

    await renderWithQuery(<ProfileScreen />)

    expect(screen.getByText('Lu Andrade')).toBeOnTheScreen()
    expect(screen.getByText('+55 27 99999-0005')).toBeOnTheScreen()
    expect(screen.getAllByText('lu.andrade@example.com').length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Vocal Livre, Viewer')).toBeOnTheScreen()
    expect(screen.getByLabelText('Coral Jovem Vitória, Viewer')).toBeOnTheScreen()
  })

  it('shows Owner where the person is an Owner', async () => {
    signInLive(USERS.owner)

    await renderWithQuery(<ProfileScreen />)

    expect(screen.getByLabelText('Vocal Livre, Owner')).toBeOnTheScreen()
  })

  it('shows the Super admin as such, with no Groups of their own', async () => {
    signInLive(USERS.superAdmin)

    await renderWithQuery(<ProfileScreen />)

    expect(screen.getByText('Super admin')).toBeOnTheScreen()
    expect(screen.queryByText('Seus Groups')).toBeNull()
  })

  it('opens the editing from "Editar"', async () => {
    signInLive(USERS.viewer)
    await renderWithQuery(<ProfileScreen />)

    await fireEvent.press(screen.getByRole('button', { name: 'Editar perfil' }))

    expect(mockRouter.push).toHaveBeenCalledWith('/profile/edit')
  })

  it('"Sair" ends the Session, back to the login', async () => {
    signInLive(USERS.viewer)
    await renderWithQuery(<ProfileScreen />)

    await fireEvent.press(screen.getByRole('button', { name: 'Sair' }))

    expect(useSession.getState().session).toBeNull()
  })
})

describe('EditProfileScreen', () => {
  async function renderEdit() {
    await renderWithQuery(<EditProfileScreen />)
  }

  const nameField = () => screen.getByLabelText('Nome')
  const phoneField = () => screen.getByLabelText('Telefone com DDI')
  const save = () => fireEvent.press(screen.getByRole('button', { name: 'Salvar' }))
  const patchCalls = () =>
    fetchSpy.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'PATCH')

  it('starts with the current name and phone, and shows the email without letting it change', async () => {
    signInLive(USERS.viewer)

    await renderEdit()

    expect(nameField().props.value).toBe('Lu Andrade')
    expect(phoneField().props.value).toBe('+55 27 99999-0005')
    expect(screen.getByText('lu.andrade@example.com')).toBeOnTheScreen()
    expect(screen.queryByDisplayValue('lu.andrade@example.com')).toBeNull()
  })

  it('saves the name and the phone, updates the Session and goes back', async () => {
    signInLive(USERS.viewer)
    await renderEdit()

    await fireEvent.changeText(nameField(), 'Lu Andrade Lima')
    await fireEvent.changeText(phoneField(), '+55 27 98888-7777')
    await save()

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled())
    expect(useSession.getState().session?.user).toMatchObject({
      name: 'Lu Andrade Lima',
      phone: '+5527988887777',
    })
    expect(JSON.parse(String((patchCalls()[0][1] as RequestInit).body))).toEqual({
      name: 'Lu Andrade Lima',
      phone: '+55 27 98888-7777',
    })
  })

  it('sends only what changed', async () => {
    signInLive(USERS.viewer)
    await renderEdit()

    await fireEvent.changeText(nameField(), 'Lu A.')
    await save()

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled())
    expect(JSON.parse(String((patchCalls()[0][1] as RequestInit).body))).toEqual({
      name: 'Lu A.',
    })
  })

  it('goes back without a request when nothing changed', async () => {
    signInLive(USERS.viewer)
    await renderEdit()

    await save()

    expect(mockRouter.back).toHaveBeenCalled()
    expect(patchCalls()).toHaveLength(0)
  })

  it('shows an invalid phone on its field before sending anything', async () => {
    signInLive(USERS.viewer)
    await renderEdit()

    await fireEvent.changeText(phoneField(), '+55 27 9973')
    await save()

    expect(
      screen.getByText('Telefone incompleto. Use o formato +55 27 99999-9999.'),
    ).toBeOnTheScreen()
    expect(patchCalls()).toHaveLength(0)
    expect(mockRouter.back).not.toHaveBeenCalled()
  })

  it('asks for a name before sending anything', async () => {
    signInLive(USERS.viewer)
    await renderEdit()

    await fireEvent.changeText(nameField(), '  ')
    await save()

    expect(screen.getByText('Informe seu nome.')).toBeOnTheScreen()
    expect(patchCalls()).toHaveLength(0)
  })

  it('shows on the phone field a 400 the API answers for it', async () => {
    signInLive(USERS.viewer)
    fetchSpy.mockImplementation(async () =>
      json(400, { error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.' } }),
    )
    await renderEdit()

    await fireEvent.changeText(phoneField(), '+55 27 98888-7777')
    await save()

    expect(
      await screen.findByText('Telefone inválido. Use o formato +55 27 99999-9999.'),
    ).toBeOnTheScreen()
    expect(mockRouter.back).not.toHaveBeenCalled()
    expect(useSession.getState().session?.user.phone).toBe('+5527999990005')
  })

  it('shows on the name field a 400 whose details name it', async () => {
    signInLive(USERS.viewer)
    fetchSpy.mockImplementation(async () =>
      json(400, {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados inválidos.',
          details: [{ path: 'name', message: 'Too big' }],
        },
      }),
    )
    await renderEdit()

    await fireEvent.changeText(nameField(), 'Lu Andrade Lima')
    await save()

    expect(await screen.findByText('Use um nome de até 100 caracteres.')).toBeOnTheScreen()
  })

  it('says so when it cannot reach the API, keeping what was typed', async () => {
    signInLive(USERS.viewer)
    fetchSpy.mockImplementation(async () => {
      throw new TypeError('Network request failed')
    })
    await renderEdit()

    await fireEvent.changeText(nameField(), 'Lu A.')
    await save()

    expect(
      await screen.findByText('Não foi possível conectar. Verifique sua internet e tente de novo.'),
    ).toBeOnTheScreen()
    expect(nameField().props.value).toBe('Lu A.')
  })

  it('"Cancelar" goes back without saving', async () => {
    signInLive(USERS.viewer)
    await renderEdit()

    await fireEvent.changeText(nameField(), 'Outro nome')
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }))

    expect(mockRouter.back).toHaveBeenCalled()
    expect(patchCalls()).toHaveLength(0)
    expect(useSession.getState().session?.user.name).toBe('Lu Andrade')
  })
})
