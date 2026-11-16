import { useMutation, useQueryClient } from '@tanstack/react-query'

import { eventsRepository, type Event } from '../api'
import { eventQueryKey } from './use-event'
import { groupEventsQueryKey } from './use-group-events'
import { participantsQueryKey } from './use-participants'
import { scheduleQueryKey } from './use-schedule'

/**
 * "Publicar" (story 55): the Owner publishes the Event in Draft; then the Event as the API
 * answered it, the Group's list (its "RASCUNHO" goes), the schedule and the Participants are read
 * again.
 */
export function usePublishEvent(eventId: number) {
  const client = useQueryClient()
  return useMutation<Event, unknown, void>({
    mutationFn: () => eventsRepository.publish(eventId),
    onSuccess: (event) => {
      client.setQueryData(eventQueryKey(event.id), event)
      return Promise.all([
        client.invalidateQueries({ queryKey: groupEventsQueryKey(event.groupId) }),
        client.invalidateQueries({ queryKey: scheduleQueryKey(event.id) }),
        client.invalidateQueries({ queryKey: participantsQueryKey(event.id) }),
      ])
    },
  })
}
