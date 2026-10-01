import { createMockBackend } from './backend'

export { createMockBackend, mockTokenFor, type MockBackend } from './backend'
export { DEMO_MANAGER_ID, DEMO_USER_ID, SUPER_ADMIN_ID } from './data'

/** The app's one fake server (Demo mode, and modules not yet live): in memory, reset on reload. */
export const mockBackend = createMockBackend({
  latencyMs: process.env.NODE_ENV === 'test' ? 0 : 300,
})
