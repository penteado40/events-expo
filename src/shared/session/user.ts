import { z } from 'zod'

/** A Group the User is a Group member of, and the role there (events-api PROJ-178). */
export const groupMembershipSchema = z.object({
  groupId: z.number().int(),
  groupName: z.string(),
  role: z.enum(['OWNER', 'VIEWER']),
})

export type GroupMembership = z.infer<typeof groupMembershipSchema>

/**
 * The local User as `GET /me` returns it (events-api PROJ-165, PROJ-178): the Membership, and
 * whether it is the Super admin, who never has one.
 */
export const userSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.email(),
  phone: z.string(),
  isSuperAdmin: z.boolean(),
  memberships: z.array(groupMembershipSchema),
})

export type User = z.infer<typeof userSchema>
