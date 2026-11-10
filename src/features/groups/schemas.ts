import { z } from 'zod'

/** A Group as `GET /groups` lists it (events-api PROJ-168). */
export const groupSchema = z.object({ id: z.number().int(), name: z.string() })

export type Group = z.infer<typeof groupSchema>

/** A Group member as `GET /groups/:id/members` lists them (events-api PROJ-178). */
export const groupMemberSchema = z.object({
  userId: z.number().int(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  role: z.enum(['OWNER', 'VIEWER']),
  isPending: z.boolean(),
})

export type GroupMember = z.infer<typeof groupMemberSchema>

/**
 * A Team as `GET /groups/:id/teams` lists it (events-api PROJ-181), in the API's name order.
 * `members` is not served yet: PROJ-183 ("traz os membros de cada Team") is the pending source of
 * truth for its shape, assumed here as `[{ userId }]`; absent, the Team has nobody yet.
 */
const teamJsonSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  members: z.array(z.object({ userId: z.number().int() })).default([]),
})

/** A Team of the Group and who is in it, by User id. */
export type Team = { id: number; name: string; memberIds: number[] }

/** The one place the API's Team becomes the app's: change here when PROJ-183 lands. */
function toTeam({ id, name, members }: z.infer<typeof teamJsonSchema>): Team {
  return { id, name, memberIds: members.map((m) => m.userId) }
}

export const teamSchema = teamJsonSchema.transform(toTeam)

/** An Activation link to pass on, as the events-api answers it (PROJ-177, PROJ-180). */
export const activationLinkSchema = z.object({ url: z.string(), expiresAt: z.string() })

export type ActivationLink = z.infer<typeof activationLinkSchema>

/**
 * `POST /groups/:id/viewers` (events-api PROJ-177): the person now in the Group, and the Activation
 * link only when the email had no User yet (they were born a Pending user).
 */
export const addedViewerSchema = z
  .object({
    member: z.object({
      groupId: z.number().int(),
      role: z.enum(['OWNER', 'VIEWER']),
      user: z.object({
        id: z.number().int(),
        name: z.string(),
        email: z.string(),
        isPending: z.boolean(),
      }),
    }),
    activationLink: activationLinkSchema.nullable(),
  })
  .transform(({ member: { user }, activationLink }) => ({
    userId: user.id,
    name: user.name,
    email: user.email,
    isPending: user.isPending,
    activationLink,
  }))

export type AddedViewer = z.infer<typeof addedViewerSchema>
