import type { Tone } from '@/shared/theme'

import type { Event, EventItem } from './schemas'

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

/**
 * In Draft, an item is edited, published or deleted; published, edited or cancelled; Cancelled,
 * frozen, only uncancelled. Deleting is for an item in Draft, and for any item of an Event in
 * Draft, which nobody sees yet (there items are born published); a published item the Group sees
 * is cancelled instead, kept visible with its badge. The API also deletes a published item.
 */
export function itemActions(item: ItemState, event: Event['state']): ItemActions {
  return {
    edit: item !== 'CANCELLED',
    publish: item === 'DRAFT',
    cancel: item === 'PUBLISHED',
    uncancel: item === 'CANCELLED',
    delete: item === 'DRAFT' || (item === 'PUBLISHED' && event === 'DRAFT'),
  }
}
