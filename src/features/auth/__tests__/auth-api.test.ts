import { createAuthRepository } from '../api'

describe('authRepository selection', () => {
  it('logs in against the mock in a development build', async () => {
    const repo = createAuthRepository({ isDev: true })

    await expect(
      repo.login({ email: 'admin@local.test', password: 'admin123' }),
    ).resolves.toMatchObject({ user: { email: 'admin@local.test' } })
  })

  it('never signs in against the mock in a release build', async () => {
    const repo = createAuthRepository({ isDev: false })

    await expect(
      repo.login({ email: 'admin@local.test', password: 'admin123' }),
    ).rejects.toMatchObject({ code: 'INTERNAL_ERROR' })
    await expect(repo.me()).rejects.toMatchObject({ code: 'INTERNAL_ERROR' })
  })
})
