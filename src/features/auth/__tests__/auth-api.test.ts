import { API_URL } from '@/shared/lib/api-client'
import { createFakeApi } from '@/shared/mock-backend/fake-api'
import { useSession } from '@/shared/session'

import { authRepository, createDemoSession } from '../api'

// Which implementation answers is selectRepository's rule (shared/lib); this checks only the wiring.
let fetchSpy: jest.SpyInstance

beforeEach(() => {
  useSession.setState({ session: null })
  fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(createFakeApi({ baseUrl: API_URL }))
})

afterEach(() => fetchSpy.mockRestore())

describe('authRepository', () => {
  it('sends "Entrar" to the API, `auth` being live', async () => {
    await authRepository.login({ email: 'admin@local.test', password: 'admin123' })

    expect(fetchSpy).toHaveBeenCalledWith(`${API_URL}/auth/login`, expect.anything())
  })

  it('answers me() from the mock in Demo mode, without the API', async () => {
    useSession.setState({ session: createDemoSession('USER') })

    await expect(authRepository.me()).resolves.toMatchObject({ email: 'claudia.lima@gmail.com' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
