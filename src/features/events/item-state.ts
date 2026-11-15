import { writesEvents, type GroupRole } from '@/shared/domain/group-role'
import { plural } from '@/shared/domain/plural'
import { timeAgo } from '@/shared/domain/relative-time'
import type { Tone } from '@/shared/theme'

import type { Audience, Event, EventItem } from './schemas'

/** An Event item's state (events-api PROJ-194, PROJ-195). */
export type ItemState = EventItem['state']

/**
 * How an item's state is marked wherever the item shows (the Timeline, its actions, the Event's
 * schedule in short): its badge, the badge's tone and the word read out after its name. A
 * published item has none; a Cancelled one also has its name struck.
 */
/** The Draft badge where the item itself is open (editor, actions sheet): it says who sees it. */
export const DRAFT_BADGE = 'RASCUNHO · só Owners veem'

export const ITEM_STATE_MARKS: Record<
  ItemState,
  { badge: string; tone: Tone; spoken: string } | null
> = {
  DRAFT: { badge: 'RASCUNHO', tone: 'gold', spoken: 'rascunho' },
  PUBLISHED: null,
  CANCELLED: { badge: 'CANCELADO', tone: 'red', spoken: 'cancelado' },
}

/** What the item's actions offer, by its state, to who writes the Event's items. */
export type ItemActions = {
  edit: boolean
  publish: boolean
  cancel: boolean
  uncancel: boolean
  delete: boolean
}

const NO_ACTIONS: ItemActions = {
  edit: false,
  publish: false,
  cancel: false,
  uncancel: false,
  delete: false,
}

/**
 * The item's actions (D-AcoesItem) for a person in the Group, by the Event and the item. Only
 * Owners and the Super admin write items, and not in a Cancelled Event, frozen items and all; a
 * Viewer, a Participant or not, only reads. A Finished event is still edited. In Draft, an item is
 * edited, published or deleted; published, edited or cancelled; Cancelled, frozen, only
 * uncancelled. Deleting is for an item in Draft, and for any item of an Event in Draft, which
 * nobody sees yet (there items are born published); a published item the Group sees is cancelled
 * instead, kept visible with its badge. The API also deletes a published item. The app only hides
 * actions: the API decides.
 */
export function itemActions(
  role: GroupRole,
  event: Pick<Event, 'state' | 'cancelled'>,
  item: ItemState,
): ItemActions {
  if (!writesEvents(role) || event.cancelled) return NO_ACTIONS
  return {
    edit: item !== 'CANCELLED',
    publish: item === 'DRAFT',
    cancel: item === 'PUBLISHED',
    uncancel: item === 'CANCELLED',
    delete: item === 'DRAFT' || (item === 'PUBLISHED' && event.state === 'DRAFT'),
  }
}

/** Whether the item offers any action, and so opens its actions sheet. */
export const hasActions = (actions: ItemActions) => Object.values(actions).some(Boolean)

/**
 * Who changed the item last and when, for everyone who sees it (story 45): "Alterado por Bruno
 * Reis há 2 h", or "Alterado há 2 h" for a write by no User (a platform script). `null` while the
 * API does not send when (the schedule has no authorship yet, events-api ADR-0013).
 */
export function lastChangeText(
  item: Pick<EventItem, 'updatedAt' | 'updatedBy'>,
  now: Date,
): string | null {
  if (!item.updatedAt) return null
  const by = item.updatedBy ? ` por ${item.updatedBy.name}` : ''
  return `Alterado${by} ${timeAgo(item.updatedAt, now)}`
}

/**
 * The mark of who sees the item, for the production that sees every item (story 74): none for
 * "Todos que vão"; a chosen list, "SÓ 3 PESSOAS", by how many were chosen (whoever is in a Field
 * of people of the item sees it too, on top of them).
 */
export function audienceMark(audience: Audience): { badge: string; spoken: string } | null {
  if (audience.kind === 'ALL') return null
  const n = audience.userIds.length
  const people = plural(n, 'pessoa', 'pessoas')
  return { badge: `SÓ ${people.toUpperCase()}`, spoken: `só ${people} ${n === 1 ? 'vê' : 'veem'}` }
}
