import { resolveClerkKey } from '../clerk-key'

describe('resolveClerkKey', () => {
  it('uses EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY when set', () => {
    expect(resolveClerkKey('pk_test_abc', { isDev: false, demoBuild: false })).toBe('pk_test_abc')
  })

  it('is absent in a development build without it, which then offers only Demo mode', () => {
    expect(resolveClerkKey(undefined, { isDev: true, demoBuild: false })).toBeNull()
    expect(resolveClerkKey('', { isDev: true, demoBuild: false })).toBeNull()
  })

  it('fails loudly in a release build without it', () => {
    expect(() => resolveClerkKey(undefined, { isDev: false, demoBuild: false })).toThrow(
      /EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY/,
    )
  })

  it('is absent in a Demo build, with or without a test key', () => {
    expect(resolveClerkKey(undefined, { isDev: false, demoBuild: true })).toBeNull()
    expect(resolveClerkKey('pk_test_abc', { isDev: false, demoBuild: true })).toBeNull()
  })

  it('refuses a live key in a Demo build, so a preview never carries production config', () => {
    expect(() => resolveClerkKey('pk_live_abc', { isDev: false, demoBuild: true })).toThrow(
      /pk_live_/,
    )
  })
})
