/**
 * Query keys shared across features. Everything about one Event lives under its key, so the
 * detail's pull-to-refresh refetches the Event and whatever of it is on screen in one call.
 */
export const eventKey = (id: number) => ['events', id] as const

export type EventCollection = 'members' | 'rsvps' | 'contributions'

export const eventCollectionKey = (id: number, collection: EventCollection) =>
  [...eventKey(id), collection] as const
