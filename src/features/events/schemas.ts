import { z } from 'zod'

import { periodSchema } from '@/shared/domain/local-dates'

/**
 * An Event as `GET /groups/:id/events` lists it (events-api PROJ-182): where (free text, a city or
 * a venue) and when (local dates in its default timezone), its state, and whether the requester is
 * a Participant. Every Group member sees every Event's where and when, Drafts included. The API
 * also sends `isFinished`, `createdAt` and `updatedAt`; the app works out a Finished event itself
 * (`isFinished` in local-dates) and drops the rest.
 */
export const eventSchema = z.object({
  id: z.number().int(),
  groupId: z.number().int(),
  name: z.string(),
  place: z.string(),
  period: periodSchema,
  /** The API has only `DRAFT` until publishing (PROJ-224) arrives. */
  state: z.enum(['DRAFT', 'PUBLISHED']),
  /**
   * Cancelled sits beside the state: un-cancelling returns the Event to it. The API does not send
   * it until cancelling (PROJ-230) arrives, and until then no Event is Cancelled.
   */
  cancelled: z.boolean().default(false),
  /**
   * Whether the requester is a Participant; `null` while the API does not say (Participants,
   * PROJ-222, not there yet), shown as neither going nor "você não vai".
   */
  isParticipant: z.boolean().nullable().default(null),
})

export type Event = z.infer<typeof eventSchema>
