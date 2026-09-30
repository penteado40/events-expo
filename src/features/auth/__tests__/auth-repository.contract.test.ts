import { ApiError } from '@/shared/lib/api-error'
import { createHttpClient } from '@/shared/lib/http'

import { createMockBackend } from '@/shared/mock-backend'
import { BASE_URL, createFakeApi, json } from '@/shared/mock-backend/fake-api'

import { createHttpAuthRepository, type AuthRepository } from '../api'
import { createMockAuthRepository } from '../mock'

type GetToken = () => string | null

const implementations: [string, (getToken: GetToken) => AuthRepository][] = [
  ['mock', (getToken) => createMockAuthRepository({ getToken, backend: createMockBackend() })],
  [
    'HTTP',
    (getToken) =>
      createHttpAuthRepository(
        createHttpClient({ baseUrl: BASE_URL, getToken, fetch: createFakeApi() }),
      ),
  ],
]

describe.each(implementations)('AuthRepository contract (%s)', (_, createRepository) => {
  it('logs in the demo Super admin with the seeded credentials', async () => {
    const repo = createRepository(() => null)

    const { token, user } = await repo.login({ email: 'admin@local.test', password: 'admin123' })

    expect(token).toEqual(expect.any(String))
    expect(user).toEqual({
      id: 1,
      name: 'Admin Local',
      email: 'admin@local.test',
      role: 'SUPER_ADMIN',
      createdAt: '2026-01-01T12:00:00.000Z',
    })
  })

  it('rejects a wrong password with INVALID_CREDENTIALS and the API message', async () => {
    const repo = createRepository(() => null)

    await expect(
      repo.login({ email: 'admin@local.test', password: 'wrong' }),
    ).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      message: 'Email ou senha inválidos.',
    })
  })

  it('rejects a malformed email or empty password with VALIDATION_ERROR', async () => {
    const repo = createRepository(() => null)

    await expect(repo.login({ email: 'not-an-email', password: 'admin123' })).rejects.toMatchObject(
      {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos.',
      },
    )
    await expect(repo.login({ email: 'admin@local.test', password: '' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    })
  })

  it('returns the logged-in User from me() with the token from login', async () => {
    let token: string | null = null
    const repo = createRepository(() => token)
    const login = await repo.login({ email: 'admin@local.test', password: 'admin123' })
    token = login.token

    await expect(repo.me()).resolves.toEqual(login.user)
  })

  it('rejects me() with UNAUTHENTICATED without a valid token', async () => {
    const noToken = createRepository(() => null)
    const unknownToken = createRepository(() => 'revoked')

    await expect(noToken.me()).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
    await expect(unknownToken.me()).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
  })
})

describe('AuthRepository over HTTP', () => {
  const credentials = { email: 'admin@local.test', password: 'admin123' }

  function setup(fetch: typeof globalThis.fetch, token: string | null = null) {
    const onUnauthenticated = jest.fn()
    const repo = createHttpAuthRepository(
      createHttpClient({ baseUrl: BASE_URL, getToken: () => token, onUnauthenticated, fetch }),
    )
    return { repo, onUnauthenticated }
  }

  it('passes an error code the app does not list through with the API message', async () => {
    const message = 'Usuário ainda não ativado. Use o link de ativação que você recebeu.'
    const { repo } = setup(async () => json(403, { error: { code: 'USER_PENDING', message } }))

    await expect(repo.login(credentials)).rejects.toEqual(
      expect.objectContaining({ code: 'USER_PENDING', message }),
    )
  })

  it('turns a body that is not the envelope into INTERNAL_ERROR with the HTTP status', async () => {
    const { repo } = setup(async () => new Response('<html>Bad Gateway</html>', { status: 502 }))

    const error = await repo.login(credentials).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: 'INTERNAL_ERROR', details: { status: 502 } })
  })

  it('turns a success whose data does not match the contract into INTERNAL_ERROR', async () => {
    const { repo } = setup(async () => json(200, { data: { token: 'jwt', user: { id: 'x' } } }))

    await expect(repo.login(credentials)).rejects.toMatchObject({ code: 'INTERNAL_ERROR' })
  })

  it('maps a fetch failure to NETWORK with a message that does not name the server', async () => {
    const { repo } = setup(async () => {
      throw new TypeError('Network request failed')
    })

    await expect(repo.login(credentials)).rejects.toMatchObject({
      code: 'NETWORK',
      message: 'Não foi possível conectar. Verifique sua internet e tente de novo.',
    })
  })

  it('maps an API that does not answer within 15 s to NETWORK', async () => {
    jest.useFakeTimers()
    try {
      const { repo } = setup(
        (_, init) =>
          new Promise((_resolve, reject) =>
            init?.signal?.addEventListener('abort', () => reject(new Error('Aborted'))),
          ),
      )

      const result = repo.login(credentials).catch((e: unknown) => e)
      await jest.advanceTimersByTimeAsync(14_999)
      await jest.advanceTimersByTimeAsync(1)

      await expect(result).resolves.toMatchObject({
        code: 'NETWORK',
        message: 'Não foi possível conectar. Verifique sua internet e tente de novo.',
      })
    } finally {
      jest.useRealTimers()
    }
  })

  it('signals an expired session with the token used when the API answers UNAUTHENTICATED', async () => {
    const { repo, onUnauthenticated } = setup(createFakeApi(), 'revoked')

    await expect(repo.me()).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })

    expect(onUnauthenticated).toHaveBeenCalledTimes(1)
    expect(onUnauthenticated).toHaveBeenCalledWith('revoked')
  })

  it('does not signal an expired session on a wrong password, a 401 too', async () => {
    const { repo, onUnauthenticated } = setup(createFakeApi())

    await expect(repo.login({ ...credentials, password: 'wrong' })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    })

    expect(onUnauthenticated).not.toHaveBeenCalled()
  })
})
