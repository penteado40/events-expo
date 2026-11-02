import { resolveClerkKey } from '../clerk-key'

describe('resolveClerkKey', () => {
  it('uses EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY when set', () => {
    expect(resolveClerkKey('pk_test_abc', { isDev: false })).toBe('pk_test_abc')
  })

  it('is absent in a development build without it, which then offers only Demo mode', () => {
    expect(resolveClerkKey(undefined, { isDev: true })).toBeNull()
    expect(resolveClerkKey('', { isDev: true })).toBeNull()
  })

  it('fails loudly in a release build without it', () => {
    expect(() => resolveClerkKey(undefined, { isDev: false })).toThrow(
      /EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY/,
    )
  })
})
