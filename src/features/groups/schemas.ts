import { z } from 'zod'

/** A Group as `GET /groups` lists it (events-api PROJ-168). */
export const groupSchema = z.object({ id: z.number().int(), name: z.string() })

export type Group = z.infer<typeof groupSchema>
