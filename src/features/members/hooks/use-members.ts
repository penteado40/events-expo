import { useQuery } from '@tanstack/react-query'

import type { ApiError } from '@/shared/lib/api-error'
import { eventCollectionKey } from '@/shared/lib/query-keys'

import { membersRepository } from '../api'
import { sortMembers } from '../member-order'
import type { EventMember } from '../schemas'

/** An Event's members, in the Members card's order. */
export const useMembers = (eventId: number) =>
  useQuery<EventMember[], ApiError>({
    queryKey: eventCollectionKey(eventId, 'members'),
    queryFn: () => membersRepository.list(eventId),
    select: sortMembers,
  })
