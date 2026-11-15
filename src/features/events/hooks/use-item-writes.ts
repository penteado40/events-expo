import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'

import { itemsRepository, type EventItem, type EventItemChanges, type EventItemInput } from '../api'
import { fieldKey, FieldWriteError, type FieldWrites } from '../item-draft'
import { scheduleQueryKey } from './use-schedule'

/**
 * A save from the editor: the item's own payload, its Fields' writes and, from "Publicar" on an
 * item in Draft, its publishing after them.
 */
export type ItemSave<Input> = { input: Input; fields: FieldWrites; publish?: boolean }

/** After a write the schedule is read again (no optimistic update in this slice). */
function useInvalidateSchedule(eventId: number) {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: scheduleQueryKey(eventId) })
}

/**
 * The Field writes, one route each (PROJ-198): deletes, edits, the new Fields at the end, then the
 * order when it is needed, with the new Fields' ids as they were added. `added` holds the ids of
 * the new Fields a failed save already added (by key): saving again edits them instead. A refused
 * add or edit throws a `FieldWriteError` with the Field's key.
 */
async function writeFields(
  eventId: number,
  itemId: number,
  writes: FieldWrites,
  added = new Map<string, number>(),
) {
  const onField = async (key: string, write: () => Promise<unknown>) => {
    try {
      await write()
    } catch (error) {
      throw new FieldWriteError(key, error)
    }
  }
  for (const fieldId of writes.remove) await itemsRepository.removeField(eventId, itemId, fieldId)
  for (const { id, changes } of writes.update) {
    await onField(fieldKey(id), () => itemsRepository.updateField(eventId, itemId, id, changes))
  }
  for (const { key, input } of writes.add) {
    const { type: _, ...changes } = input
    const id = added.get(key)
    await onField(key, async () => {
      if (id !== undefined) await itemsRepository.updateField(eventId, itemId, id, changes)
      else added.set(key, (await itemsRepository.addField(eventId, itemId, input)).id)
    })
  }
  if (writes.order) {
    const ids = writes.order.map((ref) => (typeof ref === 'number' ? ref : added.get(ref)!))
    await itemsRepository.orderFields(eventId, itemId, ids)
  }
}

/**
 * "Criar item": born published in a Draft Event and in Draft in a published one, then its Fields,
 * then, from "Publicar", its publishing. When a write fails after the item was created, saving
 * again edits that item and the Fields already added, never creating them twice; the schedule is
 * read again either way.
 */
export function useCreateItem(eventId: number) {
  const invalidateSchedule = useInvalidateSchedule(eventId)
  const created = useRef<{ item: EventItem; added: Map<string, number> } | null>(null)
  return useMutation<EventItem, unknown, ItemSave<EventItemInput>>({
    mutationFn: async ({ input, fields, publish }) => {
      const item = created.current
        ? await itemsRepository.update(eventId, created.current.item.id, input)
        : await itemsRepository.create(eventId, input)
      created.current ??= { item, added: new Map() }
      await writeFields(eventId, item.id, fields, created.current.added)
      return publish ? itemsRepository.publish(eventId, item.id) : item
    },
    onSettled: invalidateSchedule,
  })
}

/**
 * "Salvar" on the item's editor: sends what changed of the item (`null`: nothing), then of its
 * Fields; "Publicar" on an item in Draft publishes it after them.
 */
export function useUpdateItem(eventId: number, itemId: number) {
  const invalidateSchedule = useInvalidateSchedule(eventId)
  return useMutation<void, unknown, ItemSave<EventItemChanges | null>>({
    mutationFn: async ({ input, fields, publish }) => {
      if (input) await itemsRepository.update(eventId, itemId, input)
      await writeFields(eventId, itemId, fields)
      if (publish) await itemsRepository.publish(eventId, itemId)
    },
    onSettled: invalidateSchedule,
  })
}

/** "Apagar", after the confirmation. */
export function useDeleteItem(eventId: number) {
  const invalidateSchedule = useInvalidateSchedule(eventId)
  return useMutation<void, unknown, number>({
    mutationFn: (itemId) => itemsRepository.remove(eventId, itemId),
    onSuccess: invalidateSchedule,
  })
}

/** A move of the item's state from its actions (PROJ-194, PROJ-195). */
export type ItemMove = 'publish' | 'cancel' | 'uncancel'

/** "Publicar", "Cancelar item" or "Descancelar", then the schedule read again. */
export function useMoveItem(eventId: number) {
  const invalidateSchedule = useInvalidateSchedule(eventId)
  return useMutation<EventItem, unknown, { itemId: number; move: ItemMove }>({
    mutationFn: ({ itemId, move }) => itemsRepository[move](eventId, itemId),
    onSuccess: invalidateSchedule,
  })
}
