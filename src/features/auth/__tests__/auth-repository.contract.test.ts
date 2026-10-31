import { ApiError } from '@/shared/lib/api-error'
import { createHttpClient } from '@/shared/lib/http'
import { createMockBackend } from '@/shared/mock-backend'
import { BASE_URL, createFakeApi, json } from '@/shared/mock-backend/fake-api'
import { fakeTokenFor } from '@/shared/session/__tests__/fake-clerk'

import { createHttpAuthRepository, type AuthRepository } from '../api'
import { createMockAuthRepository } from '../mock'

/** Who Clerk says is signed in: the email, or null when signed out. */
type SignedInAs = string | null

const implementations: [string, (email: () => SignedInAs) => AuthRepository][] = [
  [
    'mock',
    (email) =>
      createMockAuthRepository({ getEmail: async () => email(), backend: createMockBackend() }),
  ],
  [
    'HTTP',
    (email) =>
      createHttpAuthRepository(
        createHttpClient({
          baseUrl: BASE_URL,
          getToken: async () => {
            const current = email()
            return current === null ? null : fakeTokenFor(current)
          },
          fetch: createFakeApi(),
        }),
      ),
  ],
]

describe.each(implementations)('AuthRepository contract (%s)', (_, createRepository) => {
  it('returns the Owner with the Membership in each Group', async () => {
    const repo = createRepository(() => 'bruno.reis@example.com')

    await expect(repo.me()).resolves.toEqual({
      id: 2,
      name: 'Bruno Reis',
      email: 'bruno.reis@example.com',
      phone: '+5527999990002',
      isSuperAdmin: false,
      memberships: [{ groupId: 1, groupName: 'Vocal Livre', role: 'OWNER' }],
    })
  })

  it('returns the Super admin without a Membership', async () => {
    const repo = createRepository(() => 'admin@local.test')

    await expect(repo.me()).resolves.toMatchObject({ isSuperAdmin: true, memberships: [] })
  })

  it('finds the User whatever the case of the email Clerk verified', async () => {
    const repo = createRepository(() => 'Lu.Andrade@example.com')

    await expect(repo.me()).resolves.toMatchObject({
      id: 5,
      memberships: [{ groupId: 1, groupName: 'Vocal Livre', role: 'VIEWER' }],
    })
  })

  it('refuses an email of no User with USER_NOT_INVITED and the API message', async () => {
    const repo = createRepository(() => 'someone.else@gmail.com')

    await expect(repo.me()).rejects.toMatchObject({
      code: 'USER_NOT_INVITED',
      message:
        'Nenhum usuário da plataforma tem este email. Entre com o email que recebeu o link de ativação.',
    })
  })

  it('refuses a Deactivated user with USER_DEACTIVATED', async () => {
    const repo = createRepository(() => 'carla.dias@example.com')

    await expect(repo.me()).rejects.toMatchObject({ code: 'USER_DEACTIVATED' })
  })

  it('refuses with UNAUTHENTICATED when signed out of Clerk', async () => {
    const repo = createRepository(() => null)

    await expect(repo.me()).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
  })
})

describe('AuthRepository over HTTP', () => {
  function setup(fetch: typeof globalThis.fetch, sessionId: string | null = 'sess_1') {
    const onSessionRefused = jest.fn()
    const repo = createHttpAuthRepository(
      createHttpClient({
        baseUrl: BASE_URL,
        getToken: async () => fakeTokenFor('bruno.reis@example.com'),
        getSessionId: () => sessionId,
        onSessionRefused,
        fetch,
      }),
    )
    return { repo, onSessionRefused }
  }

  it('asks Clerk for the token on every request and sends it as Bearer', async () => {
    const fetch = jest.fn(createFakeApi())
    const { repo } = setup(fetch)

    await repo.me()

    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/me`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${fakeTokenFor('bruno.reis@example.com')}`,
        }),
      }),
    )
  })

  it('turns a body that is not the envelope into INTERNAL_ERROR with the HTTP status', async () => {
    const { repo } = setup(async () => new Response('<html>Bad Gateway</html>', { status: 502 }))

    const error = await repo.me().catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: 'INTERNAL_ERROR', details: { status: 502 } })
  })

  it('turns a success whose data does not match the contract into INTERNAL_ERROR', async () => {
    const { repo } = setup(async () => json(200, { data: { id: 'x' } }))

    await expect(repo.me()).rejects.toMatchObject({ code: 'INTERNAL_ERROR' })
  })

  it('maps a fetch failure to NETWORK with a message that does not name the server', async () => {
    const { repo } = setup(async () => {
      throw new TypeError('Network request failed')
    })

    await expect(repo.me()).rejects.toMatchObject({
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

      const result = repo.me().catch((e: unknown) => e)
      await jest.advanceTimersByTimeAsync(15_000)

      await expect(result).resolves.toMatchObject({ code: 'NETWORK' })
    } finally {
      jest.useRealTimers()
    }
  })

  it.each(['UNAUTHENTICATED', 'USER_DEACTIVATED'])(
    'signals the refused Session, as it was when the request started, on %s',
    async (code) => {
      const { repo, onSessionRefused } = setup(async () =>
        json(401, { error: { code, message: 'x' } }),
      )

      await expect(repo.me()).rejects.toMatchObject({ code })

      expect(onSessionRefused).toHaveBeenCalledTimes(1)
      expect(onSessionRefused).toHaveBeenCalledWith('sess_1', code)
    },
  )

  it('does not signal a refused Session on USER_NOT_INVITED, a 401 too', async () => {
    const { repo, onSessionRefused } = setup(async () =>
      json(401, { error: { code: 'USER_NOT_INVITED', message: 'x' } }),
    )

    await expect(repo.me()).rejects.toMatchObject({ code: 'USER_NOT_INVITED' })

    expect(onSessionRefused).not.toHaveBeenCalled()
  })
})
