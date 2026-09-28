import { createMockAuthRepository } from '../mock'

describe('AuthRepository contract (mock)', () => {
  it('logs in the demo Super admin with the seeded credentials', async () => {
    const repo = createMockAuthRepository({ getToken: () => null })

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
    const repo = createMockAuthRepository({ getToken: () => null })

    await expect(
      repo.login({ email: 'admin@local.test', password: 'wrong' }),
    ).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      message: 'Email ou senha inválidos.',
    })
  })

  it('rejects a malformed email or empty password with VALIDATION_ERROR', async () => {
    const repo = createMockAuthRepository({ getToken: () => null })

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
    const repo = createMockAuthRepository({ getToken: () => token })
    const login = await repo.login({ email: 'admin@local.test', password: 'admin123' })
    token = login.token

    await expect(repo.me()).resolves.toEqual(login.user)
  })

  it('rejects me() with UNAUTHENTICATED without a valid token', async () => {
    const noToken = createMockAuthRepository({ getToken: () => null })
    const unknownToken = createMockAuthRepository({ getToken: () => 'revoked' })

    await expect(noToken.me()).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
    await expect(unknownToken.me()).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
  })
})
