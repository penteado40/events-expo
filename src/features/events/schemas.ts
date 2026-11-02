import { z } from 'zod'

import { periodSchema } from '@/shared/domain/local-dates'

/**
 * An Event as `GET /groups/:id/events` lists it (events-api PROJ-182): where (free text, a city or
 * a venue) and when (local dates in its default timezone), its state, and whether the requester is
 * a Participant. Every Group member sees every Event's where and when, Drafts included.
 * Provisional: the field names close with the API's OpenAPI when `events` goes live.
 */
export const eventSchema = z.object({
  id: z.number().int(),
  groupId: z.number().int(),
  name: z.string(),
  place: z.string(),
  period: periodSchema,
  status: z.enum(['DRAFT', 'PUBLISHED']),
  /** Cancelled sits beside the status: un-cancelling returns the Event to it. */
  cancelled: z.boolean(),
  isParticipant: z.boolean(),
})

export type Event = z.infer<typeof eventSchema>
