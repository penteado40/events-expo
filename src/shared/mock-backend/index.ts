import { createMockBackend } from './backend'

export { createMockBackend, type MockBackend, type VerifiedIdentity } from './backend'
export { DEMO_OWNER_ID, DEMO_VIEWER_ID, SUPER_ADMIN_ID } from './data'

/** The app's one fake server (Demo mode, and modules not yet live): in memory, reset on reload. */
export const mockBackend = createMockBackend({
  latencyMs: process.env.NODE_ENV === 'test' ? 0 : 300,
})
