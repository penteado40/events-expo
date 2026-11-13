const { webBuildEnv } = require('../build-web')

const KEY = 'pk_test_ZHVtbXkuY2xlcmsuYWNjb3VudHMuZGV2JA'

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

  it('refuses a pk_live_ key', () => {
    expect(() =>
      webBuildEnv({ API_URL: 'https://api.example.com', CLERK_PUBLISHABLE_KEY: 'pk_live_x' }),
    ).toThrow(/pk_live_/)
  })

  it('refuses a key that is not a pk_test_ one', () => {
    expect(() =>
      webBuildEnv({ API_URL: 'https://api.example.com', CLERK_PUBLISHABLE_KEY: 'sk_test_x' }),
    ).toThrow(/pk_test_/)
  })

  it('refuses values with surrounding spaces, which the EAS workflow would inline as they are', () => {
    expect(() =>
      webBuildEnv({ API_URL: 'https://api.example.com', CLERK_PUBLISHABLE_KEY: `${KEY} ` }),
    ).toThrow(/pk_test_/)
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
