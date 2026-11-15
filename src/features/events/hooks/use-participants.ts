import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { groupMembersQueryKey, groupTeamsQueryKey } from '@/shared/lib/group-query-keys'

import { groupPeopleRepository, participantsRepository } from '../api'
import { eventQueryKey } from './use-event'
import { groupEventsQueryKey } from './use-group-events'
import { scheduleQueryKey } from './use-schedule'

export const participantsQueryKey = (eventId: number) =>
  ['events', eventId, 'participants'] as const

/**
 * Whether Participants exist here: not over the events-api yet (PROJ-186, PROJ-190), where the app
 * shows and chooses none.
 */
export const participantsAvailable = () => participantsRepository.available()

/** Who goes to the Event (`GET /events/:id/participants`), for any Group member. */
export function useParticipants(eventId: number, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: participantsQueryKey(eventId),
    queryFn: () => participantsRepository.list(eventId),
    enabled,
  })
}

/** The Group members, to choose Participants from (the groups feature's cache). */
export function useGroupMembers(groupId: number) {
  return useQuery({
    queryKey: groupMembersQueryKey(groupId),
    queryFn: () => groupPeopleRepository.listMembers(groupId),
  })
}

/** The Group's Teams, the shortcuts to Participants and Audiences (the groups feature's cache). */
export function useGroupTeams(groupId: number, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: groupTeamsQueryKey(groupId),
    queryFn: () => groupPeopleRepository.listTeams(groupId),
    enabled,
  })
}

/**
 * Marking and unmarking Participants (no optimistic update in this slice). After each write, done
 * or not, the Participants, the Event (whether the requester goes), its schedule (who is out of
 * the Event in the Fields of people) and the Group's list of Events are read again.
 */
export function useParticipantWrites(groupId: number, eventId: number) {
  const client = useQueryClient()
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: participantsQueryKey(eventId), exact: true }),
      client.invalidateQueries({ queryKey: eventQueryKey(eventId), exact: true }),
      client.invalidateQueries({ queryKey: scheduleQueryKey(eventId) }),
      client.invalidateQueries({ queryKey: groupEventsQueryKey(groupId) }),
    ])
  /** One person, or a Team's people not going yet ("Marcar Team"), one route call each. */
  const add = useMutation<void, unknown, number[]>({
    mutationFn: async (userIds) => {
      for (const userId of userIds) await participantsRepository.add(eventId, userId)
    },
    onSettled: refresh,
  })
  const remove = useMutation<void, unknown, number>({
    mutationFn: (userId) => participantsRepository.remove(eventId, userId),
    onSettled: refresh,
  })
  return { add, remove }
}
