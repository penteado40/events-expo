import { z } from 'zod'

/** An item of `GET /events/:id/rsvps` (events-api #10): a Guest's answer to the invitation. */
export const rsvpSchema = z.object({
  name: z.string(),
  email: z.string(),
  attending: z.boolean(),
  createdAt: z.iso.datetime(),
})

export type Rsvp = z.infer<typeof rsvpSchema>

export const rsvpListSchema = z.array(rsvpSchema)
