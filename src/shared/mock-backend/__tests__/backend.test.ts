import { createMockBackend } from '../backend'

/** A real Clerk user whom the API knows but the sample data does not. */
const LIVE_STRANGER = { email: 'felipe@example.com' }

describe('mock backend with a Live session', () => {
  it('still refuses an email of no User at sign-in (GET /me)', async () => {
    await expect(createMockBackend().me(LIVE_STRANGER)).rejects.toMatchObject({
      code: 'USER_NOT_INVITED',
    })
  })

  it('answers a module not live yet as if the User were in no Group, never USER_NOT_INVITED', async () => {
    const backend = createMockBackend()

    await expect(backend.groups(LIVE_STRANGER)).resolves.toEqual([])
    await expect(backend.groupEvents(LIVE_STRANGER, 1)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  it('keeps refusing a Deactivated user and a signed-out request', async () => {
    const backend = createMockBackend()

    await expect(backend.groups({ email: 'carla.dias@example.com' })).rejects.toMatchObject({
      code: 'USER_DEACTIVATED',
    })
    await expect(backend.groups(null)).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
  })
})
