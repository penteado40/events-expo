import { z } from 'zod'

import { EVENT_ROLES } from '@/shared/domain/roles'

/** An item of `GET /events/:id/members` (events-api #6): a User's role in the Event. */
export const eventMemberSchema = z.object({
  userId: z.number().int(),
  name: z.string(),
  role: z.enum(EVENT_ROLES),
  isPrimaryOwner: z.boolean(),
})

export type EventMember = z.infer<typeof eventMemberSchema>

export const eventMemberListSchema = z.array(eventMemberSchema)
