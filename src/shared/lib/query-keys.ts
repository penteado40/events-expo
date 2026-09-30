import type { DataModule } from './live-modules'

/**
 * Query keys shared across features. Everything about one Event lives under its key, so the
 * detail's pull-to-refresh refetches the Event and whatever of it is on screen in one call.
 */
export const eventsKey = ['events'] as const

export const eventKey = (id: number) => [...eventsKey, id] as const

/** A list that belongs to one Event (`GET /events/:id/<collection>`). */
export type EventCollection = Extract<DataModule, 'members' | 'rsvps' | 'contributions'>

export const eventCollectionKey = (id: number, collection: EventCollection) =>
  [...eventKey(id), collection] as const
