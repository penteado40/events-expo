import { resolveApiUrl } from '../api-url'
import { apiHost } from '../http'

describe('resolveApiUrl', () => {
  it('uses EXPO_PUBLIC_API_URL when set', () => {
    expect(resolveApiUrl('http://10.0.2.2:3000/api/v1', { isDev: false })).toBe(
      'http://10.0.2.2:3000/api/v1',
    )
  })

  it('drops a trailing slash so paths join cleanly', () => {
    expect(resolveApiUrl('https://api.example.com/api/v1/', { isDev: false })).toBe(
      'https://api.example.com/api/v1',
    )
  })

  it('defaults to localhost in a development build', () => {
    expect(resolveApiUrl(undefined, { isDev: true })).toBe('http://localhost:3000/api/v1')
    expect(resolveApiUrl('', { isDev: true })).toBe('http://localhost:3000/api/v1')
  })

  it('fails loudly in a release build without it', () => {
    expect(() => resolveApiUrl(undefined, { isDev: false })).toThrow(/EXPO_PUBLIC_API_URL/)
  })
})

describe('apiHost', () => {
  it('is the host and port of the base URL', () => {
    expect(apiHost('http://localhost:3000/api/v1')).toBe('localhost:3000')
    expect(apiHost('https://api.example.com/api/v1')).toBe('api.example.com')
  })
})
