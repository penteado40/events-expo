import { z } from 'zod'

/** A Group as `GET /groups` lists it (events-api PROJ-168). */
export const groupSchema = z.object({ id: z.number().int(), name: z.string() })

export type Group = z.infer<typeof groupSchema>

/** Mirrors the events-api's `groups` module; this slice only reads. */
export interface GroupsRepository {
  /** The Groups the User is a Group member of (every Group for the Super admin), by name. */
  list(): Promise<Group[]>
}
