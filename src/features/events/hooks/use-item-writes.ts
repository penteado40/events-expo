import { useMutation, useQueryClient } from '@tanstack/react-query'

import { itemsRepository, type EventItem, type EventItemChanges, type EventItemInput } from '../api'
import type { FieldWrites } from '../item-draft'
import { scheduleQueryKey } from './use-schedule'

/** A save from the editor: the item's own payload and its Fields' writes. */
export type ItemSave<Input> = { input: Input; fields: FieldWrites }

/** After a write the schedule is read again (no optimistic update in this slice). */
function useInvalidateSchedule(eventId: number) {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: scheduleQueryKey(eventId) })
}

/**
 * The Field writes, one route each (PROJ-198): deletes, edits, the new Fields at the end, then the
 * order when it is needed, with the new Fields' ids as they were added.
 */
async function writeFields(eventId: number, itemId: number, writes: FieldWrites) {
  for (const fieldId of writes.remove) await itemsRepository.removeField(eventId, itemId, fieldId)
  for (const { id, changes } of writes.update) {
    await itemsRepository.updateField(eventId, itemId, id, changes)
  }
  const added = new Map<string, number>()
  for (const { key, input } of writes.add) {
    added.set(key, (await itemsRepository.addField(eventId, itemId, input)).id)
  }
  if (writes.order) {
    const ids = writes.order.map((ref) => (typeof ref === 'number' ? ref : added.get(ref)!))
    await itemsRepository.orderFields(eventId, itemId, ids)
  }
}

/**
 * "Criar item": born published in a Draft Event, then its Fields. The schedule is read again even
 * when a Field write fails, since the item may already exist.
 */
export function useCreateItem(eventId: number) {
  const invalidateSchedule = useInvalidateSchedule(eventId)
  return useMutation<EventItem, unknown, ItemSave<EventItemInput>>({
    mutationFn: async ({ input, fields }) => {
      const created = await itemsRepository.create(eventId, input)
      await writeFields(eventId, created.id, fields)
      return created
    },
    onSettled: invalidateSchedule,
  })
}

/**
 * "Salvar" on the item's editor: sends what changed of the item (`null`: nothing), then of its
 * Fields.
 */
export function useUpdateItem(eventId: number, itemId: number) {
  const invalidateSchedule = useInvalidateSchedule(eventId)
  return useMutation<void, unknown, ItemSave<EventItemChanges | null>>({
    mutationFn: async ({ input, fields }) => {
      if (input) await itemsRepository.update(eventId, itemId, input)
      await writeFields(eventId, itemId, fields)
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
