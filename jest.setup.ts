import { notifyManager } from '@tanstack/react-query'

// TanStack Query re-renders on a timer by default, which can land after a test's act: notify at
// once instead, inside the act that caused it.
notifyManager.setScheduler((callback) => callback())

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

// Reanimated needs its native worklets runtime: use its mocks, so component tests can render screens.
jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'))
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))

// Safe-area insets come from a native provider: the library's mock answers with zero insets.
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
)

// Clerk is a native SDK with a remote service: tests use a fake with accounts, codes and sessions
// (src/shared/session/__tests__/fake-clerk.tsx), reset before each test.
jest.mock('@clerk/expo', () => require('./src/shared/session/__tests__/fake-clerk').fakeClerkModule)
jest.mock(
  '@clerk/expo/apple',
  () => require('./src/shared/session/__tests__/fake-clerk').fakeClerkAppleModule,
)
jest.mock('@clerk/expo/token-cache', () => ({ tokenCache: undefined }))

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('./src/shared/session/__tests__/fake-clerk').fakeClerk.reset()
})
