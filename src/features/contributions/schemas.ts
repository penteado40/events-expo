import { z } from 'zod'

import { CONTRIBUTION_STATUSES } from '@/shared/domain/contributions'

/**
 * An item of `GET /events/:id/contributions` (events-api #17): a Guest's Pix toward a Registry
 * item, once marked paid.
 */
export const contributionSchema = z.object({
  id: z.number().int(),
  guestName: z.string(),
  registryItemId: z.number().int(),
  amount: z.number().nonnegative(),
  status: z.enum(CONTRIBUTION_STATUSES),
  paidAt: z.iso.datetime(),
  hasReceipt: z.boolean(),
})

export type Contribution = z.infer<typeof contributionSchema>

export const contributionListSchema = z.array(contributionSchema)

/** `GET /events/:id/contributions/:cid/receipt`: a signed URL that expires shortly. */
export const receiptUrlSchema = z.object({ url: z.url() })
