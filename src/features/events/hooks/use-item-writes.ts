import { useMutation, useQueryClient } from '@tanstack/react-query'

import { itemsRepository, type EventItem, type EventItemChanges, type EventItemInput } from '../api'
import { scheduleQueryKey } from './use-schedule'

/** After a write the schedule is read again (no optimistic update in this slice). */
function useInvalidateSchedule(eventId: number) {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: scheduleQueryKey(eventId) })
}

/** "Criar item": born published in a Draft Event. */
export function useCreateItem(eventId: number) {
  const invalidateSchedule = useInvalidateSchedule(eventId)
  return useMutation<EventItem, unknown, EventItemInput>({
    mutationFn: (input) => itemsRepository.create(eventId, input),
    onSuccess: invalidateSchedule,
  })
}

/** "Salvar" on the item's editor: sends what changed. */
export function useUpdateItem(eventId: number, itemId: number) {
  const invalidateSchedule = useInvalidateSchedule(eventId)
  return useMutation<EventItem, unknown, EventItemChanges>({
    mutationFn: (changes) => itemsRepository.update(eventId, itemId, changes),
    onSuccess: invalidateSchedule,
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
