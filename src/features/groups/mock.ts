import { z } from 'zod'

import { mockBackend, type MockBackend } from '@/shared/mock-backend'
import { useSession } from '@/shared/session'

import { groupSchema, type GroupsRepository } from './repository'

type Options = {
  /** Who is asking: the Session's User, as the API's AuthVerifier would know them. */
  getEmail?: () => Promise<string | null>
  backend?: MockBackend
}

const sessionEmail = async () => useSession.getState().session?.user.email ?? null

/** GroupsRepository over the shared mock backend (ADR-0002), answers validated like HTTP's. */
export function createMockGroupsRepository({
  getEmail = sessionEmail,
  backend = mockBackend,
}: Options = {}): GroupsRepository {
  const identity = async () => {
    const email = await getEmail()
    return email === null ? null : { email }
  }
  return {
    list: async () => z.array(groupSchema).parse(await backend.groups(await identity())),
  }
}
