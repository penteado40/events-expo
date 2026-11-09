import { z } from 'zod'

/** A Group as `GET /groups` lists it (events-api PROJ-168). */
export const groupSchema = z.object({ id: z.number().int(), name: z.string() })

export type Group = z.infer<typeof groupSchema>

/**
 * A Group member as `GET /groups/:id/members` lists them (events-api PROJ-178). The API has no
 * Teams yet, so `teams` is optional there and empty until it does.
 */
export const groupMemberSchema = z.object({
  userId: z.number().int(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  role: z.enum(['OWNER', 'VIEWER']),
  isPending: z.boolean(),
  teams: z.array(z.object({ id: z.number().int(), name: z.string() })).default([]),
})

export type GroupMember = z.infer<typeof groupMemberSchema>

/** A Team of the Group, with how many people it has. */
export const teamSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  memberCount: z.number().int(),
})

export type Team = z.infer<typeof teamSchema>
