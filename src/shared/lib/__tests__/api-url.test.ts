import { resolveApiUrl } from '../api-url'

describe('resolveApiUrl', () => {
  it('uses EXPO_PUBLIC_API_URL when set', () => {
    expect(resolveApiUrl('http://10.0.2.2:3000/api/v1', { isDev: false, demoBuild: false })).toBe(
      'http://10.0.2.2:3000/api/v1',
    )
  })

  it('drops a trailing slash so paths join cleanly', () => {
    expect(
      resolveApiUrl('https://api.example.com/api/v1/', { isDev: false, demoBuild: false }),
    ).toBe('https://api.example.com/api/v1')
  })

  it('defaults to localhost in a development build', () => {
    expect(resolveApiUrl(undefined, { isDev: true, demoBuild: false })).toBe(
      'http://localhost:3000/api/v1',
    )
    expect(resolveApiUrl('', { isDev: true, demoBuild: false })).toBe(
      'http://localhost:3000/api/v1',
    )
  })

  it('fails loudly in a release build without it', () => {
    expect(() => resolveApiUrl(undefined, { isDev: false, demoBuild: false })).toThrow(
      /EXPO_PUBLIC_API_URL/,
    )
  })

  it('needs no events-api in a Demo build, which runs only over the mock', () => {
    expect(() => resolveApiUrl(undefined, { isDev: false, demoBuild: true })).not.toThrow()
  })
})
