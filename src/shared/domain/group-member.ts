import { z } from 'zod'

/**
 * A Group member as `GET /groups/:id/members` lists them (events-api PROJ-178). Shared: the groups
 * feature and the events feature (choosing Participants) both read them.
 */
export const groupMemberSchema = z.object({
  userId: z.number().int(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  role: z.enum(['OWNER', 'VIEWER']),
  isPending: z.boolean(),
})

export type GroupMember = z.infer<typeof groupMemberSchema>
