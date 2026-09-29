import { createHttpClient } from '@/shared/lib/http'
import { useSession } from '@/shared/session'

import { createAuthRepository, createDemoSession } from '../api'
import { BASE_URL, createFakeApi } from './fake-api'

function setup({ isDev }: { isDev: boolean }) {
  const fetch = jest.fn(createFakeApi())
  const http = createHttpClient({
    baseUrl: BASE_URL,
    getToken: () => useSession.getState().session?.token ?? null,
    fetch,
  })
  return { repo: createAuthRepository({ isDev, http }), fetch }
}

const credentials = { email: 'admin@local.test', password: 'admin123' }

beforeEach(() => useSession.setState({ session: null }))

describe('authRepository selection', () => {
  it.each([true, false])('"Entrar" always calls the API (development build: %s)', async (isDev) => {
    const { repo, fetch } = setup({ isDev })

    await expect(repo.login(credentials)).resolves.toMatchObject({
      user: { email: credentials.email },
    })
    expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/auth/login`, expect.anything())
  })

  it('answers me() from the mock in Demo mode, without the API', async () => {
    const { repo, fetch } = setup({ isDev: true })
    useSession.setState({ session: createDemoSession() })

    await expect(repo.me()).resolves.toMatchObject({ email: 'admin@local.test' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('answers me() from the API in a Live session', async () => {
    const { repo, fetch } = setup({ isDev: true })
    const { token } = await repo.login(credentials)
    useSession.setState({ session: { ...createDemoSession(), token, live: true } })
    fetch.mockClear()

    await expect(repo.me()).resolves.toMatchObject({ email: 'admin@local.test' })
    expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/me`, expect.anything())
  })

  it('never uses the mock in a release build', async () => {
    const { repo, fetch } = setup({ isDev: false })
    useSession.setState({ session: createDemoSession() })

    await repo.me()
    expect(fetch).toHaveBeenCalled()
  })
})
