import { z } from 'zod'

/**
 * An item of `GET /events/:id/rsvps` (events-api #10): a Guest's confirmation that they're going.
 * There's no RSVP for not going (events-api ADR-0015).
 */
export const rsvpSchema = z.object({
  name: z.string(),
  email: z.string(),
  createdAt: z.iso.datetime(),
})

export type Rsvp = z.infer<typeof rsvpSchema>

export const rsvpListSchema = z.array(rsvpSchema)
