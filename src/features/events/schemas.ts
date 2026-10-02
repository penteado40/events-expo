import { z } from 'zod'

import { EVENT_STATUSES, EVENT_TYPES } from '@/shared/domain/events'
import { membershipSchema } from '@/shared/domain/roles'

/**
 * An item of `GET /events` and `GET /events/:id` (events-api PROJ-55): the Event, the requester's
 * Membership (null for the Super admin), how many Contributions await Verification and its Event
 * summary (ADR-0003). `paidContributionCount` (PROJ-67) and `summary` (PROJ-100) are still to land
 * in the API; until then only the mock sends them.
 */
/** The Event's aggregate numbers, with no Guest data: every member sees them, archived or not. */
export const eventSummarySchema = z.object({
  /** Every RSVP is a confirmation (events-api ADR-0015). */
  rsvpCount: z.number().int().nonnegative(),
  verifiedAmount: z.number().nonnegative(),
  registryItemCount: z.number().int().nonnegative(),
})

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
  summary: eventSummarySchema,
})

export type Event = z.infer<typeof eventSchema>

export const eventListSchema = z.array(eventSchema)
