// SecureStore is a native module: tests use an in-memory keychain shared by every store instance,
// so creating a second store over it behaves like reopening the app.
jest.mock('expo-secure-store', () => {
  const keychain = new Map<string, string>()
  return {
    __keychain: keychain,
    getItemAsync: jest.fn(async (key: string) => keychain.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      keychain.set(key, value)
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      keychain.delete(key)
    }),
  }
})

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('expo-secure-store').__keychain.clear()
})
