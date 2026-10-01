import type { RegistryItem } from './schemas'

/** Mirrors the events-api Registry endpoint: `GET /events/:id/registry-items`. */
export interface RegistryRepository {
  /** An Event's Registry items; `FORBIDDEN` for a non-member (even if it doesn't exist). */
  list(eventId: number): Promise<RegistryItem[]>
}
