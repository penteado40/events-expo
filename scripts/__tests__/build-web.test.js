const { webBuildEnv } = require('../build-web')

const KEY = 'pk_test_dummy'

describe('webBuildEnv', () => {
  it('maps API_URL and CLERK_PUBLISHABLE_KEY to the EXPO_PUBLIC_ names Expo inlines', () => {
    const env = webBuildEnv({
      PATH: '/usr/bin',
      API_URL: 'https://api.example.com/api/v1',
      CLERK_PUBLISHABLE_KEY: KEY,
    })

    expect(env).toMatchObject({
      PATH: '/usr/bin',
      EXPO_PUBLIC_API_URL: 'https://api.example.com/api/v1',
      EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: KEY,
    })
  })

  it('fails naming every missing or blank variable', () => {
    expect(() => webBuildEnv({ CLERK_PUBLISHABLE_KEY: ' ' })).toThrow(
      /API_URL, CLERK_PUBLISHABLE_KEY/,
    )
  })

  it('falls back to the Demo build on a Vercel preview deploy missing a variable', () => {
    const env = webBuildEnv({ VERCEL_ENV: 'preview', API_URL: 'https://api.example.com' })
    expect(env.EXPO_PUBLIC_DEMO_BUILD).toBe('true')
    expect(env.EXPO_PUBLIC_API_URL).toBeUndefined()
    expect(env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY).toBeUndefined()
  })

  it('builds against the API on a Vercel preview deploy that has both variables', () => {
    const env = webBuildEnv({
      VERCEL_ENV: 'preview',
      API_URL: 'https://api.example.com',
      CLERK_PUBLISHABLE_KEY: KEY,
    })
    expect(env.EXPO_PUBLIC_DEMO_BUILD).toBeUndefined()
    expect(env.EXPO_PUBLIC_API_URL).toBe('https://api.example.com')
  })

  it('still fails a Vercel production deploy missing a variable', () => {
    expect(() => webBuildEnv({ VERCEL_ENV: 'production' })).toThrow(/API_URL/)
  })

  it("accepts a pk_live_ key, from Clerk's production instance", () => {
    const env = webBuildEnv({
      API_URL: 'https://api.example.com',
      CLERK_PUBLISHABLE_KEY: 'pk_live_x',
    })
    expect(env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY).toBe('pk_live_x')
  })

  it('refuses a key that is not a publishable one, such as a secret key', () => {
    expect(() =>
      webBuildEnv({ API_URL: 'https://api.example.com', CLERK_PUBLISHABLE_KEY: 'sk_live_x' }),
    ).toThrow(/publishable/)
  })

  it('refuses values with surrounding spaces, which the EAS workflow would inline as they are', () => {
    expect(() =>
      webBuildEnv({ API_URL: 'https://api.example.com', CLERK_PUBLISHABLE_KEY: `${KEY} ` }),
    ).toThrow(/publishable/)
    expect(() =>
      webBuildEnv({ API_URL: ' https://api.example.com', CLERK_PUBLISHABLE_KEY: KEY }),
    ).toThrow(/API_URL/)
  })

  it('refuses an API_URL that is not an http(s) URL', () => {
    expect(() => webBuildEnv({ API_URL: 'api.example.com', CLERK_PUBLISHABLE_KEY: KEY })).toThrow(
      /API_URL/,
    )
  })
})
