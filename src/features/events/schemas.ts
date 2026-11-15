import { z } from 'zod'

import { groupMemberSchema } from '@/shared/domain/group-member'
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
 * A text Field of an Event item (events-api PROJ-198, PROJ-200): a name and a value (obs,
 * contatos, voltagem, o que levar; a list, a phone or a link are text too), and the Highlight that
 * takes it to the Summary ("no Resumo").
 */
export const textFieldSchema = z.object({
  id: z.number().int(),
  type: z.literal('TEXT'),
  name: z.string(),
  value: z.string(),
  highlight: z.boolean(),
})

export type TextField = z.infer<typeof textFieldSchema>

/** Who sees the Personal notes of a Field of people: each their own, or everyone the item reaches. */
export const personalNotesVisibilitySchema = z.enum(['PRIVATE', 'ALL'])

export type PersonalNotesVisibility = z.infer<typeof personalNotesVisibilitySchema>

/**
 * One person in a Field of people (events-api PROJ-201, PROJ-203, PROJ-204, PROJ-205, not built
 * there yet; shape assumed): a Participant (`userId`), or a loose name of someone with no login
 * (`userId: null`), which only shows there. `outOfEvent` marks a User who stopped being a
 * Participant and stays in the Field until the production takes them out.
 */
export const fieldPersonSchema = z.object({
  userId: z.number().int().nullable(),
  name: z.string(),
  personalNote: z.string().nullable().default(null),
  outOfEvent: z.boolean().default(false),
})

export type FieldPerson = z.infer<typeof fieldPersonSchema>

/**
 * A Field of people (carros, quartos): its people in the production's order, each with a Personal
 * note, seen only by that person and the production unless the Field shows them to everyone.
 */
export const peopleFieldSchema = z.object({
  id: z.number().int(),
  type: z.literal('PEOPLE'),
  name: z.string(),
  highlight: z.boolean(),
  personalNotesVisibility: personalNotesVisibilitySchema.default('PRIVATE'),
  people: z.array(fieldPersonSchema),
})

export type PeopleField = z.infer<typeof peopleFieldSchema>

/** A Field of an Event item: of one type, text or people. */
export const itemFieldSchema = z.discriminatedUnion('type', [textFieldSchema, peopleFieldSchema])

export type ItemField = z.infer<typeof itemFieldSchema>

/**
 * Who an Event item reaches (events-api PROJ-197, PROJ-199, not built there yet; shape assumed):
 * `ALL`, "Todos que vão", follows the Participants; `SELECTED` is a list of people that does not
 * change on its own (only leaving the Event takes someone out). Teams are copied into it, never
 * kept. Whoever is in a Field of people of the item is reached too, on top of it.
 */
export const audienceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('ALL') }),
  z.object({ kind: z.literal('SELECTED'), userIds: z.array(z.number().int()) }),
])

export type Audience = z.infer<typeof audienceSchema>

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
  /**
   * Born published in a Draft Event and in Draft in a published one (PROJ-194); a published item
   * is Cancelled until uncancelled, back to published (PROJ-195).
   */
  state: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']),
  /** In the production's order; none while the API does not send them (PROJ-198). */
  fields: z.array(itemFieldSchema).default([]),
  /** "Todos que vão" while the API does not send it (PROJ-197). */
  audience: audienceSchema.default({ kind: 'ALL' }),
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

/**
 * A Participant as `GET /events/:id/participants` lists them. PROJ-186 (not built in the
 * events-api yet) promises name, phone and role; the shape is assumed like a Group member's.
 */
export const participantSchema = z.object({
  userId: z.number().int(),
  name: z.string(),
  phone: z.string(),
  role: groupMemberSchema.shape.role,
})

export type Participant = z.infer<typeof participantSchema>
