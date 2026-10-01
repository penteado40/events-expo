import { z } from 'zod'

/** An item of `GET /events/:id/registry-items` (events-api #13): a gift on the Event's Registry. */
export const registryItemSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  /** Reference price, in the Event's currency. */
  price: z.number(),
  /** Optional in the API: an item may have no image. */
  imageUrl: z.url().nullable(),
  /** Contributions a Guest marked paid and nobody rejected (`PAID` + `VERIFIED`). */
  contributionCount: z.number().int(),
})

export type RegistryItem = z.infer<typeof registryItemSchema>

export const registryItemListSchema = z.array(registryItemSchema)
