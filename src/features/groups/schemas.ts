import { z } from 'zod'

/** A Group as `GET /groups` lists it (events-api PROJ-168). */
export const groupSchema = z.object({ id: z.number().int(), name: z.string() })

export type Group = z.infer<typeof groupSchema>

export {
  groupMemberSchema,
  teamSchema,
  type GroupMember,
  type Team,
} from '@/shared/domain/group-people'

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
