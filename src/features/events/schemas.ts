import { z } from 'zod'

import { localDateSchema, localTimeSchema, periodSchema } from '@/shared/domain/local-dates'

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

/**
 * When an Event item starts, as the place tells it (events-api PROJ-187, ADR-0016): the date, the
 * time (`null` when only the day is known: "a definir") and the zone of its place or else the
 * Event's. Never converted: the zone only labels the time.
 */
export const itemWhenSchema = z.object({
  date: localDateSchema,
  time: localTimeSchema.nullable(),
  timezone: z.string().min(1),
})

export type ItemWhen = z.infer<typeof itemWhenSchema>

/** Where an Event item happens: each part optional; no zone of its own means the Event's. */
export const itemPlaceSchema = z.object({
  name: z.string().nullable(),
  address: z.string().nullable(),
  timezone: z.string().nullable(),
})

export type ItemPlace = z.infer<typeof itemPlaceSchema>

/**
 * An Event item as the schedule shows it and a write returns it (PROJ-187). `when` is `null` for an
 * item of the General info (no date). The API also sends `eventId`, `createdAt` and `updatedAt` on
 * a write; the app drops them.
 */
export const eventItemSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  when: itemWhenSchema.nullable(),
  place: itemPlaceSchema.nullable(),
  /** The API has only `PUBLISHED` (items born published in a Draft Event) until PROJ-224. */
  state: z.enum(['DRAFT', 'PUBLISHED']),
})

export type EventItem = z.infer<typeof eventItemSchema>

/**
 * `GET /events/:id/schedule` (PROJ-187): the General info (items with no date, in the production's
 * order) and the Timeline (only the days with items, in date order, those outside the period too).
 */
export const scheduleSchema = z.object({
  generalInfo: z.array(eventItemSchema),
  timeline: z.array(z.object({ date: localDateSchema, items: z.array(eventItemSchema) })),
})

export type Schedule = z.infer<typeof scheduleSchema>
