import { z } from 'zod'

import { EVENT_STATUSES, EVENT_TYPES } from '@/shared/domain/events'
import { membershipSchema } from '@/shared/domain/roles'

/**
 * An item of `GET /events` and `GET /events/:id` (events-api PROJ-55): the Event, the requester's
 * Membership (null for the Super admin) and how many Contributions await Verification.
 * `paidContributionCount` is still to land in the API (PROJ-67); until then only the mock sends it.
 */
export const eventSchema = z.object({
  id: z.number().int(),
  type: z.enum(EVENT_TYPES),
  status: z.enum(EVENT_STATUSES),
  name: z.string(),
  slug: z.string(),
  siteUrl: z.string(),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime().nullable(),
  timezone: z.string(),
  locale: z.string(),
  currency: z.string(),
  venueName: z.string().nullable(),
  venueAddress: z.string().nullable(),
  city: z.string().nullable(),
  mapsUrl: z.string().nullable(),
  membership: membershipSchema.nullable(),
  paidContributionCount: z.number().int().nonnegative(),
})

export type Event = z.infer<typeof eventSchema>

export const eventListSchema = z.array(eventSchema)
