import { z } from 'zod'

import { userSchema } from '@/shared/session/user'

export const loginInputSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export type LoginInput = z.infer<typeof loginInputSchema>

/** `data` of `POST /auth/login`. */
export const loginResponseSchema = z.object({
  token: z.string().min(1),
  user: userSchema,
})

export type LoginResponse = z.infer<typeof loginResponseSchema>
