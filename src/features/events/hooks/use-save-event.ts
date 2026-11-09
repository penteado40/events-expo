import { useMutation, useQueryClient } from '@tanstack/react-query'

import { eventsRepository, type Event, type EventChanges, type EventInput } from '../api'
import { eventQueryKey } from './use-event'
import { groupEventsQueryKey } from './use-group-events'

/** After a write: the Event as the API answered it, and the Group's list read again. */
function useSaved() {
  const client = useQueryClient()
  return (event: Event) => {
    client.setQueryData(eventQueryKey(event.id), event)
    return client.invalidateQueries({ queryKey: groupEventsQueryKey(event.groupId) })
  }
}

/** "Criar Event": the Owner creates it in the Group, born in Draft. */
export function useCreateEvent(groupId: number) {
  const saved = useSaved()
  return useMutation<Event, unknown, EventInput>({
    mutationFn: (input) => eventsRepository.create(groupId, input),
    onSuccess: saved,
  })
}

/** "Salvar" on the editing: sends what changed. */
export function useUpdateEvent(eventId: number) {
  const saved = useSaved()
  return useMutation<Event, unknown, EventChanges>({
    mutationFn: (changes) => eventsRepository.update(eventId, changes),
    onSuccess: saved,
  })
}
