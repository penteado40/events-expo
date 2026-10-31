import { createHttpClient, type HttpClient } from '@/shared/lib/http'
import { fakeTokenFor } from '@/shared/session/__tests__/fake-clerk'

import { createMockBackend, type MockBackend } from '../backend'
import { BASE_URL, createFakeApi } from '../fake-api'

/** Who is asking: the email Clerk verified (the Session's User), or null when signed out. */
export type SignedInAs = string | null

type MockOptions = { getEmail: () => Promise<string | null>; backend: MockBackend }

/**
 * A repository's two implementations for its contract suite: the mock over a fresh mock backend,
 * and HTTP over the fake API (a fresh backend too), each signed in as the given email.
 */
export function contractImplementations<R>(
  createMock: (options: MockOptions) => R,
  createHttp: (http: HttpClient) => R,
): [string, (signedInAs: SignedInAs) => R][] {
  return [
    ['mock', (email) => createMock({ getEmail: async () => email, backend: createMockBackend() })],
    [
      'HTTP',
      (email) =>
        createHttp(
          createHttpClient({
            baseUrl: BASE_URL,
            getToken: async () => (email === null ? null : fakeTokenFor(email)),
            fetch: createFakeApi(),
          }),
        ),
    ],
  ]
}
