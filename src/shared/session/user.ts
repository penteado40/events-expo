import { z } from 'zod'

/** A User as returned by `GET /me`. */
export const userSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.email(),
  role: z.enum(['SUPER_ADMIN', 'USER']),
  createdAt: z.iso.datetime(),
})

export type User = z.infer<typeof userSchema>
