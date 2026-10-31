import type { Group } from './schemas'

/** Mirrors the events-api's `groups` module; this slice only reads. */
export interface GroupsRepository {
  /** The Groups the User is a Group member of (every Group for the Super admin), by name. */
  list(): Promise<Group[]>
}
