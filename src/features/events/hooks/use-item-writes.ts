import { useMutation, useQueryClient } from '@tanstack/react-query'

import { itemsRepository, type EventItem, type EventItemChanges, type EventItemInput } from '../api'
import { scheduleQueryKey } from './use-schedule'

/** After a write the schedule is read again (no optimistic update in this slice). */
function useOnItemWritten(eventId: number) {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: scheduleQueryKey(eventId) })
}

/** "Criar item": born published in a Draft Event. */
export function useCreateItem(eventId: number) {
  const written = useOnItemWritten(eventId)
  return useMutation<EventItem, unknown, EventItemInput>({
    mutationFn: (input) => itemsRepository.create(eventId, input),
    onSuccess: written,
  })
}

/** "Salvar" on the item's editor: sends what changed. */
export function useUpdateItem(eventId: number, itemId: number) {
  const written = useOnItemWritten(eventId)
  return useMutation<EventItem, unknown, EventItemChanges>({
    mutationFn: (changes) => itemsRepository.update(eventId, itemId, changes),
    onSuccess: written,
  })
}

/** "Apagar", after the confirmation. */
export function useDeleteItem(eventId: number) {
  const written = useOnItemWritten(eventId)
  return useMutation<void, unknown, number>({
    mutationFn: (itemId) => itemsRepository.remove(eventId, itemId),
    onSuccess: written,
  })
}
